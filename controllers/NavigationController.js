var CelestialBodiesDAO = require('../models/CelestialBodiesDAO');
var PlayerRoutesDAO = require('../models/PlayerRoutesDAO');

var OrbitalMechanics = require('../helpers/OrbitalMechanics');
var NavigationMechanics = require('../helpers/NavigationMechanics');

var ShipController = require('../controllers/ShipController');

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
	module.MAX_SEGMENTS = 10; // TODO remove, moved to NavigationMechanics
	
	/**
	 * Method that validates a course.
	 * TODO change inputOrig to input
	 */
	module.plotRoute = function(input, output, callback) {
		/*
		TODO this entire function is now BS, we've moved validation to NaviationMechanics, this references the old segment styles, and was never tested
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
		CelestialBodiesDAO().getBodies(function(celestialBodies) {
		input.data = {
			destinationType : module.DESTINATION_TYPE_STATION,
			destinationId   : 1,
			plrShipId       : 1,
			timeEnd         : 0,
			routeSegments   : NavigationMechanics().plotRoute(0, OrbitalMechanics().getCrd(600, -400, 0, 100, 0), null, celestialBodies)
		};
		
		console.log(input.data);
		
		// Before we retrieve any data, we check basic info about the request first
		if(
			undefined == input.data.destinationType ||
			undefined == input.data.destinationId ||
			undefined == input.data.plrShipId ||
			undefined == input.data.timeEnd ||
			undefined == input.data.routeSegments) {
			output.messages.push("Input invalid.");
			callback(output);
			return;
		}
		
		/*
		verify start time is in the future
		verify it doesn't go on too long, not too many segments, is that handled here or in mechanics?
		*/
		
		// Check to see that each curve links to the next
		// Note we are dealing with "simple segments"
		
		
		
		CelestialBodiesDAO().getBodies(function(celestialBodies) {
			ShipController().getShipMobility(input.data.plrShipId, function(shipMobility) {
				if(!NavigationMechanics().validateRoute(shipMobility, input.data.routeSegments, celestialBodies)) {
					output.messages.push("Route failed validation");
					callback(output);
					return;
				}
				
				// TODO this is a hack to use our one route and update it
				PlayerRoutesDAO().getPlayerRoutes(input.plrId, function(playerRoutes) {
					var playerRoute = playerRoutes.pop();
					if(undefined == playerRoute) {
						output.messages.push('no player route');
						callback(output);
						return;
					}
					
					playerRoute['destination_type'] = input.data.destinationType;
					playerRoute['destination_id'] = input.data.destinationId;
					playerRoute['time_end'] = input.data.timeEnd;
					playerRoute['route_data'] = input.data.routeSegments;
					
					PlayerRoutesDAO().updatePlayerRoutes(playerRoute, function(prOutput) {
						callback(output);
					});
				});
			});
		});
		
		}); // TODO remove. celestial bodies wrapper
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























