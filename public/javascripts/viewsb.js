(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Victor = require('victor');

module.exports = function() {
	var module = {};
	
	module.SOL_ID                 = 1; // Special case for the ID of the sun in the db
	module.EARTH_SECONDS_IN_YEAR  = 31540000;
	module.SECONDS_IN_HOUR        = 3600;
	module.CENTER_OF_SYSTEM       = 0; // Previously was 2^32 / 2, but we're using signed integers for position now
	//module.GRAVITATIONAL_CONSTANT = 56334677000000; // Calculated based on Earth at 150m km and Sun mass of 330m over period of 1/60th a revolution
	module.GRAVITATIONAL_CONSTANT = 10; // Calculated based on Earth at 150m km and Sun mass of 330m over period of 1/60th a revolution
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
	module.getOrbitalPeriod = function(distanceFromParent, parentMass, earthYearPeriodSeconds) {
		return 0;
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
		*/
	};
	
	/**
	 * Function to add a 'orbital_period_hours' field to each celestial body.
	 *
	 * @return celestialBodies with populated 'orbital_period_hours' field for each.
	 */
	module.populateOrbitalPeriods = function(celestialBodies) {
		for(var i = 0; i < celestialBodies.length; i++) {
			if(0 != celestialBodies[i]['parent_body_id']) {
				celestialBodies[i]['orbital_period_hours'] = 0;
			}
			
			if(undefined == celestialBodies[i]['orbital_period_hours']) {
				for(var j = 0; j < celestialBodies.length; j++) {
					if(celestialBodies[i]['parent_body_id'] == celestialBodies[j]['celestial_body_id']) {
						celestialBodies[i]['orbital_period_hours'] = module.getOrbitalPeriod(
							celestialBodies[i]['distance_from_parent'],
							celestialBodies[j]['mass'],
							module.EARTH_YEAR_PERIOD
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
		var orbitalPeriod = module.getOrbitalPeriod(distanceFromParent, parentMass, earthYearPeriodSeconds);
		
		return ((2 * Math.PI * distanceFromParent) / module.TIME_UNIT) / orbitalPeriod;
	};
	
	module.getStationPosition = function(stationDef, timeMs, celestialBodies, updateBodyPositions = true) {
		if(updateBodyPositions) {
			celestialBodies = module.populateOrbitalPositions(celestialBodies, timeMs);
		}
		
		// TODO
		return {x : 0, y : 0};
	};

	return module;
};

},{"victor":2}],2:[function(require,module,exports){
exports = module.exports = Victor;

/**
 * # Victor - A JavaScript 2D vector class with methods for common vector operations
 */

/**
 * Constructor. Will also work without the `new` keyword
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = Victor(42, 1337);
 *
 * @param {Number} x Value of the x axis
 * @param {Number} y Value of the y axis
 * @return {Victor}
 * @api public
 */
function Victor (x, y) {
	if (!(this instanceof Victor)) {
		return new Victor(x, y);
	}

	/**
	 * The X axis
	 *
	 * ### Examples:
	 *     var vec = new Victor.fromArray(42, 21);
	 *
	 *     vec.x;
	 *     // => 42
	 *
	 * @api public
	 */
	this.x = x || 0;

	/**
	 * The Y axis
	 *
	 * ### Examples:
	 *     var vec = new Victor.fromArray(42, 21);
	 *
	 *     vec.y;
	 *     // => 21
	 *
	 * @api public
	 */
	this.y = y || 0;
};

/**
 * # Static
 */

/**
 * Creates a new instance from an array
 *
 * ### Examples:
 *     var vec = Victor.fromArray([42, 21]);
 *
 *     vec.toString();
 *     // => x:42, y:21
 *
 * @name Victor.fromArray
 * @param {Array} array Array with the x and y values at index 0 and 1 respectively
 * @return {Victor} The new instance
 * @api public
 */
Victor.fromArray = function (arr) {
	return new Victor(arr[0] || 0, arr[1] || 0);
};

/**
 * Creates a new instance from an object
 *
 * ### Examples:
 *     var vec = Victor.fromObject({ x: 42, y: 21 });
 *
 *     vec.toString();
 *     // => x:42, y:21
 *
 * @name Victor.fromObject
 * @param {Object} obj Object with the values for x and y
 * @return {Victor} The new instance
 * @api public
 */
Victor.fromObject = function (obj) {
	return new Victor(obj.x || 0, obj.y || 0);
};

/**
 * # Manipulation
 *
 * These functions are chainable.
 */

/**
 * Adds another vector's X axis to this one
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *     var vec2 = new Victor(20, 30);
 *
 *     vec1.addX(vec2);
 *     vec1.toString();
 *     // => x:30, y:10
 *
 * @param {Victor} vector The other vector you want to add to this one
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.addX = function (vec) {
	this.x += vec.x;
	return this;
};

/**
 * Adds another vector's Y axis to this one
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *     var vec2 = new Victor(20, 30);
 *
 *     vec1.addY(vec2);
 *     vec1.toString();
 *     // => x:10, y:40
 *
 * @param {Victor} vector The other vector you want to add to this one
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.addY = function (vec) {
	this.y += vec.y;
	return this;
};

/**
 * Adds another vector to this one
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *     var vec2 = new Victor(20, 30);
 *
 *     vec1.add(vec2);
 *     vec1.toString();
 *     // => x:30, y:40
 *
 * @param {Victor} vector The other vector you want to add to this one
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.add = function (vec) {
	this.x += vec.x;
	this.y += vec.y;
	return this;
};

/**
 * Adds the given scalar to both vector axis
 *
 * ### Examples:
 *     var vec = new Victor(1, 2);
 *
 *     vec.addScalar(2);
 *     vec.toString();
 *     // => x: 3, y: 4
 *
 * @param {Number} scalar The scalar to add
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.addScalar = function (scalar) {
	this.x += scalar;
	this.y += scalar;
	return this;
};

/**
 * Adds the given scalar to the X axis
 *
 * ### Examples:
 *     var vec = new Victor(1, 2);
 *
 *     vec.addScalarX(2);
 *     vec.toString();
 *     // => x: 3, y: 2
 *
 * @param {Number} scalar The scalar to add
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.addScalarX = function (scalar) {
	this.x += scalar;
	return this;
};

/**
 * Adds the given scalar to the Y axis
 *
 * ### Examples:
 *     var vec = new Victor(1, 2);
 *
 *     vec.addScalarY(2);
 *     vec.toString();
 *     // => x: 1, y: 4
 *
 * @param {Number} scalar The scalar to add
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.addScalarY = function (scalar) {
	this.y += scalar;
	return this;
};

/**
 * Subtracts the X axis of another vector from this one
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(20, 30);
 *
 *     vec1.subtractX(vec2);
 *     vec1.toString();
 *     // => x:80, y:50
 *
 * @param {Victor} vector The other vector you want subtract from this one
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.subtractX = function (vec) {
	this.x -= vec.x;
	return this;
};

/**
 * Subtracts the Y axis of another vector from this one
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(20, 30);
 *
 *     vec1.subtractY(vec2);
 *     vec1.toString();
 *     // => x:100, y:20
 *
 * @param {Victor} vector The other vector you want subtract from this one
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.subtractY = function (vec) {
	this.y -= vec.y;
	return this;
};

/**
 * Subtracts another vector from this one
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(20, 30);
 *
 *     vec1.subtract(vec2);
 *     vec1.toString();
 *     // => x:80, y:20
 *
 * @param {Victor} vector The other vector you want subtract from this one
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.subtract = function (vec) {
	this.x -= vec.x;
	this.y -= vec.y;
	return this;
};

/**
 * Subtracts the given scalar from both axis
 *
 * ### Examples:
 *     var vec = new Victor(100, 200);
 *
 *     vec.subtractScalar(20);
 *     vec.toString();
 *     // => x: 80, y: 180
 *
 * @param {Number} scalar The scalar to subtract
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.subtractScalar = function (scalar) {
	this.x -= scalar;
	this.y -= scalar;
	return this;
};

/**
 * Subtracts the given scalar from the X axis
 *
 * ### Examples:
 *     var vec = new Victor(100, 200);
 *
 *     vec.subtractScalarX(20);
 *     vec.toString();
 *     // => x: 80, y: 200
 *
 * @param {Number} scalar The scalar to subtract
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.subtractScalarX = function (scalar) {
	this.x -= scalar;
	return this;
};

/**
 * Subtracts the given scalar from the Y axis
 *
 * ### Examples:
 *     var vec = new Victor(100, 200);
 *
 *     vec.subtractScalarY(20);
 *     vec.toString();
 *     // => x: 100, y: 180
 *
 * @param {Number} scalar The scalar to subtract
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.subtractScalarY = function (scalar) {
	this.y -= scalar;
	return this;
};

/**
 * Divides the X axis by the x component of given vector
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *     var vec2 = new Victor(2, 0);
 *
 *     vec.divideX(vec2);
 *     vec.toString();
 *     // => x:50, y:50
 *
 * @param {Victor} vector The other vector you want divide by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.divideX = function (vector) {
	this.x /= vector.x;
	return this;
};

/**
 * Divides the Y axis by the y component of given vector
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *     var vec2 = new Victor(0, 2);
 *
 *     vec.divideY(vec2);
 *     vec.toString();
 *     // => x:100, y:25
 *
 * @param {Victor} vector The other vector you want divide by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.divideY = function (vector) {
	this.y /= vector.y;
	return this;
};

/**
 * Divides both vector axis by a axis values of given vector
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *     var vec2 = new Victor(2, 2);
 *
 *     vec.divide(vec2);
 *     vec.toString();
 *     // => x:50, y:25
 *
 * @param {Victor} vector The vector to divide by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.divide = function (vector) {
	this.x /= vector.x;
	this.y /= vector.y;
	return this;
};

/**
 * Divides both vector axis by the given scalar value
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.divideScalar(2);
 *     vec.toString();
 *     // => x:50, y:25
 *
 * @param {Number} The scalar to divide by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.divideScalar = function (scalar) {
	if (scalar !== 0) {
		this.x /= scalar;
		this.y /= scalar;
	} else {
		this.x = 0;
		this.y = 0;
	}

	return this;
};

/**
 * Divides the X axis by the given scalar value
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.divideScalarX(2);
 *     vec.toString();
 *     // => x:50, y:50
 *
 * @param {Number} The scalar to divide by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.divideScalarX = function (scalar) {
	if (scalar !== 0) {
		this.x /= scalar;
	} else {
		this.x = 0;
	}
	return this;
};

/**
 * Divides the Y axis by the given scalar value
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.divideScalarY(2);
 *     vec.toString();
 *     // => x:100, y:25
 *
 * @param {Number} The scalar to divide by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.divideScalarY = function (scalar) {
	if (scalar !== 0) {
		this.y /= scalar;
	} else {
		this.y = 0;
	}
	return this;
};

/**
 * Inverts the X axis
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.invertX();
 *     vec.toString();
 *     // => x:-100, y:50
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.invertX = function () {
	this.x *= -1;
	return this;
};

/**
 * Inverts the Y axis
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.invertY();
 *     vec.toString();
 *     // => x:100, y:-50
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.invertY = function () {
	this.y *= -1;
	return this;
};

/**
 * Inverts both axis
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.invert();
 *     vec.toString();
 *     // => x:-100, y:-50
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.invert = function () {
	this.invertX();
	this.invertY();
	return this;
};

/**
 * Multiplies the X axis by X component of given vector
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *     var vec2 = new Victor(2, 0);
 *
 *     vec.multiplyX(vec2);
 *     vec.toString();
 *     // => x:200, y:50
 *
 * @param {Victor} vector The vector to multiply the axis with
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.multiplyX = function (vector) {
	this.x *= vector.x;
	return this;
};

/**
 * Multiplies the Y axis by Y component of given vector
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *     var vec2 = new Victor(0, 2);
 *
 *     vec.multiplyX(vec2);
 *     vec.toString();
 *     // => x:100, y:100
 *
 * @param {Victor} vector The vector to multiply the axis with
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.multiplyY = function (vector) {
	this.y *= vector.y;
	return this;
};

/**
 * Multiplies both vector axis by values from a given vector
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *     var vec2 = new Victor(2, 2);
 *
 *     vec.multiply(vec2);
 *     vec.toString();
 *     // => x:200, y:100
 *
 * @param {Victor} vector The vector to multiply by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.multiply = function (vector) {
	this.x *= vector.x;
	this.y *= vector.y;
	return this;
};

/**
 * Multiplies both vector axis by the given scalar value
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.multiplyScalar(2);
 *     vec.toString();
 *     // => x:200, y:100
 *
 * @param {Number} The scalar to multiply by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.multiplyScalar = function (scalar) {
	this.x *= scalar;
	this.y *= scalar;
	return this;
};

/**
 * Multiplies the X axis by the given scalar
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.multiplyScalarX(2);
 *     vec.toString();
 *     // => x:200, y:50
 *
 * @param {Number} The scalar to multiply the axis with
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.multiplyScalarX = function (scalar) {
	this.x *= scalar;
	return this;
};

/**
 * Multiplies the Y axis by the given scalar
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.multiplyScalarY(2);
 *     vec.toString();
 *     // => x:100, y:100
 *
 * @param {Number} The scalar to multiply the axis with
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.multiplyScalarY = function (scalar) {
	this.y *= scalar;
	return this;
};

/**
 * Normalize
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.normalize = function () {
	var length = this.length();

	if (length === 0) {
		this.x = 1;
		this.y = 0;
	} else {
		this.divide(Victor(length, length));
	}
	return this;
};

Victor.prototype.norm = Victor.prototype.normalize;

/**
 * If the absolute vector axis is greater than `max`, multiplies the axis by `factor`
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.limit(80, 0.9);
 *     vec.toString();
 *     // => x:90, y:50
 *
 * @param {Number} max The maximum value for both x and y axis
 * @param {Number} factor Factor by which the axis are to be multiplied with
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.limit = function (max, factor) {
	if (Math.abs(this.x) > max){ this.x *= factor; }
	if (Math.abs(this.y) > max){ this.y *= factor; }
	return this;
};

/**
 * Randomizes both vector axis with a value between 2 vectors
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.randomize(new Victor(50, 60), new Victor(70, 80`));
 *     vec.toString();
 *     // => x:67, y:73
 *
 * @param {Victor} topLeft first vector
 * @param {Victor} bottomRight second vector
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.randomize = function (topLeft, bottomRight) {
	this.randomizeX(topLeft, bottomRight);
	this.randomizeY(topLeft, bottomRight);

	return this;
};

/**
 * Randomizes the y axis with a value between 2 vectors
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.randomizeX(new Victor(50, 60), new Victor(70, 80`));
 *     vec.toString();
 *     // => x:55, y:50
 *
 * @param {Victor} topLeft first vector
 * @param {Victor} bottomRight second vector
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.randomizeX = function (topLeft, bottomRight) {
	var min = Math.min(topLeft.x, bottomRight.x);
	var max = Math.max(topLeft.x, bottomRight.x);
	this.x = random(min, max);
	return this;
};

/**
 * Randomizes the y axis with a value between 2 vectors
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.randomizeY(new Victor(50, 60), new Victor(70, 80`));
 *     vec.toString();
 *     // => x:100, y:66
 *
 * @param {Victor} topLeft first vector
 * @param {Victor} bottomRight second vector
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.randomizeY = function (topLeft, bottomRight) {
	var min = Math.min(topLeft.y, bottomRight.y);
	var max = Math.max(topLeft.y, bottomRight.y);
	this.y = random(min, max);
	return this;
};

/**
 * Randomly randomizes either axis between 2 vectors
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.randomizeAny(new Victor(50, 60), new Victor(70, 80));
 *     vec.toString();
 *     // => x:100, y:77
 *
 * @param {Victor} topLeft first vector
 * @param {Victor} bottomRight second vector
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.randomizeAny = function (topLeft, bottomRight) {
	if (!! Math.round(Math.random())) {
		this.randomizeX(topLeft, bottomRight);
	} else {
		this.randomizeY(topLeft, bottomRight);
	}
	return this;
};

/**
 * Rounds both axis to an integer value
 *
 * ### Examples:
 *     var vec = new Victor(100.2, 50.9);
 *
 *     vec.unfloat();
 *     vec.toString();
 *     // => x:100, y:51
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.unfloat = function () {
	this.x = Math.round(this.x);
	this.y = Math.round(this.y);
	return this;
};

/**
 * Rounds both axis to a certain precision
 *
 * ### Examples:
 *     var vec = new Victor(100.2, 50.9);
 *
 *     vec.unfloat();
 *     vec.toString();
 *     // => x:100, y:51
 *
 * @param {Number} Precision (default: 8)
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.toFixed = function (precision) {
	if (typeof precision === 'undefined') { precision = 8; }
	this.x = this.x.toFixed(precision);
	this.y = this.y.toFixed(precision);
	return this;
};

/**
 * Performs a linear blend / interpolation of the X axis towards another vector
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 100);
 *     var vec2 = new Victor(200, 200);
 *
 *     vec1.mixX(vec2, 0.5);
 *     vec.toString();
 *     // => x:150, y:100
 *
 * @param {Victor} vector The other vector
 * @param {Number} amount The blend amount (optional, default: 0.5)
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.mixX = function (vec, amount) {
	if (typeof amount === 'undefined') {
		amount = 0.5;
	}

	this.x = (1 - amount) * this.x + amount * vec.x;
	return this;
};

/**
 * Performs a linear blend / interpolation of the Y axis towards another vector
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 100);
 *     var vec2 = new Victor(200, 200);
 *
 *     vec1.mixY(vec2, 0.5);
 *     vec.toString();
 *     // => x:100, y:150
 *
 * @param {Victor} vector The other vector
 * @param {Number} amount The blend amount (optional, default: 0.5)
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.mixY = function (vec, amount) {
	if (typeof amount === 'undefined') {
		amount = 0.5;
	}

	this.y = (1 - amount) * this.y + amount * vec.y;
	return this;
};

/**
 * Performs a linear blend / interpolation towards another vector
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 100);
 *     var vec2 = new Victor(200, 200);
 *
 *     vec1.mix(vec2, 0.5);
 *     vec.toString();
 *     // => x:150, y:150
 *
 * @param {Victor} vector The other vector
 * @param {Number} amount The blend amount (optional, default: 0.5)
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.mix = function (vec, amount) {
	this.mixX(vec, amount);
	this.mixY(vec, amount);
	return this;
};

/**
 * # Products
 */

/**
 * Creates a clone of this vector
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *     var vec2 = vec1.clone();
 *
 *     vec2.toString();
 *     // => x:10, y:10
 *
 * @return {Victor} A clone of the vector
 * @api public
 */
Victor.prototype.clone = function () {
	return new Victor(this.x, this.y);
};

/**
 * Copies another vector's X component in to its own
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *     var vec2 = new Victor(20, 20);
 *     var vec2 = vec1.copyX(vec1);
 *
 *     vec2.toString();
 *     // => x:20, y:10
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.copyX = function (vec) {
	this.x = vec.x;
	return this;
};

/**
 * Copies another vector's Y component in to its own
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *     var vec2 = new Victor(20, 20);
 *     var vec2 = vec1.copyY(vec1);
 *
 *     vec2.toString();
 *     // => x:10, y:20
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.copyY = function (vec) {
	this.y = vec.y;
	return this;
};

/**
 * Copies another vector's X and Y components in to its own
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *     var vec2 = new Victor(20, 20);
 *     var vec2 = vec1.copy(vec1);
 *
 *     vec2.toString();
 *     // => x:20, y:20
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.copy = function (vec) {
	this.copyX(vec);
	this.copyY(vec);
	return this;
};

/**
 * Sets the vector to zero (0,0)
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *		 var1.zero();
 *     vec1.toString();
 *     // => x:0, y:0
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.zero = function () {
	this.x = this.y = 0;
	return this;
};

/**
 * Calculates the dot product of this vector and another
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(200, 60);
 *
 *     vec1.dot(vec2);
 *     // => 23000
 *
 * @param {Victor} vector The second vector
 * @return {Number} Dot product
 * @api public
 */
Victor.prototype.dot = function (vec2) {
	return this.x * vec2.x + this.y * vec2.y;
};

Victor.prototype.cross = function (vec2) {
	return (this.x * vec2.y ) - (this.y * vec2.x );
};

/**
 * Projects a vector onto another vector, setting itself to the result.
 *
 * ### Examples:
 *     var vec = new Victor(100, 0);
 *     var vec2 = new Victor(100, 100);
 *
 *     vec.projectOnto(vec2);
 *     vec.toString();
 *     // => x:50, y:50
 *
 * @param {Victor} vector The other vector you want to project this vector onto
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.projectOnto = function (vec2) {
    var coeff = ( (this.x * vec2.x)+(this.y * vec2.y) ) / ((vec2.x*vec2.x)+(vec2.y*vec2.y));
    this.x = coeff * vec2.x;
    this.y = coeff * vec2.y;
    return this;
};


Victor.prototype.horizontalAngle = function () {
	return Math.atan2(this.y, this.x);
};

Victor.prototype.horizontalAngleDeg = function () {
	return radian2degrees(this.horizontalAngle());
};

Victor.prototype.verticalAngle = function () {
	return Math.atan2(this.x, this.y);
};

Victor.prototype.verticalAngleDeg = function () {
	return radian2degrees(this.verticalAngle());
};

Victor.prototype.angle = Victor.prototype.horizontalAngle;
Victor.prototype.angleDeg = Victor.prototype.horizontalAngleDeg;
Victor.prototype.direction = Victor.prototype.horizontalAngle;

Victor.prototype.rotate = function (angle) {
	var nx = (this.x * Math.cos(angle)) - (this.y * Math.sin(angle));
	var ny = (this.x * Math.sin(angle)) + (this.y * Math.cos(angle));

	this.x = nx;
	this.y = ny;

	return this;
};

Victor.prototype.rotateDeg = function (angle) {
	angle = degrees2radian(angle);
	return this.rotate(angle);
};

Victor.prototype.rotateTo = function(rotation) {
	return this.rotate(rotation-this.angle());
};

Victor.prototype.rotateToDeg = function(rotation) {
	rotation = degrees2radian(rotation);
	return this.rotateTo(rotation);
};

Victor.prototype.rotateBy = function (rotation) {
	var angle = this.angle() + rotation;

	return this.rotate(angle);
};

Victor.prototype.rotateByDeg = function (rotation) {
	rotation = degrees2radian(rotation);
	return this.rotateBy(rotation);
};

/**
 * Calculates the distance of the X axis between this vector and another
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(200, 60);
 *
 *     vec1.distanceX(vec2);
 *     // => -100
 *
 * @param {Victor} vector The second vector
 * @return {Number} Distance
 * @api public
 */
Victor.prototype.distanceX = function (vec) {
	return this.x - vec.x;
};

/**
 * Same as `distanceX()` but always returns an absolute number
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(200, 60);
 *
 *     vec1.absDistanceX(vec2);
 *     // => 100
 *
 * @param {Victor} vector The second vector
 * @return {Number} Absolute distance
 * @api public
 */
Victor.prototype.absDistanceX = function (vec) {
	return Math.abs(this.distanceX(vec));
};

/**
 * Calculates the distance of the Y axis between this vector and another
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(200, 60);
 *
 *     vec1.distanceY(vec2);
 *     // => -10
 *
 * @param {Victor} vector The second vector
 * @return {Number} Distance
 * @api public
 */
Victor.prototype.distanceY = function (vec) {
	return this.y - vec.y;
};

/**
 * Same as `distanceY()` but always returns an absolute number
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(200, 60);
 *
 *     vec1.distanceY(vec2);
 *     // => 10
 *
 * @param {Victor} vector The second vector
 * @return {Number} Absolute distance
 * @api public
 */
Victor.prototype.absDistanceY = function (vec) {
	return Math.abs(this.distanceY(vec));
};

/**
 * Calculates the euclidean distance between this vector and another
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(200, 60);
 *
 *     vec1.distance(vec2);
 *     // => 100.4987562112089
 *
 * @param {Victor} vector The second vector
 * @return {Number} Distance
 * @api public
 */
Victor.prototype.distance = function (vec) {
	return Math.sqrt(this.distanceSq(vec));
};

/**
 * Calculates the squared euclidean distance between this vector and another
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(200, 60);
 *
 *     vec1.distanceSq(vec2);
 *     // => 10100
 *
 * @param {Victor} vector The second vector
 * @return {Number} Distance
 * @api public
 */
Victor.prototype.distanceSq = function (vec) {
	var dx = this.distanceX(vec),
		dy = this.distanceY(vec);

	return dx * dx + dy * dy;
};

/**
 * Calculates the length or magnitude of the vector
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.length();
 *     // => 111.80339887498948
 *
 * @return {Number} Length / Magnitude
 * @api public
 */
Victor.prototype.length = function () {
	return Math.sqrt(this.lengthSq());
};

/**
 * Squared length / magnitude
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.lengthSq();
 *     // => 12500
 *
 * @return {Number} Length / Magnitude
 * @api public
 */
Victor.prototype.lengthSq = function () {
	return this.x * this.x + this.y * this.y;
};

Victor.prototype.magnitude = Victor.prototype.length;

/**
 * Returns a true if vector is (0, 0)
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *     vec.zero();
 *
 *     // => true
 *
 * @return {Boolean}
 * @api public
 */
Victor.prototype.isZero = function() {
	return this.x === 0 && this.y === 0;
};

/**
 * Returns a true if this vector is the same as another
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(100, 50);
 *     vec1.isEqualTo(vec2);
 *
 *     // => true
 *
 * @return {Boolean}
 * @api public
 */
Victor.prototype.isEqualTo = function(vec2) {
	return this.x === vec2.x && this.y === vec2.y;
};

/**
 * # Utility Methods
 */

/**
 * Returns an string representation of the vector
 *
 * ### Examples:
 *     var vec = new Victor(10, 20);
 *
 *     vec.toString();
 *     // => x:10, y:20
 *
 * @return {String}
 * @api public
 */
Victor.prototype.toString = function () {
	return 'x:' + this.x + ', y:' + this.y;
};

/**
 * Returns an array representation of the vector
 *
 * ### Examples:
 *     var vec = new Victor(10, 20);
 *
 *     vec.toArray();
 *     // => [10, 20]
 *
 * @return {Array}
 * @api public
 */
Victor.prototype.toArray = function () {
	return [ this.x, this.y ];
};

/**
 * Returns an object representation of the vector
 *
 * ### Examples:
 *     var vec = new Victor(10, 20);
 *
 *     vec.toObject();
 *     // => { x: 10, y: 20 }
 *
 * @return {Object}
 * @api public
 */
Victor.prototype.toObject = function () {
	return { x: this.x, y: this.y };
};


var degrees = 180 / Math.PI;

function random (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function radian2degrees (rad) {
	return rad * degrees;
}

function degrees2radian (deg) {
	return deg / degrees;
}

},{}],3:[function(require,module,exports){
var OrbitalMechanics = require('../../helpers/OrbitalMechanics');

SolGame.views = {
	pixiApp : null,
	
	// TODO move this to navigation class or something
	route : null,
	
	init : function() {
		SolGame.views.pixiApp = new PIXI.Application();
		document.body.appendChild(SolGame.views.pixiApp.view);
		
		SolGame.views.drift = new PIXI.Graphics();
		SolGame.views.drift.lineStyle(1, 0xFFFFFF);
		SolGame.views.pixiApp.stage.addChild(SolGame.views.drift);

		SolGame.views.controlPoint = new PIXI.Graphics();
		SolGame.views.controlPoint.lineStyle(1, 0xFFFFFF);
		SolGame.views.pixiApp.stage.addChild(SolGame.views.controlPoint);
		
		SolGame.views.controlPoint2 = new PIXI.Graphics();
		SolGame.views.controlPoint2.lineStyle(1, 0xFFFFFF);
		SolGame.views.pixiApp.stage.addChild(SolGame.views.controlPoint2);
	},
	
	/**
	 * General function to load resources into pixi.
	 * @param resources Array of objects containing a "name" and "img_url" properties.
	 */
	loadResources : function(resources, callback) {
		// TODO check that we're not loading resources twice
		resources.forEach(function(resource) {
			SolGame.views.pixiApp.loader.add(resource["name"], resource["img_url"]);
		});
		
		SolGame.views.pixiApp.loader.load((loader, pResources) => {
			for(var i = 0; i < resources.length; i++) {
				var sprite = new PIXI.Sprite(pResources[resources[i]["name"]].texture);

				// TODO remove scaling
				sprite.scale.x = 0.1;
				sprite.scale.y = 0.1;
				
				sprite.anchor.x = 0.5;
				sprite.anchor.y = 0.5;
				
				SolGame.views.pixiApp.stage.addChild(sprite);

				resources[i].sprite = sprite;
			};
		});
		
		SolGame.views.pixiApp.loader.onComplete.add(callback);
	},
	
	flag : true, // TODO remove
	startingTimeMs : Date.now(), // TODO remove, temp hack so i can look at the same data over and over
	totalTimeSec : 100,
	systemSize : 2500,
	driftCrds : [],
	
	renderNavigationView : function() {
		console.log('in renderNavigationView');
		// Make sure planets are loaded
		SolGame.views.loadResources(SolGame.DefinitionsData.celestialBodies, function() {
			SolGame.views.pixiApp.ticker.add(SolGame.views.updateNavigationView);
		});
		
		var route;
		
		var startCrd = OrbitalMechanics().getCrd(
			SolGame.PlayerData.playerRoutes[0]['route_data'][0].rsx,
			SolGame.PlayerData.playerRoutes[0]['route_data'][0].rsy,
			0, // Temporarily hard coded, it is difficult to pull out the movement vector for a drift from a bezier curve subsection
			100,
			0
		);
		
		for(var i = 0; i < SolGame.PlayerData.playerRoutes.length; i++) {
			for(var j = 0; j < SolGame.PlayerData.playerRoutes[i]['route_data'].length; j++) {
				route = new PIXI.Graphics();
				route.lineStyle(1, 0xFFFFFF, 1);
				SolGame.views.pixiApp.stage.addChild(route);
				
				route.moveTo(
					SolGame.views.getRenderedPosition(SolGame.PlayerData.playerRoutes[i]['route_data'][j].rsx, true),
					SolGame.views.getRenderedPosition(SolGame.PlayerData.playerRoutes[i]['route_data'][j].rsy, false)
				);
				
				/*
				SolGame.views.controlPoint.drawCircle(
					SolGame.views.getRenderedPosition(SolGame.PlayerData.playerRoutes[i]['route_data'][j].rc1x, true),
					SolGame.views.getRenderedPosition(SolGame.PlayerData.playerRoutes[i]['route_data'][j].rc1y, false),
					10
				);
				SolGame.views.controlPoint2.drawCircle(
					SolGame.views.getRenderedPosition(SolGame.PlayerData.playerRoutes[i]['route_data'][j].rc2x, true),
					SolGame.views.getRenderedPosition(SolGame.PlayerData.playerRoutes[i]['route_data'][j].rc2y, false),
					10
				);
				*/
				
				route.bezierCurveTo(
					((SolGame.PlayerData.playerRoutes[i]['route_data'][j].rc1x + (SolGame.views.systemSize / 2)) / SolGame.views.systemSize) * SolGame.views.pixiApp.renderer.width,
					((SolGame.PlayerData.playerRoutes[i]['route_data'][j].rc1y + (SolGame.views.systemSize / 2)) / SolGame.views.systemSize) * SolGame.views.pixiApp.renderer.height,
					((SolGame.PlayerData.playerRoutes[i]['route_data'][j].rc2x + (SolGame.views.systemSize / 2)) / SolGame.views.systemSize) * SolGame.views.pixiApp.renderer.width,
					((SolGame.PlayerData.playerRoutes[i]['route_data'][j].rc2y + (SolGame.views.systemSize / 2)) / SolGame.views.systemSize) * SolGame.views.pixiApp.renderer.height,
					((SolGame.PlayerData.playerRoutes[i]['route_data'][j].rex + (SolGame.views.systemSize / 2)) / SolGame.views.systemSize) * SolGame.views.pixiApp.renderer.width,
					((SolGame.PlayerData.playerRoutes[i]['route_data'][j].rey + (SolGame.views.systemSize / 2)) / SolGame.views.systemSize) * SolGame.views.pixiApp.renderer.height
				);
			}
		}
		
		if(null != startCrd) {
			var prevCrd = startCrd;
			var newCrd;
			SolGame.views.driftCrds.push(prevCrd); // prime ze pump
			
			for(var i = 0; i < 100; i++) {
				OrbitalMechanics().populateOrbitalPositions(SolGame.DefinitionsData.celestialBodies, prevCrd.t * 1000);
				newCrd = OrbitalMechanics().getDriftCoordinate(prevCrd.pos, prevCrd.mov, prevCrd.t, 1, SolGame.DefinitionsData.celestialBodies);
				SolGame.views.driftCrds.push(newCrd);
				prevCrd = newCrd;
			}
		}
		
		// get the player's location (en route / docked)
		// add ticker to update data
	},
	
	getRenderedPosition : function(pos, isX) {
		if(isX) {
			return ((pos + (SolGame.views.systemSize / 2)) / SolGame.views.systemSize) * SolGame.views.pixiApp.renderer.width;
		} else {
			return ((pos + (SolGame.views.systemSize / 2)) / SolGame.views.systemSize) * SolGame.views.pixiApp.renderer.height;
		}
	},
	
	currentDriftI : -1,
	
	// This function will be passed to a ticker once assets are loaded to update the position of the planets as desired
	updateNavigationView : function(delta) {
		var currTimeMs = Date.now() - SolGame.views.startingTimeMs;
		currTimeMs = currTimeMs % (SolGame.views.totalTimeSec * 1000);
		
		var celestialBodies = SolGame.DefinitionsData.celestialBodies;
		OrbitalMechanics().populateOrbitalPositions(celestialBodies, currTimeMs);
		
		for(var i = 0; i < celestialBodies.length; i++) {
			celestialBodies[i].sprite.x = SolGame.views.getRenderedPosition(celestialBodies[i]["pos"].x, true);
			celestialBodies[i].sprite.y = SolGame.views.getRenderedPosition(celestialBodies[i]["pos"].y, false);
		};
		
		for(var i = 0; i < SolGame.views.driftCrds.length; i++) {
			if(-1 == SolGame.views.currentDriftI || (SolGame.views.driftCrds[i].t * 1000 <= currTimeMs && SolGame.views.driftCrds[i].t > SolGame.views.driftCrds[SolGame.views.currentDriftI].t)) {
				SolGame.views.currentDriftI = i;
				SolGame.views.drift.clear();
				SolGame.views.drift.lineStyle(1, 0xFFFFFF);
			}
		}
		
		SolGame.views.drift.drawCircle(SolGame.views.getRenderedPosition(SolGame.views.driftCrds[SolGame.views.currentDriftI].pos.x, true), SolGame.views.getRenderedPosition(SolGame.views.driftCrds[SolGame.views.currentDriftI].pos.y, false), 10);
		
		
		
		
		//SolGame.views.drift.drawCircle(100,100,100);
		
		//console.log(SolGame.views.driftCrds[currentDriftI].pos.x);
		//console.log(SolGame.views.getRenderedPosition(SolGame.views.driftCrds[currentDriftI].pos.x, true));
		// We also want to display the approximate drift locations of the player from a given starting position
		//OrbitalMechanics().getDriftCoordinate(position, movement, timestamp, timeframe, celestialBodies);
		
		/*
		// Below is the old code that displays a bezier curve from one planet to another, just a test. It is also based on the center
		// of the system constant not being at 0,0 but at 2^32 / 2
		var timeMs = Date.now();
		var celestialBodies = SolGame.DefinitionsData.celestialBodies;
		
		// TODO this is not populating positions properly
		OrbitalMechanics().populateOrbitalPositions(celestialBodies, timeMs);
		if(false && SolGame.views.flag) {
			SolGame.views.flag = false;
			console.log(celestialBodies);
		}
		
		var p0,p1,p2,p3,p4,p5;
		
		for(var i = 0; i < celestialBodies.length; i++) {
			// Temp code for testing a bezier curve
			if(celestialBodies[i]['name'] == 'Moon') {
				p0 = celestialBodies[i]["pos"].x;
				p1 = celestialBodies[i]["pos"].y;
			} else if(celestialBodies[i]['name'] == 'Mercury') {
				p4 = celestialBodies[i]["pos"].x;
				p5 = celestialBodies[i]["pos"].y;
			}
			
			celestialBodies[i].sprite.x = ((((celestialBodies[i]["pos"].x / (2 * OrbitalMechanics().CENTER_OF_SYSTEM)) - 0.5)) + 0.5) * SolGame.views.pixiApp.renderer.width;
			celestialBodies[i].sprite.y = ((((celestialBodies[i]["pos"].y / (2 * OrbitalMechanics().CENTER_OF_SYSTEM)) - 0.5)) + 0.5) * SolGame.views.pixiApp.renderer.height;
		};
		
		p2 = OrbitalMechanics().CENTER_OF_SYSTEM;
		p3 = OrbitalMechanics().CENTER_OF_SYSTEM;
		
		p0 = ((((p0 / (2 * OrbitalMechanics().CENTER_OF_SYSTEM)) - 0.5)) + 0.5) * SolGame.views.pixiApp.renderer.width;
		p1 = ((((p1 / (2 * OrbitalMechanics().CENTER_OF_SYSTEM)) - 0.5)) + 0.5) * SolGame.views.pixiApp.renderer.height;
		p2 = ((((p2 / (2 * OrbitalMechanics().CENTER_OF_SYSTEM)) - 0.5)) + 0.5) * SolGame.views.pixiApp.renderer.width;
		p3 = ((((p3 / (2 * OrbitalMechanics().CENTER_OF_SYSTEM)) - 0.5)) + 0.5) * SolGame.views.pixiApp.renderer.height;
		p4 = ((((p4 / (2 * OrbitalMechanics().CENTER_OF_SYSTEM)) - 0.5)) + 0.5) * SolGame.views.pixiApp.renderer.width;
		p5 = ((((p5 / (2 * OrbitalMechanics().CENTER_OF_SYSTEM)) - 0.5)) + 0.5) * SolGame.views.pixiApp.renderer.height;
		
		if(SolGame.views.flag) {
			SolGame.views.flag = false;
			console.log(p0);
			console.log(p1);
			console.log(p2);
			console.log(p3);
			console.log(p4);
			console.log(p5);
		}
		
		//SolGame.views.route.x = p0;
		//SolGame.views.route.y = p1;
		SolGame.views.route.clear();
		SolGame.views.route.lineStyle(1, 0xFFFFFF, 1);
		SolGame.views.route.moveTo(p0,p1);
		SolGame.views.route.quadraticCurveTo(p2,p3,p4,p5);
		*/
	}
};

},{"../../helpers/OrbitalMechanics":1}]},{},[3]);
