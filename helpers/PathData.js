const DataValidator = require('./DataValidator');
const OrbitalMechanics = require('./OrbitalMechanics');
const Bezier = require('bezier-js');

module.exports = {
	PATH_NONE:  0,
	PATH_POINT: 1,
	PATH_ORBIT: 2,
	PATH_CURVE: 3,
	
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
		
		obj.pathSeg = {
			sCrd: {type: DataValidator.DATA_OBJ, template: obj.crd},
			eCrd: {type: DataValidator.DATA_OBJ, template: obj.crd},
			pathCtrl1: {type: DataValidator.DATA_OBJ, template: obj.point},
			pathCtrl2: {type: DataValidator.DATA_OBJ, template: obj.point},
			fuelBurn: {type: DataValidator.DATA_FLOAT}
		};
		
		return obj;
	},
	
	PathObj: function() {
		this.type = module.exports.PATH_NONE;
		this.pos = {x: 0, y: 0};
		this.data = {};
		
		this.updatePos = function(timeMs) {};
		
		this.toJson = function() {
			// TODO make it so we're able to check data with a template based on type
			// This will be used in the getPath switch as well
			return JSON.stringify(DataValidator.cleanObj(this, {
				type: {type: DataValidator.DATA_INT},
				data: {type: DataValidator.DATA_ANY}
			}));
		};
	},
	
	getPathFromJson: function(pathJson) {
		var tempPath = JSON.parse(pathJson);
		return module.exports.getPath(tempPath.type, tempPath.data);
	},
	
	getPath: function(pathType, pathData) {
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
				
				pathObj.data = DataValidator.cleanObj(pathData, {
					distanceFromParent: {type: DataValidator.DATA_INT},
					orbitalPeriodHours: {type: DataValidator.DATA_INT},
					thetaOffsetDeg: {type: DataValidator.DATA_FLOAT},
					parentId: {type: DataValidator.DATA_INT}
				});
				
				// By default we orbit around the origin, but this is typically set to
				// anoter path's pos in the MapData map construction
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
