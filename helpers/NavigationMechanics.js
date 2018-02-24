var OrbitalMechanics = require('./OrbitalMechanics');
var Bezier = require('bezier-js');
var Victor = require('victor');

/**
 * This class is a helper for calculating navigational data between celestial
 * bodies. It deals with translating a path into a bezier curve, with getting
 * a position on a bezier curve, escape velocities and route pathfinding.
 */
module.exports = function() {
	var module = {};
	
	module.MAX_ROUTE_SEGMENTS = 10;
	module.MAX_ROUTE_TIME_MIN = 1;//1440;
	
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
	 * TODO rename to getRouteSeg
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
	
	/**
	 * Function to construct a route segment object from primitive data.
	 */
	module.getRouteSegment = function(
		timeStartSc,
		fuelBurn,
		routeStartX,
		routeStartY,
		routeEndX,
		routeEndY,
		routeControl1X,
		routeControl1Y,
		routeControl2X,
		routeControl2Y,
		speedControl1X,
		speedControl1Y,
		speedControl2X,
		speedControl2Y,
	) {
		var seg = {};
		
		seg.ts   = timeStartSc;
		seg.fb   = fuelBurn;
		seg.rsx  = routeStartX;
		seg.rsy  = routeStartY;
		seg.rex  = routeEndX;
		seg.rey  = routeEndY;
		seg.rc1x = routeControl1X;
		seg.rc1y = routeControl1Y;
		seg.rc2x = routeControl2X;
		seg.rc2y = routeControl2Y;
		seg.sc1x = speedControl1X;
		seg.sc1y = speedControl1Y;
		seg.sc2x = speedControl2X;
		seg.sc2y = speedControl2Y;
		
		return seg;
	};
	
	/**
	 * Attempts to generate a route segment from two coordinates. This is a
	 * "dumb" function, it just attempts to generate a valid segment and returns
	 * null if it can't. This function assumes it is passed valid starting and
	 * ending coordinates.
	 *
	 * @return Bezier or null if it couldn't generate one
	 */
	module.getCurveFromCrds = function(sCrd, eCrd) {
		// First check if the opposing point is on the same side that the vector is pointing
		var diffVec = new Victor(eCrd.pos.x, eCrd.pos.y);
		diffVec.subtract(new Victor(sCrd.pos.x, sCrd.pos.y));
		
		// The Victor library's horizontalAngleDeg returns a number between -180
		// and 180, with a vector of 1,0 returning 0. We need to translate this
		// to a normal 0-360 number for comparison, hence the 360 constants
		var diffVecAngle = (360 + diffVec.horizontalAngleDeg()) % 360;
		
		var sVecAngleDiff = ((360 + (new Victor(sCrd.mov.x, sCrd.mov.y)).horizontalAngleDeg()) % 360) - diffVecAngle;
		var eVecAngleDiff = ((360 + (new Victor(eCrd.mov.x, eCrd.mov.y)).horizontalAngleDeg()) % 360) - diffVecAngle;
		
		// We want to ensure this is a simple curve, meaning that the entrance and exit vectors are in line with the
		// direction of travel, and that they form an arc between them.
		// TODO make the upper limit less than 90 to prevent control points that are super far away
		var maxAngleDiff = 60;
		if(!((sVecAngleDiff < maxAngleDiff && sVecAngleDiff > 0) && (eVecAngleDiff > (-1 * maxAngleDiff) && eVecAngleDiff < 0)) &&
		   !((sVecAngleDiff > (-1 * maxAngleDiff) && sVecAngleDiff < maxAngleDiff) && (eVecAngleDiff < maxAngleDiff && eVecAngleDiff > 0))) {
			return null;
		}
		
		var x1 = sCrd.pos.x;
		var y1 = sCrd.pos.y;
		var x2 = sCrd.pos.x + sCrd.mov.x;
		var y2 = sCrd.pos.y + sCrd.mov.y;
		var x3 = eCrd.pos.x;
		var y3 = eCrd.pos.y;
		var x4 = eCrd.pos.x + eCrd.mov.x;
		var y4 = eCrd.pos.y + eCrd.mov.y;
		
		var px, py;
		var denom = (x1 - x2)*(y3 - y4) - (y1 - y2)*(x3 - x4);
		
		if(Math.abs(denom) < 0.01) { // 0 means parallel, so we just set the control point to halfway
			var mag = diffVec.length();
			
			diffVec.normalize().multiply(new Victor(mag / 2, mag / 2));
			diffVec.add(new Victor(sCrd.pos.x, sCrd.pos.y));
			
			px = diffVec.x;
			py = diffVec.y;
		} else {
			px = ((x1*y2 - y1*x2)*(x3 - x4) - (x1 - x2)*(x3*y4 - y3*x4)) / denom;
			py = ((x1*y2 - y1*x2)*(y3 - y4) - (y1 - y2)*(x3*y4 - y3*x4)) / denom;
		}
		
		// We set each control point to be the same distance from it's parent point to smooth out the curve
		var cp1 = new Victor(px, py);
		var cp2 = new Victor(px, py);
		cp1.subtract(new Victor(sCrd.pos.x, sCrd.pos.y));
		cp2.subtract(new Victor(eCrd.pos.x, eCrd.pos.y));
		cp1Mag = cp1.length();
		cp2Mag = cp2.length();
		
		if(cp1Mag > cp2Mag) {
			cp1.normalize().multiply(new Victor(cp2Mag, cp2Mag));
		} else {
			cp2.normalize().multiply(new Victor(cp1Mag, cp1Mag));
		}
		
		cp1.add(new Victor(sCrd.pos.x, sCrd.pos.y));
		cp2.add(new Victor(eCrd.pos.x, eCrd.pos.y));
		
		return module.getRouteSegment(
			sCrd.t,
			0,
			sCrd.pos.x,
			sCrd.pos.y,
			eCrd.pos.x,
			eCrd.pos.y,
			cp1.x,
			cp1.y,
			cp2.x,
			cp2.y,
			0,0,0,0
		);
	};
	
	/**
	 * Function to validate an array of route segments. Does not check if start
	 * or end locations are valid, just the route itself.
	 *
	 * @return boolean
	 */
	module.validateRoute = function(maxMobility, routeSegments, celestialBodies) {
		if(module.MAX_ROUTE_SEGMENTS < routeSegments.length) {
			return false;
		}
		
		for(var i = 1; i < routeSegments.length; i++) {
			/*
			check that the start time of the following segment is after the start time of the prev seg
			check that the start location is the same as the end location of the prev seg
			check that the exit vector of the prev seg lines up with the entrance vector of this one
			
			*/
		}
		
		return true;
	};
	
	/**
	 * Function to calculate the altitude at which the pull from two celestial
	 * bodies is approximately equal. Returned integer altitude is based on the
	 * primary body.
	 */
	module.getTippingAltitude = function(primaryBody, secondaryBody) { return 0; };
	
	// Used for ascent / descent around a single body
	module.plotSingleBodyRoute = function(sCrd, eCrd, celestialBodies) {};
	
	module.plotInterBodyRoute = function(sCrd, eCrd, celestialBodies) {};
	
	/**
	 * The big kahuna. Plots a route between two coordinates if possible,
	 * returns null if it can't.
	 *
	 * @return Array of route segments, or null if a route could not be plotted.
	 */
	module.plotRoute = function(maxMobility, sCrd, eCrd, celestialBodies) {
		if(0 == maxMobility) {
			// We ignore the eCrd param if we are just drifting
			return module.plotDrift(sCrd, module.MAX_ROUTE_TIME_MIN * 60, celestialBodies);
		}
		
		// TODO Currently only drifting is supported
		return null;
	};
	
	/**
	 * Function to plot a ship drifting through space for a period of time.
	 *
	 * @param sCrd OrbitalMechanics().getCrd data structure.
	 *
	 * @return Array of route segments.
	 */
	module.plotDrift = function(sCrd, endTime, celestialBodies) {
		var driftCrds = [];
		driftCrds.push(sCrd);
		
		var curTime = sCrd.t;
		
		if(curTime > endTime) {
			// TODO throw err
			console.log("Trying to drift with invalid times: " + curTime + " is after " + endTime);
			return [];
		}
		
		var prevCrd = sCrd;
		var newCrd;
		
		while(prevCrd.t + OrbitalMechanics().TIME_UNIT < endTime) {
			OrbitalMechanics().populateOrbitalPositions(celestialBodies, prevCrd.t * 1000);
			
			newCrd = OrbitalMechanics().getDriftCoordinate(prevCrd.pos, prevCrd.mov, prevCrd.t, OrbitalMechanics().TIME_UNIT, celestialBodies);
			
			driftCrds.push(newCrd);
			
			prevCrd = newCrd;
		}
		
		// driftCrds is now an array of coordinates that we need to map to a bezier curve
		var startIndex = 0;
		var endIndex = driftCrds.length -1;
		var curve = null;
		var routeSegs = [];
		var safetyCounter = 100; // Max loops
		
		while(startIndex < driftCrds.length -1 && safetyCounter-- > 0) {
			curve = module.getCurveFromCrds(driftCrds[startIndex], driftCrds[endIndex]);
			
			if(null != curve) {
				routeSegs.push(curve);
				
				startIndex = endIndex;
				endIndex = driftCrds.length -1;
			} else {
				endIndex = Math.round(endIndex - ((endIndex - startIndex) / 2));
				if(endIndex <= startIndex) {
					console.log("Unable to plot drift");
					// TODO throw err
					return [];
				}
			}
		}
		
		return routeSegs;
	};
	
	return module;
};



















