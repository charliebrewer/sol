const DataSources = require('../data/DataSources');
const OrbitalMechanics = require('./OrbitalMechanics');

module.exports = {
	SOL_ID: 1, // ID of the sun in the db
	
	MAPOBJ_CELBODY: 'celbody',
	MAPOBJ_STATION: 'station',
	MAPOBJ_ANOMALY: 'anomaly',
	
	ANOM_UNKNOWN:       'unknown',
	ANOM_SHIP:          'ship',
	ANOM_COMMUNICATION: 'communication', // Distress calls, regular comms
	ANOM_EXPLOSION:     'explosion', // Weapons fire, ship destruction
	ANOM_CARGO:         'cargo', // Items
	
	PATH_NONE:  'none',
	PATH_POINT: 'point',
	PATH_ORBIT: 'orbit',
	PATH_CURVE: 'curve',
	
	MapObj: function(type, id) {
		this.type      = type;
		this.id        = id;
		this.imgUrl    = '';
		this.active    = true;
		this.pos       = {x: 0, y: 0};
		this.path      = {type: module.exports.PATH_NONE, data: {}};
		
		this.updatePos = function(timeMs) {};
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
			
			if(module.exports.PATH_ORBIT == mapObj.path.type) {
				mapObj.path.data.parentMapObj = _mapObjs.find(e => module.exports.MAPOBJ_CELBODY == e.type && e.id == mapObj.path.data.parentId);
				
				if(undefined == mapObj.path.data.parentMapObj)
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
				mapObj.updatePos(timeMs);
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
			mapObj.path.type = module.exports.PATH_POINT; // Sun doesn't move
			
			systemMap.addMapObj(mapObj);
			
			var bodyArr = [];
			bodyArr.push(defSol.celestial_body_id);
			
			for(let i = 0; i < bodyArr.length; i++) {
				defCelBodies.filter(e => e.parent_body_id == bodyArr[i]).forEach(function(defCelBody) {
					bodyArr.push(defCelBody.celestial_body_id);
					
					mapObj = new module.exports.MapObj(module.exports.MAPOBJ_CELBODY, defCelBody.celestial_body_id);
					mapObj.imgUrl = defCelBody.img_url;
					
					mapObj.path.type = module.exports.PATH_ORBIT;
					mapObj.path.data.distanceFromParent = defCelBody.distance_from_parent;
					mapObj.path.data.orbitalPeriodHours = 1000 + Math.random() * 8000; // TODO populate this correctly
					mapObj.path.data.thetaOffsetDeg = 0;
					mapObj.path.data.parentId = defCelBody.parent_body_id;
					
					mapObj.updatePos = module.exports.updatePosOrbit;
					
					systemMap.addMapObj(mapObj);
				});
			}
			
			callback(systemMap);
		});
	},
	
	updatePosOrbit: function(timeMs) {
		this.pos = OrbitalMechanics().getOrbitalPosition(
			this.path.data.parentMapObj.pos,
			this.path.data.distanceFromParent,
			this.path.data.orbitalPeriodHours,
			timeMs,
			this.path.data.thetaOffsetDeg
		);
	},
};
