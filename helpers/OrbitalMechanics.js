var Victor = require('victor');

module.exports = function() {
	var module = {};
	
	module.SOL_ID                 = 1; // Special case for the ID of the sun in the db
	module.EARTH_SECONDS_IN_YEAR  = 31540000;
	module.SECONDS_IN_HOUR        = 3600;
	module.CENTER_OF_SYSTEM       = 0; // Previously was 2^32 / 2, but we're using signed integers for position now
	module.GRAVITATIONAL_CONSTANT = 0.001; // Calculated based on Earth at 150m km and Sun mass of 330m over period of 1/60th a revolution
	//module.GRAVITATIONAL_CONSTANT = 10; // Calculated based on Earth at 150m km and Sun mass of 330m over period of 1/60th a revolution
	module.EARTH_YEAR_PERIOD      = 60; // In game seconds that the Earth takes to orbit the sun
	module.PI_OVER_180            = 0.01745329251;
	module.TIME_UNIT              = module.EARTH_YEAR_PERIOD / 60; // The unit of time used for speed calculations, route checks, etc
	
	/**
	 * Data structure for a location in space and time.
	 */
	module.getCrd = function(posX, posY, movX, movY, timestamp) {
		var crd = {};
		
		crd.pos = {x : posX, y : posY};
		crd.mov = {x : movX, y : movY};
		crd.t = timestamp;
		
		return crd;
	};
	
	/**
	 * Calculate the position of a given body assuming circular orbit.
	 * Returns an array with two values, the first being X and the second being Y.
	 */
	module.getOrbitalPosition = function(parentPosition, distanceFromParent, orbitalPeriodHours, targetTimeMs, thetaOffsetDeg) {
		var orbitalPeriodSeconds = (orbitalPeriodHours * module.SECONDS_IN_HOUR) * (module.EARTH_YEAR_PERIOD / module.EARTH_SECONDS_IN_YEAR);
		var percentYearCompleted = ((targetTimeMs / 1000) % orbitalPeriodSeconds) / orbitalPeriodSeconds;
		var theta = ((360 * percentYearCompleted) + thetaOffsetDeg ) % 360;

		// TODO do we want to round the return here?
		return {x : Math.round(parentPosition.x + (Math.cos(theta * module.PI_OVER_180) * distanceFromParent)),
		        y : Math.round(parentPosition.y + (Math.sin(theta * module.PI_OVER_180) * distanceFromParent))};
	};
	
	/**
	 * Takes an array of celestial bodies and populates each with a position.
	 */
	module.populateOrbitalPositions = function(celestialBodies, targetTimeMs) {
		// Clear their old positions first
		for(var i = 0; i < celestialBodies.length; i++) {
			celestialBodies[i]['pos'] = null;
		}

		for(var i = 0; i < celestialBodies.length; i++) {
			module.populateOrbitalPosition(celestialBodies, i, targetTimeMs);
		}
	};
	
	module.populateOrbitalPosition = function(celestialBodies, i, targetTimeMs) {
		if(null != celestialBodies[i]['pos']) {
			return; // We have already calculated this position
		}
		
		if(module.SOL_ID == celestialBodies[i]['celestial_body_id']) {
			celestialBodies[i]['pos'] = {x : module.CENTER_OF_SYSTEM, y : module.CENTER_OF_SYSTEM};
		} else {
			// Look for the parent
			var found = false;
			
			for(var j = 0; j < celestialBodies.length; j++) {
				if(celestialBodies[i]['parent_body_id'] == celestialBodies[j]['celestial_body_id']) {
					// Found the parent

					if(null == celestialBodies[j]['pos']) {
						// Parent hasn't been calculated yet, calculate it
						module.populateOrbitalPosition(celestialBodies, j, targetTimeMs);
					}
					
					celestialBodies[i]['pos'] = module.getOrbitalPosition(celestialBodies[j]['pos'],
					                                                      celestialBodies[i]['distance_from_parent'],
											                              celestialBodies[i]['orbital_period_hours'],
											                              targetTimeMs, 0);

					found = true;
					break;
				}
			}
			
			if(!found) {
				// TODO this should be an exception
				console.log('Could not find parent ' + celestialBodies[i]['parent_body_id'] + ' for body ' + celestialBodies[i]['celestial_body_id']);
				celestialBodies[i]['pos'] = {x : 0, y : 0};
			}
		}
	}
	
	/**
	 * Returns a new coordinate for the player after timeframe seconds given no engine power
	 * @param position Vector array [0,0].
	 * @param movement Vector array.
	 * @param celestialBodies Array of objects, each object containing ["mass"=0, "pos"=[0,0]]
	 * TODO change from seconds to ms
	 * TODO change params to just take a coordinate
	 * TODO remove timeframe param, movement vector is inherently based on time, all of this needs to be handled internally to OrbitalMechanics
	 */
	module.getDriftCoordinate = function(position, movement, timestamp, timeframe, celestialBodies, round = false) {
		var distanceSq = 0;
		var gravitationalVector = new Victor(0, 0);
		var movementVector = new Victor(movement.x, movement.y);
		var positionVector = new Victor(position.x, position.y)
		var pullMag = 0;
		
		for(var i = 0; i < celestialBodies.length; i++) {
			// get distance from celestial body by subtracting positionVector from the celestialBody x and y values
			gravitationalVector.copyX(celestialBodies[i]["pos"]); // Set start of gravitational position to parent
			gravitationalVector.copyY(celestialBodies[i]["pos"]); // Set start of gravitational position to parent
			gravitationalVector.subtract(positionVector); // Subtract the child to get a distance vector from child to parent
			distance = gravitationalVector.length();
			
			pullMag = module.getGravitationalPull(celestialBodies[i]['mass'], distance, timeframe);
			
			gravitationalVector.normalize();
			gravitationalVector.multiply(new Victor(pullMag, pullMag));
			gravitationalVector.multiply(new Victor(timeframe, timeframe));
			
			movementVector.add(gravitationalVector); // Adjust the movement vector according to the pull of this body
		}
		
		positionVector.add(movementVector);
		
		if(round) {
			positionVector.x = Math.round(positionVector.x);
			positionVector.y = Math.round(positionVector.y);
			movementVector.x = Math.round(movementVector.x);
			movementVector.y = Math.round(movementVector.y);
		}
		
		return module.getCrd(positionVector.x, positionVector.y, movementVector.x, movementVector.y, timestamp + timeframe);
	};

	/**
	 * Function that determines the length of the vector applied to a body given parameters.
	 * Returns meters per second as an int
	 */
	module.getGravitationalPull = function(mass, distance, timeFrameSec) {
		// Because our gravitational constant is based on 1/60 of an Earth year, we need to adjust it based on our timeframe
		return (timeFrameSec / module.TIME_UNIT) * (module.GRAVITATIONAL_CONSTANT * (mass / (distance * distance)));
	};
	
	module.getDistanceSq = function(aX, aY, bX, bY) {
		var a = aX - bX;
		var b = aY - bY;
		
		return (a * a) + (b * b);
	};
	
	/**
	 * Removed because we're storing the orbital period in the DB
	 * Returns integer time in seconds.
	 */
	module.getOrbitalPeriod = function(distanceFromParent, parentMass) {
		return 2 * Math.PI * Math.sqrt(
			(distanceFromParent * distanceFromParent * distanceFromParent) /
			(module.GRAVITATIONAL_CONSTANT * parentMass)
		);
	};
	
	/**
	 * Function to add a 'orbital_period_hours' field to each celestial body.
	 *
	 * @return celestialBodies with populated 'orbital_period_hours' field for each.
	 */
	module.populateOrbitalPeriods = function(celestialBodies) {
		for(var i = 0; i < celestialBodies.length; i++) {
			if(module.SOL_ID == celestialBodies[i]['celestial_body_id']) {
				celestialBodies[i]['orbital_period_hours'] = 0;
			}
			
			if(undefined == celestialBodies[i]['orbital_period_hours']) {
				for(var j = 0; j < celestialBodies.length; j++) {
					if(celestialBodies[i]['parent_body_id'] == celestialBodies[j]['celestial_body_id']) {
						celestialBodies[i]['orbital_period_hours'] = module.getOrbitalPeriod(
							celestialBodies[i]['distance_from_parent'],
							celestialBodies[j]['mass']
						);
					}
				}
			}
		}
		
		return celestialBodies;
	};
	
	/**
	 * Similar to getOrbitalPeriod, but returns the speed at which a body is
	 * travelling relative to it's parent for a given distance.
	 * TODO this is untested
	 *
	 * @return Integer
	 */
	module.getOrbitalSpeed = function(distanceFromParent, parentMass, earthYearPeriodSeconds) {
		var orbitalPeriod = module.getOrbitalPeriod(distanceFromParent, parentMass);
		
		return ((2 * Math.PI * distanceFromParent) / module.TIME_UNIT) / orbitalPeriod;
	};
	
	module.getStationCrd = function(stationDef, timeMs, celestialBodies, updateBodyPositions = true) {
		if(updateBodyPositions) {
			module.populateOrbitalPositions(celestialBodies, timeMs);
		}
		
		var pos = {x : 0, y : 0};
		
		for(let i = 0; i < celestialBodies.length; i++) {
			if(celestialBodies[i]['celestial_body_id'] == stationDef['parent_body_id']) {
				pos = module.getOrbitalPosition(
					celestialBodies[i]['pos'],
					stationDef['distance_from_parent'],
					stationDef['orbital_period_hours'],
					timeMs,
					0
				);
			}
		}
		
		return module.getCrd(pos.x, pos.y, 0, 0, Math.round(timeMs / 1000));
	};
	
	module.getEscapeVelocity = function(parentMass, distanceFromParent) {
		return Math.sqrt((2 * module.GRAVITATIONAL_CONSTANT * parentMass) / distanceFromParent);
	};
	
	return module;
};
