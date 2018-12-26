const Crd = require('./Crd');

module.exports = {
	SystemMap: function() {
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
		
		this.removeOldAnomalies = function(timeMs) {
			var oldAnoms = [];
			
			this.forAllMapObj(function(mapObj) {
				if(mapObj.pathObj.endsBefore(timeMs))
					oldAnoms.push(mapObj.id);
			});
			
			oldAnoms.forEach(this.removeAnomaly);
			
			return oldAnoms.length;
		};
		
		this.updateAllPos = function(timeMs) {
			this.forActiveMapObj(function(mapObj) {
				mapObj.path.updatePos(timeMs);
			});
		};
		
		this.activateAll = function() {
			this.forAllMapObj(function(mapObj) {
				mapObj.active = true;
			});
		};
		
		/**
		 * Takes a coordinate and translates it to the corresponding coordinate based
		 * on a different parent celestial body ID. Creates a new coordinate to return.
		 */
		this.translateCrd = function(crd, pcb) {
			if(crd.pcb == pcb)
				return new Crd.Crd().copy(crd);
			
			this.updateAllPos(crd.tms);
			
			// TODO
			
			return new Crd.Crd();
		};
	}
};
