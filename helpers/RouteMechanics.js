var OrbitalMechanics = require('./OrbitalMechanics');

module.exports = function() {
	var module = {};
	
	module.getRouteSegment = function(startingCrd, endingCrd, controlPoint) {
		var seg = {};
		
		seg.sCrd = startingCrd;
		seg.eCrd = endingCrd;
		sec.cPoint = controlPoint;
		
		return seg;
	};
	
	return module;
};
