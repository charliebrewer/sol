// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application();

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

var CENTER_OF_SYSTEM = 2147483648;
//var OrbitalMechanics = require('./shared/OrbitalMechanics');
var OrbitalMechanics = function() { // TODO need to use browserify to share code between the client and server
	var module = {};
	
	module.SOL_ID                 = 1; // Special case for the ID of the sun in the db
	module.EARTH_SECONDS_IN_YEAR  = 31540000;
	module.SECONDS_IN_HOUR        = 3600;
	module.CENTER_OF_SYSTEM       = 2147483648;
	module.GRAVITATIONAL_CONSTANT = 1000000000000000; // To be populated with a constant representing mass to seconds to distance in meters.
	module.EARTH_YEAR_PERIOD      = 60 * 5; // In game seconds that the Earth takes to orbit the sun
	module.PI_OVER_180            = 0.01745329251;
	
	/**
	 * Calculate the position of a given body assuming circular orbit.
	 * Returns an array with two values, the first being X and the second being Y.
	 */
	module.getOrbitalPosition = function(parentPosition, distanceFromParent, orbitalPeriodHours, targetTimeMs, thetaOffset) {
		var orbitalPeriodSeconds = (orbitalPeriodHours * module.SECONDS_IN_HOUR) * (module.EARTH_YEAR_PERIOD / module.EARTH_SECONDS_IN_YEAR);
//console.log('orbitalPeriodSeconds ' + orbitalPeriodSeconds);
		var percentYearCompleted = ((targetTimeMs / 1000) % orbitalPeriodSeconds) / orbitalPeriodSeconds;
//console.log('percentYearCompleted ' + percentYearCompleted);
		var theta = ((360 * percentYearCompleted) + thetaOffset ) % 360;
//console.log('theta ' + theta);

		var returnX = Math.round(parentPosition[0] + (Math.cos(theta * module.PI_OVER_180) * distanceFromParent));
		var returnY = Math.round(parentPosition[1] + (Math.sin(theta * module.PI_OVER_180) * distanceFromParent));
//console.log('returning x ' + returnX + ' and y ' + returnY);
		return [returnX, returnY];
	};
	
	/**
	 * Takes an array of celestial bodies and populates each with a position.
	 */
	module.populateOrbitalPositions = function(celestialBodies, targetTimeMs) {
		for(var i = 0; i < celestialBodies.length; i++) {
			celestialBodies[i]['pos'] = undefined;
		}

		for(var i = 0; i < celestialBodies.length; i++) {
			module.populateOrbitalPosition(celestialBodies, i, targetTimeMs);
		}
	};
	
	module.populateOrbitalPosition = function(celestialBodies, i, targetTimeMs) {
		if(undefined != celestialBodies[i]['pos']) { // TODO how will this data structure be stored, and reset so that we can calculate positions again?
			return; // We have already calculated this position
console.log('already have a position');
		}

		if(celestialBodies[i]['celestial_body_id'] == 1) { // TODO make 1 a constant for the sun
			celestialBodies[i]['pos'] = [module.CENTER_OF_SYSTEM, module.CENTER_OF_SYSTEM];

		} else {
			// Look for the parent
			var found = false;
			
			for(var j = 0; j < celestialBodies.length; j++) {
				if(celestialBodies[i]['parent_body_id'] == celestialBodies[j]['celestial_body_id']) {
					// Found the parent

					if(undefined == celestialBodies[j]['pos']) {
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
				console.log('Could not find parent ' + celestialBodies[i]['parent_body_id'] + ' for body ' + celestialBodies[i]['celestial_body_id']);
				celestialBodies[i]['pos'] = [0,0];
			}
		}
	}
	
	return module;
};

function renderData(data, i, objectToMove, screenW, screenH) {
	if(i >= data.length) return;
	var spaceSize = (2 * (CENTER_OF_SYSTEM - 1)) + 1;
	
	/*
		this.pos = [posX, posY];
		this.mov = [movX, movY];
		this.t = timestamp;
		*/
		
	var currentTime = Date.now();
	
	objectToMove.x = (screenW * (data[i].pos[0] / spaceSize));
	objectToMove.y = (screenH * (data[i].pos[1] / spaceSize));
	console.log("moved ship to " + objectToMove.x + "," + objectToMove.y);
	
	// Need to find time until the next instance, and then make a callback
	if(i + 1 < data.length) {
		var timeframe = 1000 * (data[i + 1].t - data[i].t);
//console.log(timeframe);
		setTimeout(function() {
			renderData(data, i + 1, objectToMove, screenW, screenH);
		}, timeframe);
	}
};

function getCelestialBodyName(celestialBodyRecord) {
	return "celestialBody_" + celestialBodyRecord["name"];
}

var celestialBodies = [];

// Load def data from server
$.post("runCommand", {"req" : JSON.stringify({"command" : 100, "data" : {}})}, function( output ) {
	console.log("requested runCommand and received the following");
	console.log(output);
	//function renderData(data, i, objectToMove, screenW, screenH) {
	//renderData(data, 0, ship, app.renderer.width, app.renderer.height);
	
	celestialBodies = output.data.celestialBodies;
	
	for(var i = 0; i < celestialBodies.length; i++) {
		PIXI.loader.add(getCelestialBodyName(celestialBodies[i]), celestialBodies[i]['img_url']);
	}
	
	PIXI.loader.load((loader, resources) => {
		for(var i = 0; i < celestialBodies.length; i++) {
			var sprite = new PIXI.Sprite(resources[getCelestialBodyName(celestialBodies[i])].texture);

			sprite.scale.x = 0.1;
			sprite.scale.y = 0.1;
			
			app.stage.addChild(sprite);

			celestialBodies[i].sprite = sprite;
		}
	});
});

var waitPeriodSeconds = 10;
var waitPeriodHolder = 0;
var zoom = 10;

app.ticker.add(function(delta) {
	
	if(waitPeriodHolder < waitPeriodSeconds) {
		waitPeriodHolder += delta;
	} else {

		var currentTime = Math.round(Date.now());
		OrbitalMechanics().populateOrbitalPositions(celestialBodies, currentTime);

		var tempZoom = zoom / 10;
		for(var i = 0; i < celestialBodies.length; i++) {
			celestialBodies[i].sprite.x = ((tempZoom * ((celestialBodies[i]['pos'][0] / (2 * CENTER_OF_SYSTEM)) - 0.5)) + 0.5) * app.renderer.width;
			celestialBodies[i].sprite.y = ((tempZoom * ((celestialBodies[i]['pos'][1] / (2 * CENTER_OF_SYSTEM)) - 0.5)) + 0.5) * app.renderer.height;
		}
	}
});

document.addEventListener("mousewheel", function(e) {
	var dir = Math.round(e.wheelDelta / Math.abs(e.wheelDelta)); // Set the dir value to 1 or -1
	
	zoom = Math.max(10, zoom + dir);
}, false);
/*
// load the texture we need
PIXI.loader.add('sun', 'images/sun.gif').add('ship', 'images/ship.gif').load((loader, resources) => {
    // This creates a texture from a 'sun.png' image
    const sun = new PIXI.Sprite(resources.sun.texture);
	
	sun.scale.x = 0.2;
	sun.scale.y = 0.2;

    // Setup the position of the sun
    sun.x = app.renderer.width / 2;
    sun.y = app.renderer.height / 2;

    // Rotate around the center
    sun.anchor.x = 0.5;
    sun.anchor.y = 0.5;

    // Add the sun to the scene we are building
    app.stage.addChild(sun);

    // Listen for frame updates
    app.ticker.add(() => {
         // each frame we spin the sun around a bit
        sun.rotation += 0.01;
    });
	
	// This creates a texture from a 'ship.png' image
    const ship = new PIXI.Sprite(resources.ship.texture);
	
	ship.scale.x = 0.2;
	ship.scale.y = 0.2;

    // Setup the position of the ship
    ship.x = app.renderer.width / 4;
    ship.y = app.renderer.height / 2;

    // Rotate around the center
    ship.anchor.x = 0.5;
    ship.anchor.y = 0.5;

    // Add the ship to the scene we are building
    app.stage.addChild(ship);
	/*
	var postData = JSON.stringify({"command" : 10, "data" : {}});

	$.post("runCommand", {"req" : postData}, function( data ) {
		console.log("requested runCommand and received the following");
		console.log(data);
		//function renderData(data, i, objectToMove, screenW, screenH) {
		//renderData(data, 0, ship, app.renderer.width, app.renderer.height);
		
		
//		ship.y = app.renderer.height / 4;
	});
	*/
//});

/*
PIXI.loader.add('ship', 'images/ship.gif').load((loader, resources) => {
    // This creates a texture from a 'ship.png' image
    const ship = new PIXI.Sprite(resources.ship.texture);
	
	//ship.scale.x = 0.2;
	//ship.scale.y = 0.2;

    // Setup the position of the ship
    ship.x = app.renderer.width / 2;
    ship.y = app.renderer.height / 2;

    // Rotate around the center
    ship.anchor.x = 0.5;
    ship.anchor.y = 0.5;

    // Add the ship to the scene we are building
    app.stage.addChild(ship);

    // Listen for frame updates
    app.ticker.add(() => {
         // each frame we spin the ship around a bit
        //ship.rotation += 0.01;
    });
});
*/
