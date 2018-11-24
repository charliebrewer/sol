const PathSeg = require('./PathSeg');

/**
 * Path Obj data structure
 *
 * Has a position property, calling updatePos with a timestamp will set the position accordingly.
 * Has a series of PathSeg data structures.
 *
 * {
 *   pathSegs: [PathSeg],
 *   data: {}
 * }
 */
module.exports = {
	PathObj: function() {
		this.pos = {x: 0, y: 0};
		this.data = {};
		this.pathSegs = [];
		
		this.updatePos = function(timeMs) {
			var i = this.getActiveSegIndex(timeMs);
			if(-1 == i)
				return false;
			
			this.pathSegs[i].updatePos(timeMs, this.pos);
			
			return true;
		};
		
		this.getActiveSegIndex = function(timeMs) {
			if(this.startsAfter(timeMs) || this.endsBefore(timeMs)) {
				return -1;
			}
			
			for(let i = 0; i < this.pathSegs.length; i++) {
				if(this.pathSegs[i].sCrd.tMs < timeMs && this.pathSegs[i].eCrd.tMs > timeMs)
					return i;
			}
			
			return -1;
		};
		
		// Tests if this path ends before a point in time
		this.endsBefore = function(timeMs) {
			return this.pathSegs[this.pathSegs.length - 1].endsBefore(timeMs);
		};
		
		// Tests if this path starts after a point in time
		this.startsAfter = function(timeMs) {
			return this.pathSegs[0].startsAfter(timeMs);
		};
	},
	
	/* TODO remove - moved to PathSeg
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
	*/
};
