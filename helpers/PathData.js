const DataValidator = require('./DataValidator');
const OrbitalMechanics = require('./OrbitalMechanics');
const Bezier = require('bezier-js');

module.exports = {
	PATH_NONE:  0, // TODO remove
	PATH_POINT: 1,
	PATH_ORBIT: 2,
	PATH_CURVE: 3,
	
	PATH_SEG_NONE:  0,
	PATH_SEG_ORBIT: 1,
	PATH_SEG_CURVE: 2,
	
	LOC_TYPE_UNKNOWN: 0,
	LOC_TYPE_STATION: 1,
	LOC_TYPE_ROUTE:   2,
	LOC_TYPE_DOCKING: 3,
	
	templates: function() {
		var obj = {};
		
		obj.point = {
			x: {type: DataValidator.DATA_FLOAT},
			y: {type: DataValidator.DATA_FLOAT}
		};
		
		obj.crd = {
			pos: {type: DataValidator.DATA_OBJ, template: obj.point},
			mov: {type: DataValidator.DATA_OBJ, template: obj.point},
			tMs: {type: DataValidator.DATA_INT}
		};
		
		obj.orbit = {
			distanceFromParent: {type: DataValidator.DATA_INT},
			orbitalPeriodHours: {type: DataValidator.DATA_INT},
			thetaOffsetDeg: {type: DataValidator.DATA_FLOAT},
			parentId: {type: DataValidator.DATA_INT}
		};
		
		obj.pathSeg = {
			sCrd: {type: DataValidator.DATA_OBJ, template: obj.crd},
			eCrd: {type: DataValidator.DATA_OBJ, template: obj.crd},
			pathCtrl1: {type: DataValidator.DATA_OBJ, template: obj.point},
			pathCtrl2: {type: DataValidator.DATA_OBJ, template: obj.point},
			fuelBurn: {type: DataValidator.DATA_FLOAT}
		};
		
		obj.path = {
			pathSegs: {type: DataValidator.DATA_ARR, arrType: DataValidator.DATA_OBJ, template: obj.pathSeg},
			dest: {type: DataValidator.DATA_OBJ, template: {
				loc_type: {type: DataValidator.DATA_INT},
				loc_id: {type: DataValidator.DATA_INT}
			}}
		};
		
		obj.destNone = obj.destStation = {
			loc_type: {type: DataValidator.DATA_INT},
			loc_id: {type: DataValidator.DATA_INT}
		};
		
		obj.destOrbit = {
			loc_type: {type: DataValidator.DATA_INT},
			loc_id: {type: DataValidator.DATA_INT},
			data: {type: DataValidator.DATA_OBJ, template: obj.orbit}
		};
		
		obj.destPath = {
			loc_type: {type: DataValidator.DATA_INT},
			loc_id: {type: DataValidator.DATA_INT},
			data: {type: DataValidator.DATA_OBJ, template: obj.path}
		};
		
		return obj;
	},
	
	PathObj: function() {
		//this.type = module.exports.PATH_NONE;
		this.pos = {x: 0, y: 0};
		this.data = {};
		this.pathSegs = [];
		
		this.updatePos = function(timeMs) {
			var i = this.getActiveSegIndex(timeMs);
			if(-1 == i)
				return false;
			
			switch(this.pathSegs[i].type) {
				case module.exports.PATH_SEG_ORBIT:
					module.exports.updatePosOrbit(this.pathSegs[i], this.pos);
					break;
					
				case module.exports.PATH_SEG_CURVE:
					module.exports.updatePosCurve(this.pathSegs[i], this.pos);
					break;
					
				default:
					throw "Unhandled path seg type: " + this.pathSegs[i].type;
			}
			
			return true;
		};
		
		this.getActiveSegIndex = function(timeMs) {
			for(let i = 0; i < this.pathSegs.length; i++) {
				if(this.pathSegs[i].sCrd.tMs < timeMs && this.pathSegs[i].eCrd.tMs > timeMs)
					return i;
			}
			
			return -1;
		};
		
		this.toJson = function() {
			// TODO make it so we're able to check data with a template based on type
			// This will be used in the getPath switch as well
			return JSON.stringify(DataValidator.cleanObj(this, {
				type: {type: DataValidator.DATA_INT},
				data: {type: DataValidator.DATA_ANY}
			}));
		};
	},
	
	PathSeg: function() {
		this.type = 0; // TODO create seg types, reuse old types?
		this.sCrd = {tMs: 0, pos: {x: 0, y: 0}, mov: {x: 0, y: 0}};
		this.eCrd = Object.assign({}, this.sCrd);
		this.data = {};
	},
	
	getPathObj: function(pathData) {},
	
	getPathSeg: function(pathType, pathData) {
		var pathObj = new module.exports.PathObj();
		
		switch(DataValidator.cleanData(pathType, DataValidator.DATA_INT)) {
			case module.exports.PATH_NONE:
				pathObj.type = module.exports.PATH_NONE;
				pathObj.updatePos = module.exports.updatePosNone;
			break;
			
			case module.exports.PATH_POINT:
				pathObj.type = module.exports.PATH_POINT;
				pathObj.updatePos = module.exports.updatePosPoint;
			break;
			
			case module.exports.PATH_ORBIT:
				pathObj.type = module.exports.PATH_ORBIT;
				pathObj.updatePos = module.exports.updatePosOrbit;
				
				pathObj.data = DataValidator.cleanObj(pathData, module.exports.templates().orbit);
				
				// By default we orbit around the origin, but this is typically set to
				// another path's pos in the MapData map construction
				pathObj.data.parentPos = {x: 0, y: 0};
			break;
			
			case module.exports.PATH_CURVE:
				pathObj.type = module.exports.PATH_CURVE;
				pathObj.updatePos = module.exports.updatePosCurve;
				
				pathObj.data = DataValidator.cleanObj(pathData, {
					pathSegs: {
						type: DataValidator.DATA_ARR,
						arrType: DataValidator.DATA_OBJ,
						template: module.exports.templates().pathSeg
					},
					
//					destType: {},
//					destData: {type: DataValidator.DATA_OBJ, template: {
//						// TODO
//					}},
				});
				
				for(let i = 0; i < pathObj.data.pathSegs.length; i++) {
					pathObj.data.pathSegs[i].posCurve = new Bezier(
						pathObj.data.pathSegs[i].sCrd.pos.x,
						pathObj.data.pathSegs[i].sCrd.pos.y,
						pathObj.data.pathSegs[i].pathCtrl1.x,
						pathObj.data.pathSegs[i].pathCtrl1.y,
						pathObj.data.pathSegs[i].pathCtrl2.x,
						pathObj.data.pathSegs[i].pathCtrl2.y,
						pathObj.data.pathSegs[i].eCrd.pos.x,
						pathObj.data.pathSegs[i].eCrd.pos.y
					);
				}
			break;
			
			default:
				throw "Unrecognized path type: "+ pathType;
			break;
		}
		
		return pathObj;
	},
	
	updatePosNone: function(timeMs) {},
	updatePosPoint: function(timeMs) {},
	
	updatePosOrbit: function(timeMs) {
		// TODO modify how we're getting the orbital position so that we can just update this.pos directly
		// We don't override this.pos because it is potentially referenced by other Path objects
		var tempPos = OrbitalMechanics().getOrbitalPosition(
			this.data.parentPos,
			this.data.distanceFromParent,
			this.data.orbitalPeriodHours,
			timeMs,
			this.data.thetaOffsetDeg
		);
		
		this.pos.x = tempPos.x;
		this.pos.y = tempPos.y;
	},
	
	updatePosCurve: function(timeMs) {
		for(let i = 0; i < this.data.pathSegs.length; i++) {
			if(this.data.pathSegs[i].sCrd.tMs <= timeMs && this.data.pathSegs[i].eCrd.tMs >= timeMs) {
				var tempPos = this.data.pathSegs[i].posCurve.get(
					(timeMs - this.data.pathSegs[i].sCrd.tMs) / (this.data.pathSegs[i].eCrd.tMs - this.data.pathSegs[i].sCrd.tMs)
				);
				
				this.pos.x = tempPos.x;
				this.pos.y = tempPos.y;
				
				return;
			}
		}
		
		// If we get here it means we did not find an active segment
		// TODO emit an event to let the map know?
		this.updatePos = module.exports.updatePosNone;
	},
};
