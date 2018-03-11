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
	module.MAX_ROUTE_TIME_SEC = 20;//1440;
	module.MAX_ROUTE_SEG_TURN_DEG = 60;
	
	/*
	The following several functions deal with the creation of "large" and
	"small" routes. The principal difference between large and small is the use
	of Bezier objects or the simple data points.
	
	Small segments are created with basic data, and large segments are created
	with small segments. There is a single function to convert a large route to
	a small route, since we mostly deal with large segments and only convert to
	small for transport or data storage.
	*/
	
	module.getRouteSegSml = function(
		startCrd, endCrd, routeControl1X, routeControl1Y, routeControl2X, routeControl2Y,
		speedControl1X, speedControl1Y, speedControl2X, speedControl2Y, fuelBurn
	) {
		var routeSegSml = {};
		
		routeSegSml.sCrd = startCrd;
		routeSegSml.eCrd = endCrd;
		routeSegSml.rc1  = {x : routeControl1X, y : routeControl1Y};
		routeSegSml.rc2  = {x : routeControl2X, y : routeControl2Y};
		routeSegSml.sc1  = {x : speedControl1X, y : speedControl1Y};
		routeSegSml.sc2  = {x : speedControl2X, y : speedControl2Y};
		routeSegSml.fb   = fuelBurn;
		
		return routeSegSml;
	};
	
	module.getRouteSegLrg = function(routeSegSml) {
		var routeSegLrg = {};
		
		routeSegLrg.sCrd = routeSegSml.sCrd;
		routeSegLrg.eCrd = routeSegSml.eCrd;
		
		routeSegLrg.posCurve = new Bezier(
			routeSegSml.sCrd.pos.x, routeSegSml.sCrd.pos.y,
			routeSegSml.rc1.x, routeSegSml.rc1.y,
			routeSegSml.rc2.x, routeSegSml.rc2.y,
			routeSegSml.eCrd.pos.x, routeSegSml.eCrd.pos.y,
		);
		
		routeSegLrg.spdCurve = new Bezier(
			0,0,
			routeSegSml.sc1.x, routeSegSml.sc1.y,
			routeSegSml.sc2.x, routeSegSml.sc2.y,
			1,1
		);
		
		routeSegLrg.fb = routeSegSml.fb;
		
		return routeSegLrg;
	};
	
	module.getRouteSml = function(destinationType, destinationId, plrShipId, routeSegsSml) {
		var routeSml = {};
		
		routeSml.dt = destinationType;
		routeSml.di = destinationId;
		routeSml.ps = plrShipId;
		routeSml.rd = routeSegsSml;
		
		return routeSml;
	};
	
	module.getRouteLrg = function(routeSml) {
		var routeLrg = {};
		
		routeLrg.destinationType = routeSml.dt;
		routeLrg.destinationId   = routeSml.di;
		routeLrg.plrShipId       = routeSml.ps;
		routeLrg.routeSegs       = [];
		
		routeSml.rd.forEach(function(routeSegSml) {
			routeLrg.routeSegs.push(module.getRouteSegLrg(routeSegSml));
		});
		
		return routeLrg;
	};
	
	module.convertRouteLrgToSml = function(routeLrg) {
		var routeSegsSml = [];
		
		routeLrg.routeSegs.forEach(function(routeSegLrg) {
			routeSegsSml.push(module.getRouteSegSml(
				routeSegLrg.sCrd,
				routeSegLrg.eCrd,
				routeSegLrg.posCurve.points[1].x,
				routeSegLrg.posCurve.points[1].y,
				routeSegLrg.posCurve.points[2].x,
				routeSegLrg.posCurve.points[2].y,
				routeSegLrg.spdCurve.points[1].x,
				routeSegLrg.spdCurve.points[1].y,
				routeSegLrg.spdCurve.points[2].x,
				routeSegLrg.spdCurve.points[2].y,
				routeSegLrg.fb
			));
		});
		
		return module.getRouteSml(routeLrg.destinationType, routeLrg.destinationId, routeLrg.plrShipId, routeSegsSml);
	};
	
	/**
	 * Returns the current x,y position based on a large route segment data structure.
	 *
	 * @return {x : 0, y : 0} or null if this route is not active.
	 */
	module.getPosOnRoute = function(routeLrg, timeMs) {
		var curRouteSeg = null;
		for(let i = 0; i < routeLrg.routeSegs.length; i++) {
			if((1000 * routeLrg.routeSegs[i].sCrd.t) <= timeMs && (1000 * routeLrg.routeSegs[i].eCrd.t) >= timeMs) {
				curRouteSeg = routeLrg.routeSegs[i];
				break;
			}
		};
		
		if(null == curRouteSeg)
			return null;
		
		var pctComplete = (timeMs - (1000 * curRouteSeg.sCrd.t)) / ((1000 * curRouteSeg.eCrd.t) - (1000 * curRouteSeg.sCrd.t));
		
		var spdPos = curRouteSeg.spdCurve.get(pctComplete);
		return curRouteSeg.posCurve.get(spdPos.y);
	};
	
	/**
	 * Attempts to generate a route segment from two coordinates. This is a
	 * "dumb" function, it just attempts to generate a valid segment and returns
	 * null if it can't. This function assumes it is passed valid starting and
	 * ending coordinates.
	 *
	 * TODO redefine this so that it always returns a curve. We'd like this function to just give a curve from point A to point B.
	 * This function's primary goal is to map the curve based on the crds, which includes the direction the curve travels, and the
	 * speed along that path. The onus will be on the user of this function to make sure the crds are "sane". If you pass garbage,
	 * you'll get garbage.
	 *
	 * @return A routeSegSml data structure or null if it couldn't generate one
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
		// TODO remove this conditional
		/*
		var maxAngleDiff = 90;
		if(!((sVecAngleDiff < maxAngleDiff && sVecAngleDiff > 0) && (eVecAngleDiff > (-1 * maxAngleDiff) && eVecAngleDiff < 0)) &&
		   !((sVecAngleDiff > (-1 * maxAngleDiff) && sVecAngleDiff < maxAngleDiff) && (eVecAngleDiff < maxAngleDiff && eVecAngleDiff > 0))) {
			return null;
		}
		*/
		
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
		
		// We now have our position curve defined, time to generate the curve that defines our speed
		return module.getRouteSegSml(
			sCrd, eCrd, cp1.x, cp1.y, cp2.x, cp2.y,
			0,0.5,1,0.5,0 // TODO add speed control point determination as well as fuel burn levels
		);
	};
	
	/**
	 * Function to validate an array of route segments. Does not check if start
	 * or end locations are valid, just the route itself.
	 *
	 * @return boolean
	 */
	module.validateRoute = function(maxMobility, routeSegsLrg, celestialBodies) {
		return true; // We are temporarily accepting all routes
		
		if(0 >= routeSegsLrg.length || module.MAX_ROUTE_SEGMENTS < routeSegsLrg.length)
			return false;
		if(module.MAX_ROUTE_TIME_SEC < routeSegsLrg[routeSegsLrg.length - 1].eCrd.t - routeSegsLrg[0].sCrd.t)
			return false;
		
		//var x1,y1,x2,y2,x3,y3,x4,y4;
		
		for(let i = 0; i < routeSegsLrg.length; i++) {
			if(routeSegsLrg[i].sCrd.t     != Math.round(routeSegsLrg[i].sCrd.t))
				return false;
			if(routeSegsLrg[i].sCrd.pos.x != Math.round(routeSegsLrg[i].sCrd.pos.x))
				return false;
			if(routeSegsLrg[i].sCrd.pos.y != Math.round(routeSegsLrg[i].sCrd.pos.y))
				return false;
			if(routeSegsLrg[i].eCrd.t     != Math.round(routeSegsLrg[i].eCrd.t))
				return false;
			if(routeSegsLrg[i].eCrd.pos.x != Math.round(routeSegsLrg[i].eCrd.pos.x))
				return false;
			if(routeSegsLrg[i].eCrd.pos.y != Math.round(routeSegsLrg[i].eCrd.pos.y))
				return false;
			
			// Ensure the start crd is equal to the end crd of the previous segment.
			// Because we verify that the bezier curve lines up with the start
			// and end coordinates, we don't need to compare the vectors of two
			// separate segments, just the start and end coordinates.
			if(1 <= i) {
				if(routeSegsLrg[i].sCrd.t     != routeSegsLrg[i - 1].eCrd.t)
					return false;
				if(routeSegsLrg[i].sCrd.pos.x != routeSegsLrg[i - 1].eCrd.pos.x)
					return false;
				if(routeSegsLrg[i].sCrd.pos.y != routeSegsLrg[i - 1].eCrd.pos.y)
					return false;
			}
			
			if(routeSegsLrg[i].sCrd.t >= routeSegsLrg[i].eCrd.t)
				return false;
			
			// Ensure our coordinates positions are equal to our curves
			if(routeSegsLrg[i].sCrd.pos.x != routeSegsLrg[i].posCurve.points[0].x)
				return false;
			if(routeSegsLrg[i].sCrd.pos.y != routeSegsLrg[i].posCurve.points[0].y)
				return false;
			if(routeSegsLrg[i].eCrd.pos.x != routeSegsLrg[i].posCurve.points[3].x)
				return false;
			if(routeSegsLrg[i].eCrd.pos.y != routeSegsLrg[i].posCurve.points[3].y)
				return false;
			
			/*
			verify that the bezier curve is a "simple" curve as defined in the getCurveFromCrds function above
			verify that the bezier curve is travelling in the same direction as the start and end coordinate movement vectors
			verify that the speed the ship is travelling at the start and end is equal to the movement vector of the corresponding crds
			*/
		}
		
		// Now that we have verified the basics of the segments, we verify that the ship can power itself along the proposed path
		for(let i = 0; i < routeSegsLrg.length; i++) {
			// TODO
			// get the drift crd
			// compare it to the position along the path
			// see if the ship's power is greater than the vector difference between the points
			// verify we don't collide with any celestial bodies
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
			return module.plotDrift(sCrd, sCrd.t + module.MAX_ROUTE_TIME_SEC, celestialBodies);
		}
		
		// TODO Actual implementation of orbital plotting
		var curve = module.getCurveFromCrds(sCrd, eCrd);
		
		return [curve];
	};
	
	module.plotDrift = function(sCrd, endTimeSc, celestialBodies) {
		var retSegsLrg = [];
		var curStartCrd = sCrd;
		var oldDriftCrd = sCrd;
		var newDriftCrd;
		var curStartCrdAngle = (360 + (new Victor(curStartCrd.pos.x + curStartCrd.mov.x, curStartCrd.pos.y + curStartCrd.mov.y)).horizontalAngleDeg()) % 360;
		var newDriftCrdAngle;
		
		while(curStartCrd.t < endTimeSc) {
			OrbitalMechanics().populateOrbitalPositions(celestialBodies, oldDriftCrd.t * 1000);
			
			newDriftCrd = OrbitalMechanics().getDriftCoordinate(
				oldDriftCrd.pos,
				oldDriftCrd.mov,
				oldDriftCrd.t,
				OrbitalMechanics().TIME_UNIT,
				celestialBodies,
				false
			);
			
			newDriftCrdAngle = (360 + (new Victor(newDriftCrd.pos.x + newDriftCrd.mov.x, newDriftCrd.pos.y + newDriftCrd.mov.y)).horizontalAngleDeg()) % 360;
			
			if(newDriftCrd.t > endTimeSc ||
				(module.MAX_ROUTE_SEG_TURN_DEG < Math.abs(curStartCrdAngle - newDriftCrdAngle) &&
				module.MAX_ROUTE_SEG_TURN_DEG < 360 - Math.abs(curStartCrdAngle - newDriftCrdAngle))
			) {
				retSegsLrg.push(module.getCurveFromCrds(curStartCrd, oldDriftCrd));
				
				curStartCrd = oldDriftCrd;
				
				curStartCrdAngle = (360 + (new Victor(curStartCrd.pos.x + curStartCrd.mov.x, curStartCrd.pos.y + curStartCrd.mov.y)).horizontalAngleDeg()) % 360;
			} else {
				oldDriftCrd = newDriftCrd;
			}
		}
		
		return retSegsLrg;
	};
	
	return module;
};



















