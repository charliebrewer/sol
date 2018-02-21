var CelestialBodiesDAO = require('../models/CelestialBodiesDAO');

var OrbitalMechanics = require('../helpers/OrbitalMechanics');
var NavigationMechanics = require('../helpers/NavigationMechanics');

var Bezier = require('bezier-js');

module.exports = function() {
	var module = {};
	
	module.DESTINATION_TYPE_STATION   = 1; // ID is station ID
	module.DESTINATION_TYPE_DRIFT     = 2; // ID is 0, not used
	module.DESTINATION_TYPE_ORBIT     = 3; // ID is celestial_body_id
	module.DESTINATION_TYPE_INTERCEPT = 4; // ID route ID
	
	module.LOCATION_TYPE_STATION  = 1;
	module.LOCATION_TYPE_SHIP     = 2;
	module.LOCATION_TYPE_SPACE    = 3;
	module.LOCATION_TYPE_PROPERTY = 4;
	
	module.MIN_PLOT_WAIT_SEC = 5; // Minimum number of seconds in the future the player can start a new course
	module.MAX_COURSE_DURATION_SEC = 10; // Maximum time allowed for a given course
	module.COURSE_RESOLUTION_MS = 5000; // 
	module.MAX_SEGMENTS = 10;
	
	/**
	 * Method that validates a course.
	 * TODO change inputOrig to input
	 */
	module.plotRoute = function(inputOrig, output, callback) {
		/*
		input is array of objects, starting coordinate, ending coordinate, bezier control vector
		input also contains destination
		- valid destinations are stations and circular orbits around celestial bodies and intercepts of other courses
		input also contains ship possession id to be used
		
		Get the player's location, validate he's in a ship and owns the ship
		Verify that there are not more curves than allowed.
		Verify that the player's ship will be at the starting location (includes time check).
		Verify that the launching speed is valid. (this will be different depending on if they're at a station or in space)
		Verify that the launching vector is valid.
		Verify that the player's ship will be at a valid destination at the end (includes time check).
		Verify that the end time is below maximum allowed.
		Verify that the landing speed is valid.
		Verify that the landing vector is valid.
		(Below items are executed in a loop over each curve)
		Verify that the times of each curve link to one another.
		Verify that each beizer curve links to the next.
		Verify that the speed of each curve lines up with the next.
		
		Verify that the player never collides with a celestial body
		*/
		// TODO remove temp input
		input = {
			plrId : inputOrig.plrId,
			timeMs : inputOrig.timeMs,
			destinationType : module.DESTINATION_TYPE_STATION,
			destinationId   : 1,
			shipId          : 1,
			course : [
				NavigationMechanics().getSimpleNavSeg(NavigationMechanics().getNavSeg(
				    NavigationMechanics().getBezierCurveQuad(1,2,3,4,5,6),
				    NavigationMechanics().getBezierCurveQuad(1,2,3,4,5,6),
					12345,12350, 0.5)),
				NavigationMechanics().getSimpleNavSeg(NavigationMechanics().getNavSeg(
				    NavigationMechanics().getBezierCurveQuad(5,6,3,4,7,8),
				    NavigationMechanics().getBezierCurveQuad(1,2,3,4,5,6),
					12350,12355, 0.5)),
				NavigationMechanics().getSimpleNavSeg(NavigationMechanics().getNavSeg(
				    NavigationMechanics().getBezierCurveQuad(7,8,3,4,5,6),
				    NavigationMechanics().getBezierCurveQuad(1,2,3,4,5,6),
					12355,12360, 0.5))
			]
		};
		
		//console.log(JSON.stringify(input));
		
		// Before we retrieve any data, we check basic info about the request first
		if(undefined == input.destinationType || undefined == input.destinationId || undefined == input.shipId || undefined == input.course) {
			output.messages.push("Input invalid.");
			callback(output);
			return;
		}
		
		if(input.course.length > module.MAX_SEGMENTS) {
			output.messages.push("More segments than allowed.");
			callback(output);
			return;
		}
		
		if(input.course[0].sT < (input.timeMs / 1000) + module.MIN_PLOT_WAIT_SEC) {
			output.messages.push("Starts too soon.");
			callback(output);
			return;
		}
		
		if(input.course[0].eT > (input.timeMs / 1000) + module.MIN_PLOT_WAIT_SEC + module.MAX_COURSE_DURATION_SEC) {
			output.messages.push("Ends too late.");
			callback(output);
			return;
		}
		
		// Check to see that each curve links to the next
		// Note we are dealing with "simple segments"
		var prevSeg = null;
		var segments = [];
		
		input.course.forEach(function(seg) {
			if(seg.sT > seg.eT) {
				// TODO handle error
				console.log("Segment has start time after its end time.");
			}
			
			if(seg.f < 0 || seg.f > 1) {
				// TODO handle error
				console.log("Invalid fuel used.");
			}
			
			if(null != prevSeg) {
				if(prevSeg.p[2].x != seg.p[0].x || prevSeg.p[2].y != seg.p[0].y) {
					// TODO handle error
					console.log("Curves do not start and end at the same point.");
				}
				
				if(prevSeg.eT != seg.sT) {
					// TODO handle error
					console.log("Curves do not start and end at the same time.");
				}
			}
			
			segments.push(NavigationMechanics().getComplexNavSeg(seg));
			
			prevSeg = seg;
		});
		
		
		/*
		PlayerController().getAllPlayerData(input, output, function(playerData) {
			
		});
		*/

		callback(output);
	};
	
	module.plotOrbit = function(input, output, callback) {
		// TODO this will share functionality with plotCourse as the ship will need to navigate to the circular orbit
		callback(output);
	};
	
	// TODO - remove this function from the server - if the player wishes to drift through space, they'll just
	// plot the course with their engines off and then call plotCourse with the associated curves
	// What about disabled engines?
	module.plotDrift = function(input, output, callback) {
		/*
		update the player's ship route to drifting through space
		
		we need the player's starting coordinate from which to drift, that's it
		
		verify the time of the coordinate is not too far in the future and is not in the past
		verify the player is not already drifting
		verify the player is in a ship
		verify the player owns the ship they are on
		verify the player will be at the coordinate
		
		*/
		// TODO verify input contains a coordinate
		var startCrd = input.startCrd;
		if(startCrd.t < input.timeMs + module.MIN_PLOT_WAIT_SEC) {
			output.messages.push("Course starts too soon.");
			callback(output);
			return;
		}
		
		// TODO verify the above requirements
		CelestialBodiesDAO().getBodies(function(celestialBodies) {
			// Get only the relevant bodies
			// TODO implement this
			var cBodies = [];
			celestialBodies.forEach(function(body) {
				if(body['celestial_body_id'] == OrbitalMechanics().SOL_ID) {
					cBodies.push(body);
				}
			});
			
			var driftCrds = [];
			driftCrds.push(startCrd);
			var previousCrd = startCrd;
			
			while(previousCrd.t <= startCrd.t + module.MAX_COURSE_DURATION_SEC) {
				OrbitalMechanics().populateOrbitalPositions(cBodies, (1000 * previousCrd.t) + module.COURSE_RESOLUTION_MS);
				
				previousCrd = OrbitalMechanics().getDriftCoordinate(
					previousCrd.pos,
					previousCrd.mov,
					previousCrd.t,
					module.COURSE_RESOLUTION_MS / 1000,
					cBodies
				);
				
				driftCrds.push(previousCrd);
			}
			
			// driftCrds now contains a list of coordinates
			output.driftCrds = driftCrds;
			callback(output);
		});
	};
	
	return module;
};























