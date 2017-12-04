var CelestialBodiesDAO = require('../models/CelestialBodiesDAO');

var OrbitalMechanics = require('../helpers/OrbitalMechanics');

module.exports = function() {
	var module = {};
	
	module.DESTINATION_TYPE_STATION   = 1;
	module.DESTINATION_TYPE_ORBIT     = 2;
	module.DESTINATION_TYPE_INTERCEPT = 3;
	
	/**
	 * Method that validates a course.
	 */
	module.plotCourse = function(input, output, callback) {
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
			destinationType = module.DESTINATION_TYPE_STATION,
			destinationId   = 1, // Arbitrary station ID
			shipId          = 1,
			course = [
				new OrbitalMechanics().coordinate(0, 0, 0, 0, 0),
				new OrbitalMechanics().coordinate(0, 0, 0, 0, 0),
				new OrbitalMechanics().coordinate(0, 0, 0, 0, 0),
				new OrbitalMechanics().coordinate(0, 0, 0, 0, 0)
			]
		};
		
		PlayerController().getAllPlayerData(input, {}, function(playerData) {
			
		});

		callback(output);
	};
	
	module.plotOrbit = function(input, output, callback) {
		// TODO this will share functionality with plotCourse as the ship will need to navigate to the circular orbit
		callback(output);
	};
	
	module.plotDrift = function(input, output, callback) {
		/*
		update the player's ship route to drifting through space
		*/
		callback(output);
	};
	
	return module;
};
