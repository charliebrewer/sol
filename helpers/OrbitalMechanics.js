var Victor = require('victor');

module.exports = function() {
	var module = {};
	
	module.SOL_ID                 = 1; // Special case for the ID of the sun in the db
	module.EARTH_SECONDS_IN_YEAR  = 31540000;
	module.SECONDS_IN_HOUR        = 3600;
	module.CENTER_OF_SYSTEM       = 2147483648;
	module.GRAVITATIONAL_CONSTANT = 56334677000000; // Calculated based on Earth at 150m km and Sun mass of 330m over period of 1/60th a revolution
	module.EARTH_YEAR_PERIOD      = 60; // In game seconds that the Earth takes to orbit the sun
	module.PI_OVER_180            = 0.01745329251;
	
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

		if(celestialBodies[i]['celestial_body_id'] == module.SOL_ID) { // TODO make 1 a constant for the sun
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
	 */
	module.getDriftCoordinate = function(position, movement, timestamp, timeframe, celestialBodies) {
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
		
		return module.getCrd(positionVector.x, positionVector.y, movementVector.x, movementVector.y, timestamp + timeframe);
	};

	/**
	 * Function that determines the length of the vector applied to a body given parameters.
	 * Returns meters per second as an int
	 */
	module.getGravitationalPull = function(mass, distance, timeFrameSec) {
		// Because our gravitational constant is based on 1/60 of an Earth year, we need to adjust it based on our timeframe
		return (timeFrameSec / (module.EARTH_YEAR_PERIOD / 60)) * (module.GRAVITATIONAL_CONSTANT * (mass / (distance * distance)));
	};
	
	module.getDistanceSq = function(aX, aY, bX, bY) {
		var a = aX - bX;
		var b = aY - bY;
		
		return (a * a) + (b * b);
	};
	
	/**
	 * Removed because we're storing the orbital period in the DB
	 * Returns integer time in seconds.
	 * /
	module.getOrbitalPeriod = function(distanceFromParent, parentMass, earthYearPeriodSeconds) {
		
		/*
		var orbitalPeriodSeconds = 2 * Math.PI;
		
		var distanceOverMass = Math.sqrt(Math.pow(distanceFromParent, 3) / parentMass * 10000);

		orbitalPeriodSeconds *= distanceOverMass;
		
		//orbitalPeriodSeconds /= 2.5;
		
		//orbitalPeriodSeconds *= earthYearPeriodSeconds;
		
		return Math.round(orbitalPeriodSeconds);
		* /
		distanceFromParent *= 2500;
		parentMass *= (5.9736 * Math.pow(10, 11));

		//var constant = 2388880000000000000000;
		//2.38888e+21
		//2388880000000000000000
		
		var orbitalPeriodSeconds = (4 * Math.pow(Math.PI, 2)) * Math.pow(distanceFromParent, 3);
		orbitalPeriodSeconds = orbitalPeriodSeconds / parentMass;
		orbitalPeriodSeconds = Math.sqrt(orbitalPeriodSeconds);

		return Math.round(orbitalPeriodSeconds);
		
		
		/*
		seconds / 3600 = (2 * pi * radical(distanceFromParent / mass of orbited body)) / 3600
		tInSeconds = radical((4 * pi ^ 2 * distanceFromParentInMeters ^ 3) / mass in kg)
		39.4635 * above / 
		
		For Earth only:
		orbitalPeriodSeconds * X * earthYearPeriodSeconds = earthYearPeriodSeconds
		
		Need to get ratio of adjustments made to distance from parent and parent mass
		dfp = km / 2.5, should be meters: 2500 * dfp = meters
		pm  = 1000 * earth mass, should be kg: 1000 * earth mass = X kg
		earth mass in kg = 5.9722?10 24 kg
		5.9722 x 10 21
		* /
	};
	*/

	return module;
};