const Crd = require('./Crd');

/**
 * PathSeg data structure
 *
 * A path segment is a point, an orbit definition, or a bezier curve.
 *
 * Data definitions for Orbits and Paths. The following data structures represent
 * a path segment's data property. This will correspond to the path seg type.
 *
 * Point:
 *   x,
 *   y
 *
 * Orbit: {
 *   Eccentricity,
 *   Semimajor axis,
 *   Inclination,
 *   Longitude of the ascending node,
 *   Argument of periapsis,
 *   True anomaly
 * }
 *
 * Curve: 
 *   controlPoint1
 *   controlPoint2
 *   /
 *   /
 *   /
 *   /
 *   /
 */
module.exports = {
	TYPE_NONE:  0,
	TYPE_POINT: 1,
	TYPE_ORBIT: 2,
	TYPE_CURVE: 3,
	
	PathSeg: function({ type, sCrd, eCrd, data }) {
		this.type = type;
		this.sCrd = sCrd;
		this.eCrd = eCrd;
		this.data = data;
		this.updatePos = function(timeMs, pos) {return false;};
		
		this.startsAfter = function(timeMs) {
			return this.sCrd.tMs > timeMs;
		};
		
		this.endsBefore = function(timeMs) {
			return this.eCrd.tMs < timeMs;
		};
		
		this.isActive = function(timeMs) {
			return !this.startsAfter(timeMs) && !this.endsBefore(timeMs);
		};
		
		switch(this.type) {
			case module.exports.TYPE_POINT:
				this.updatePos = module.exports.updatePosPoint;
				break;
			
			case module.exports.TYPE_ORBIT:
				this.updatePos = module.exports.updatePosOrbit;
				break;
				
			case module.exports.TYPE_CURVE:
				this.updatePos = module.exports.updatePosCurve;
				break;
				
			default:
				throw "Unhandled PathSeg type: " + this.type;
		}
	},
	
	updatePosPoint: function(timeMs, pos) {
		pos.x = this.data.x;
		pos.y = this.data.y;
		
		return true;
	},
	
	updatePosOrbit: function(timeMs, pos) {
		// TODO orbit stuff
		/*
		Eccentricity (e)—shape of the ellipse, describing how much it is elongated compared to a circle (not marked in diagram).
Semimajor axis (a)—the sum of the periapsis and apoapsis distances divided by two. For circular orbits, the semimajor axis is the distance between the centers of the bodies, not the distance of the bodies from the center of mass.
Two elements define the orientation of the orbital plane in which the ellipse is embedded:

Inclination (i)—vertical tilt of the ellipse with respect to the reference plane, measured at the ascending node (where the orbit passes upward through the reference plane, the green angle i in the diagram). Tilt angle is measured perpendicular to line of intersection between orbital plane and reference plane. Any three points on an ellipse will define the ellipse orbital plane. The plane and the ellipse are both two-dimensional objects defined in three-dimensional space.
Longitude of the ascending node (Ω)—horizontally orients the ascending node of the ellipse (where the orbit passes upward through the reference plane, symbolized by ☊) with respect to the reference frame's vernal point (symbolized by ♈︎). This is measured in the reference plane, and is shown as the green angle Ω in the diagram.
And finally:

Argument of periapsis (ω) defines the orientation of the ellipse in the orbital plane, as an angle measured from the ascending node to the periapsis (the closest point the satellite object comes to the primary object around which it orbits, the blue angle ω in the diagram).
True anomaly (ν, θ, or f) at epoch (M0) defines the position of the orbiting body along the ellipse at a specific time (the "epoch").
		*/
		//pos.x += this.data.parentPos.x;
		//pos.y += this.data.parentPos.y;
		
		return false;
	},
	
	updatePosCurve: function(timeMs, pos) {return false;},
};
