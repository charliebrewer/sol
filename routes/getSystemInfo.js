var express = require('express');
var router = express.Router();

var CelestialBodiesDAO = require('../models/CelestialBodiesDAO');

var OrbitalMechanics = require('../public/shared/OrbitalMechanics');

function populateBodyPosition() {
	// TODO need to handle edge case where data is input in wrong order and a body's parent doesn't have it's location set yet
};

router.get('/', function(req, res, next) {
	var returnData = {};
	
	CelestialBodiesDAO().getBodies(function(celestialBodies) {

		var returnData = {};
		
		// call getDrift with a given location
		var shortBodies = [];
		shortBodies[0] = {"mass" : celestialBodies[0]["mass"], "pos" : [2147483648,2147483648]}; // 2147483648 = center
		returnData.shortBodies = shortBodies;
		
		var startingPosition = [2147483648 + 400000000,2147483648];
		var startingMovement = [0,20000000];
		returnData.startX = startingPosition[0];
		returnData.startY = startingPosition[1];
		returnData.moveX  = startingMovement[0];
		returnData.moveY  = startingMovement[1];

		//module.getDrift = function(position, movement, timestamp, timeframe, celestialBodies) {
		var driftReturns = [];
		var currentTime = Date.now();
		var interval = 1;

		driftReturns[0] = OrbitalMechanics().getDrift(startingPosition, startingMovement, currentTime, interval, shortBodies);
		
		for(i = 1; i < 100; i++) {
			currentTime = driftReturns[i - 1]['t'];
			console.log('currentTime: ' + currentTime);
			
			driftReturns[i] = OrbitalMechanics().getDrift(startingPosition, startingMovement, currentTime, interval, shortBodies);
		}
	
		returnData.results = driftReturns;
		res.json(driftReturns);
		//res.render('getSystemInfo', { output: "driftReturns length: " + driftReturns.length, positions : /*JSON.stringify(driftReturns)*/ '' });
		/*
		var earthYearPeriodSeconds = 3600;
		//var orbitalPeriod;
		//var parentBodyMass;
		var bodyPositionX;
		var bodyPositionY;
		var parentPositionX;
		var parentPositionY;
		
		// temp
		var bodyPositions = [];

		/*
	module.getPosition = function(parentPositionX,
		                          parentPositionY,
		                          distanceFromParent,
		                          orbitalPeriodHours, // Number of hours in a year
		                          targetUnixTime,
		                          earthYearPeriod, // Amount of seconds in 1 Earth year
		                          thetaOffset,
		                          returnX, returnY) {
									  * /
									  
		for(var i = 0; i < celestialBodies.length; i++) {
			
			if(0 == celestialBodies[i]['parent_body_id']) {
				bodyPositionX = OrbitalMechanics().CENTER_OF_SYSTEM;
				bodyPositionY = OrbitalMechanics().CENTER_OF_SYSTEM;
			} else {
				// Need to find the parent because we need its position
				parentPositionX = -1;
				parentPositionY = -1;
				for(var j = 0; j < celestialBodies.length; j++) {
					if(celestialBodies[i]['parent_body_id'] == celestialBodies[j]['celestial_body_id']) {
						parentPositionX = celestialBodies[j].positionX;
						parentPositionY = celestialBodies[j].positionY;
						break;
					}
				}
				
				bodyPositions = [];
				for(var j = 0; j <= earthYearPeriodSeconds; j += Math.round(earthYearPeriodSeconds / 60)) { // Test to see where it went over a time period
				var bodyPosition = OrbitalMechanics().getPosition(parentPositionX,
				                                                  parentPositionY,
											                      celestialBodies[i]['distance_from_parent'],
											                      8760,
											                      // celestialBodies[i]['orbital_period_hours'], TODO alter the db table to add this...
											                      Date.now() + j, // TODO get unix time
											                      earthYearPeriodSeconds,
											                      celestialBodies[i]['theta_offset']);

				bodyPositions[j] = bodyPosition;
//console.log('time ' + j + ' set to ' + bodyPosition);
				}
//console.log(bodyPositions);

				bodyPositionX = bodyPosition[0];
				bodyPositionY = bodyPosition[1];
			}

			celestialBodies[i].positionX = bodyPositionX;
			celestialBodies[i].positionY = bodyPositionY;
		}
		//module.getOrbitalPeriod = function(distanceFromParent, parentMass, earthYearPeriodSeconds = 3600) {
		returnData.celestialBodies = celestialBodies;
		res.json(returnData);
		//*/
	});
});

module.exports = router;
