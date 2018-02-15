var OrbitalMechanics = require('./OrbitalMechanics');
var Bezier = require('bezier-js');

module.exports = function() {
	var module = {};
	
	module.getBezierCurveQuad = function(aX, aY, bX, bY, cX, cY) {
		return new Bezier(aX, aY, bX, bY, cX, cY);
	};
	
	module.getBezierCurveCubic = function(aX, aY, bX, bY, cX, cY, dX, dY) {
		return new Bezier(aX, aY, bX, bY, cX, cY, dX, dY);
	};
	
	/**
	 * @param positionCurve and velocityCurve Bezier objects.
	 * @param startTime and endTime Integer timestamps.
	 * @param fuelPct Float from 0-1 representing the amount of fuel used in this segment.
	 * TODO add data representing the distance at which the ship's engines can be seen
	 * - Perhaps a 0-100 integer? Need to be able to calculate visibility with this data alone, not by also calculating the player's ship thrust
	 */
	module.getNavSeg = function(positionCurve, velocityCurve, startTime, endTime, fuelPct) {
		var seg = {};
		
		seg.posCurve = positionCurve;
		seg.velCurve = velocityCurve;
		seg.sTime = parseInt(startTime);
		seg.eTime = parseInt(endTime);
		
		seg.fuelPct = fuelPct;
		
		return seg;
	};
	
	module.getPosOnSeg = function(navSeg, timeMs) {
		// TODO this needs to be rewritten since the navSeg datastructure was updated
		if(timeMs / 1000 < navSeg.sCrd.t || timeMs / 1000 > navSeg.eCrd.t)
			return null; // We aren't on this segment right now
		
		var pctComplete = ((timeMs / 1000) - navSeg.sCrd.t) / (navSeg.eCrd.t - navSeg.sCrd.t);
		
		var vCurve = new Bezier(navSeg.velCurve.p0.x,
		                        navSeg.velCurve.p0.y,
		                        navSeg.velCurve.p1.x,
		                        navSeg.velCurve.p1.y,
		                        navSeg.velCurve.p2.x,
		                        navSeg.velCurve.p2.y);
		
		var t2 = vCurve.get(pctComplete);
		
		var pCurve = new Bezier(navSeg.sCrd.pos.x,
		                        navSeg.sCrd.pos.y,
		                        navSeg.cPoint.x,
		                        navSeg.cPoint.y,
		                        navSeg.eCrd.pos.x,
		                        navSeg.eCrd.pos.y);
		
		var pos = pCurve.get(t2);
		
		return {x : pos.x, y : pos.y};
	};
	
	module.getVelocityAtPos = function() {};
	
	// Used for transport between server and client
	module.getSimpleNavSeg = function(complexSeg) {
		var simpleSeg = {};
		
		simpleSeg.p = complexSeg.posCurve.points;
		simpleSeg.v = complexSeg.velCurve.points;
		simpleSeg.sT = complexSeg.sTime;
		simpleSeg.eT = complexSeg.eTime;
		simpleSeg.f = complexSeg.fuelPct;
		
		return simpleSeg;
	};
	
	// Similar to simple, but has bezier objects instead of just points
	module.getComplexNavSeg = function(simpleSeg) {
		return module.getNavSeg(
			module.getBezierCurveQuad(simpleSeg.p[0]["x"],
			                          simpleSeg.p[0]["y"],
			                          simpleSeg.p[1]["x"],
			                          simpleSeg.p[1]["y"],
			                          simpleSeg.p[2]["x"],
			                          simpleSeg.p[2]["y"]),
			module.getBezierCurveQuad(simpleSeg.v[0]["x"],
			                          simpleSeg.v[0]["y"],
			                          simpleSeg.v[1]["x"],
			                          simpleSeg.v[1]["y"],
			                          simpleSeg.v[2]["x"],
			                          simpleSeg.v[2]["y"]),
			simpleSeg.sT,
			simpleSeg.eT,
			simpleSeg.f
		);
	};
	
	return module;
};
