var OrbitalMechanics = require('../../helpers/OrbitalMechanics');

SolGame.views = {
	pixiApp : null,
	
	// TODO move this to navigation class or something
	route : null,
	
	init : function() {
		SolGame.views.pixiApp = new PIXI.Application();
		document.body.appendChild(SolGame.views.pixiApp.view);
		
		// TODO remove
		SolGame.views.route = new PIXI.Graphics();
		//SolGame.views.route.lineColor = 0x5cafe2;
		SolGame.views.route.lineStyle(1, 0xFFFFFF, 1);
		SolGame.views.pixiApp.stage.addChild(SolGame.views.route);
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
	
	renderNavigationView : function() {
		// Make sure planets are loaded
		SolGame.views.loadResources(SolGame.DefinitionsData.celestialBodies, function() {
			SolGame.views.pixiApp.ticker.add(SolGame.views.updateNavigationView);
		});
		// get routes
		// get the player's location (en route / docked)
		// add ticker to update data
	},
	
	flag : true,
	
	// This function will be passed to a ticker once assets are loaded to update the position of the planets as desired
	updateNavigationView : function(delta) {
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
	}
};
