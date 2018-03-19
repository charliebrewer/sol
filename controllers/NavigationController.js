var CelestialBodiesDAO = require('../models/CelestialBodiesDAO');
var PlayerDAO = require('../models/PlayerDAO');
var PlayerRoutesDAO = require('../models/PlayerRoutesDAO');
var StationsDAO = require('../models/StationsDAO');

var OrbitalMechanics = require('../helpers/OrbitalMechanics');
var NavigationMechanics = require('../helpers/NavigationMechanics');

var PlayerController = require('../controllers/PlayerController');
var ShipController = require('../controllers/ShipController');

var Bezier = require('bezier-js');

module.exports = function() {
	var module = {};
	
	module.MIN_START_DELAY_SC = 5; // Minimum number of seconds in the future the player can start a new course
	module.MAX_COURSE_DURATION_SEC = 10; // Maximum time allowed for a given course
	module.COURSE_RESOLUTION_MS = 5000; // 
	module.MAX_SEGMENTS = 10; // TODO remove, moved to NavigationMechanics
	
	/**
	 * Method that validates a course.
	 */
	module.plotRoute = function(dataBox, input, output, callback) {
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
		/* TODONE
		CelestialBodiesDAO().getBodies(function(celestialBodies) {
		input.data = {
			destinationType : module.DESTINATION_TYPE_STATION,
			destinationId   : 1,
			plrShipId       : 1,
			timeEnd         : 0,
			routeSegments   : NavigationMechanics().plotRoute(
				100,
				OrbitalMechanics().getCrd(600, -200, 0, 100, 0),
				null,
				celestialBodies
			)
		};
		
		console.log(input.data);
		*/
		
		// Before we retrieve any data, we check basic info about the request first
		/*
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
		*/
		
		/*
		verify start time is in the future
		verify it doesn't go on too long, not too many segments, is that handled here or in mechanics?
		*/
		
		// Check to see that each curve links to the next
		// Note we are dealing with "simple segments"
		var routeLrg = NavigationMechanics().getRouteLrg(input);
		
		/*
		check where the player is
		check if the player owns the ship
		check where the ship is
		*/
		var startTimeMs = routeLrg.routeSegs[0].sCrd.t * 1000;
		
		PlayerDAO().getPlayer(dataBox, function(playerRecord) {
			PlayerRoutesDAO().getPlayerRoutes(dataBox.getPlrId(), function(playerRoutes) {
				var routeSmlArr = [];
				playerRoutes.forEach(function(r) {
					//getRouteSml = function(routeId, destinationType, destinationId, plrShipId, routeSegsSml) {
					routeSmlArr.push(NavigationMechanics().getRouteSml(
						r['route_id'],
						r['destination_type'],
						r['destination_id'],
						r['plr_ship_id'],
						r['route_data']
					));
				});
					
				var locationInfo = NavigationMechanics().getLocationAtTime(
					playerRecord['location_type'],
					playerRecord['location_id'],
					startTimeMs,
					routeSmlArr
				);
				
				if(NavigationMechanics().LOCATION_TYPE_STATION != locationInfo.locationType) {
					console.log("Only leaving from stations supported");
					callback(output);
					return;
				} else if(locationInfo.locationType == routeLrg.destionationType && locationInfo.locationId == routeLrg.destinationId) {
					console.log("Can't travel back to the same station");
					callback(output);
					return;
				} else {
					// Before we check if the station is at the same crd as the route at the start time,
					// we check information about the ship first
					// TODO implement ships
					// Check if the player owns the ship and if the ship is located at the same station
					
					CelestialBodiesDAO().getBodies(function(cBodies) {
						StationsDAO().getStations(cBodies, function(stations) {
							var station = stations.find(function(s) { return s['station_id'] == locationInfo.locationId; });
							
							var stationCrd = OrbitalMechanics().getStationCrd(station, startTimeMs, cBodies, true);
							
							if(!OrbitalMechanics().crdsAreEqual(routeLrg.routeSegs[0].sCrd, stationCrd, 10)) {
								console.log("Trying to plot route that doesn't begin where we think it does");
								callback(output);
								return;
							}
							
							ShipController().getShipMobility(routeLrg.plrShipId, function(shipMobility) {
								if(false && !NavigationMechanics().validateRoute(shipMobility, routeLrg.routeSegments, celestialBodies)) {
									console.log("Route failed validation");
									callback(output);
									return;
								}
								
								// Success! The route passed validation and the player is where they say they are etc etc
								// Store the info
								
								var playerRoute = playerRoutes.pop();
								if(undefined == playerRoute) {
									output.messages.push('no player route');
									callback(output);
									return;
								}
								
								playerRoute['destination_type'] = routeLrg.destinationType;
								playerRoute['destination_id'] = routeLrg.destinationId;
								playerRoute['time_end'] = routeLrg.timeEnd;
								
								// For the route itself we want to use the small version
								playerRoute['route_data'] = input.rd;
								
								PlayerRoutesDAO().updatePlayerRoutes(playerRoute, function(prOutput) {
									playerRecord['location_type'] = module.LOCATION_TYPE_ROUTE;
									playerRecord['location_id'] = playerRoute['route_id'];
									
									PlayerDAO().updatePlayer(dataBox, playerRecord, function(pOutput) {
										callback(output);
									});
								});
							});
						});
					});
				}
			});
		});
	};
	
	module.plotOrbit = function(dataBox, input, output, callback) {
		// TODO this will share functionality with plotCourse as the ship will need to navigate to the circular orbit
		callback(output);
	};
	
	return module;
};
