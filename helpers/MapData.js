const DataSources = require('../data/DataSources');
const PathData = require('./PathData');

module.exports = {
	SOL_ID: 1, // ID of the sun in the db
	
	MAPOBJ_CELBODY: 1,
	MAPOBJ_STATION: 2,
	MAPOBJ_ANOMALY: 3,
	
	ANOM_UNKNOWN:       0,
	ANOM_SHIP:          1,
	ANOM_COMMUNICATION: 2, // Distress calls, regular comms
	ANOM_EXPLOSION:     3, // Weapons fire, ship destruction
	ANOM_CARGO:         4, // Items
	
	MapObj: function(type, id) {
		this.type      = type;
		this.id        = id;
		this.imgUrl    = '';
		this.active    = true;
		this.path      = new PathData.PathObj();
	},
	
	SystemMap : function() {
		var _mapObjs = [];
		
		this.forActiveMapObj = function(callback) {
			_mapObjs.forEach(function(e) {
				if(e.active)
					callback(e);
			});
		};
		
		this.forAllMapObj = function(callback) {
			_mapObjs.forEach(function(e) {
				callback(e);
			});
		};
		
		this.addMapObj = function(mapObj) {
			if(undefined != _mapObjs.find(e => e.type == mapObj.type && e.id == mapObj.id))
				throw "Adding map obj that already exists. type " + mapObj.type + " id: " + mapObj.id;
			
			if(PathData.PATH_ORBIT == mapObj.path.type) {
				mapObj.path.data.parentPos = _mapObjs.find(e => module.exports.MAPOBJ_CELBODY == e.type && e.id == mapObj.path.data.parentId).path.pos;
				
				if(undefined == mapObj.path.data.parentPos)
					throw "Could not find parent. ID: " + mapObj.path.data.parentId;
			}
			
			_mapObjs.push(mapObj);
		},
		
		this.removeAnomaly = function(id) {
			var index;
			
			for(index = 0; index < _mapObjs.length; index++) {
				if(_mapObjs[index].type == module.exports.MAPOBJ_ANOMALY && _mapObjs[index].id == id)
					break;
			}
			
			if(index < _mapObjs.length)
				_mapObjs.splice(index, 1);
		};
		
		this.updateAllPos = function(timeMs) {
			this.forActiveMapObj(function(mapObj) {
				mapObj.path.updatePos(timeMs);
			});
		};
	},
	
	/**
	 * Function to build a system map object with celestial bodies and stations
	 * included. Also fetches anomaly data for the player as well as their own
	 * route if it exists.
	 *
	 * @return SystemMap
	 */
	buildSystemMap: function(dataBox, callback) {
		var systemMap = new this.SystemMap();
		
		var mapObj;
		
		dataBox.getData(DataSources.DAO_CEL_BODIES, 0, function(defCelBodies) {
			// First we add the sun
			var defSol = defCelBodies.find(e => module.exports.SOL_ID == e.celestial_body_id);
			
			mapObj = new module.exports.MapObj(module.exports.MAPOBJ_CELBODY, defSol.celestial_body_id);
			mapObj.imgUrl = defSol.img_url;
			mapObj.path = new PathData.PathObj();
			mapObj.path.type = PathData.PATH_POINT; // Sun doesn't move
			
			systemMap.addMapObj(mapObj);
			
			var bodyArr = [];
			bodyArr.push(defSol.celestial_body_id);
			
			for(let i = 0; i < bodyArr.length; i++) {
				defCelBodies.filter(e => e.parent_body_id == bodyArr[i]).forEach(function(defCelBody) {
					bodyArr.push(defCelBody.celestial_body_id);
					
					mapObj = new module.exports.MapObj(module.exports.MAPOBJ_CELBODY, defCelBody.celestial_body_id);
					mapObj.imgUrl = defCelBody.img_url;
					
					mapObj.path = new PathData.getPath(PathData.PATH_ORBIT, {
						distanceFromParent: defCelBody.distance_from_parent,
						orbitalPeriodHours: defCelBody.distance_from_parent * 50,
						thetaOffsetDeg: 0,
						parentId: defCelBody.parent_body_id
					});
					
					systemMap.addMapObj(mapObj);
				});
			}
			
			callback(systemMap);
		});
	}
};
