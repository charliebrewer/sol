const DataValidator = require('./DataValidator');
const OrbitalMechanics = require('./OrbitalMechanics');

module.exports = {
	PATH_NONE:  0,
	PATH_POINT: 1,
	PATH_ORBIT: 2,
	PATH_CURVE: 3,
	
	PathObj: function() {
		this.type = module.exports.PATH_NONE;
		this.pos = {x: 0, y: 0};
		this.data = {};
		
		this.updatePos = function(timeMs) {};
	},
	
	getPathFromJson: function(pathJson) {
		var tempPath = JSON.parse(pathJson);
		return module.exports.getPath(tempPath.type, tempPath);
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
				
				pathObj.data.parentPos = {x: 0, y: 0};
			break;
			
			case module.exports.PATH_CURVE:
				pathObj.type = module.exports.PATH_CURVE;
				pathObj.updatePos = module.exports.updatePosCurve;
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
		this.pos = OrbitalMechanics().getOrbitalPosition(
			this.data.parentMapObj.path.pos,
			this.data.distanceFromParent,
			this.data.orbitalPeriodHours,
			timeMs,
			this.data.thetaOffsetDeg
		);
	},
	
	updatePosCurve: function(timeMs) {},
};
