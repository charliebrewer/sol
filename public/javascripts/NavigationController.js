SolGame.NavigationController = {
	DESTINATION_TYPE_STATION   : 1, // ID is station ID
	DESTINATION_TYPE_DRIFT     : 2, // ID is 0, not used
	DESTINATION_TYPE_ORBIT     : 3, // ID is celestial_body_id
	DESTINATION_TYPE_INTERCEPT : 4, // ID route ID
	
	LOCATION_TYPE_STATION  : 1,
	LOCATION_TYPE_SHIP     : 2,
	LOCATION_TYPE_SPACE    : 3,
	LOCATION_TYPE_PROPERTY : 4,
	
	MIN_START_DELAY_SC : 30, // Minimum milliseconds in the future that we are allowing for a course to start
	
	plotRoute : function(startTimeSc, plrShipId, destinationType, destinationId) {
		if(startTimeSc < (Date.now() / 1000) + SolGame.NavigationController.MIN_START_DELAY_SC) {
			alert("Route starts too soon");
			return {};
		}
		
		// TODO verify ship information and get the player's ship
		var shipThrust = 1000;
		
		// TODO handle other destination types
		if(SolGame.NavigationController.DESTINATION_TYPE_STATION != destinationType) {
			alert("Only station destinations are currently supported");
			return {};
		}
		
		// Get the player's current position
		var sCrd = SolGame.NavigationController.getCrdFromLocation(
			startTimeSc * 1000,
			SolGame.PlayerData.playerRecord['location_type'],
			SolGame.PlayerData.playerRecord['location_id']
		);
		
		var sPosVec = new SolGame.Shared.Victor(sCrd.pos.x, sCrd.pos.y);
		
		// We are estimating the destination here, first at the start time
		var eCrd = SolGame.NavigationController.getCrdFromLocation(
			startTimeSc * 1000,
			SolGame.NavigationController.DESTINATION_TYPE_STATION,
			destinationId
		);
		
		var distance = (new SolGame.Shared.Victor(sPosVec.x, sPosVec.y)).subtract(new SolGame.Shared.Victor(eCrd.pos.x, eCrd.pos.y)).magnitude();
		var endTimeSc = startTimeSc + (distance / shipThrust);
		
		eCrd = SolGame.NavigationController.getCrdFromLocation(
			endTimeSc * 1000,
			SolGame.NavigationController.DESTINATION_TYPE_STATION,
			destinationId
		);
		
		var routeSegsSml = SolGame.Shared.NavigationMechanics().plotRoute(
			shipThrust,
			sCrd,
			eCrd,
			SolGame.DefinitionsData.celestialBodies
		);
		
		return SolGame.Shared.NavigationMechanics().getRouteLrg(SolGame.Shared.NavigationMechanics().getRouteSml(
			destinationType,
			destinationId,
			plrShipId,
			routeSegsSml
		));
	},
	
	lockInRoute : function(route) {
		SolGame.models.plotRoute(route, function() {});
	},
	
	getCrdFromLocation : function(timeMs, locationType, locationId) {
		if(SolGame.NavigationController.LOCATION_TYPE_STATION != locationType) {
			alert("Can only get locations from stations atm");
			return SolGame.Shared.OrbitalMechanics().getCrd(0,0,0,0,0);
		}
		
		var station = null;
		for(let i = 0; i < SolGame.DefinitionsData.stations.length; i++) {
			if(SolGame.DefinitionsData.stations[i].station_id == locationId) {
				station = SolGame.DefinitionsData.stations[i];
				break;
			}
		}
		if(null == station) {
			alert("Could not find station");
			return SolGame.Shared.OrbitalMechanics().getCrd(0,0,0,0,0);
		}
		
		return SolGame.Shared.OrbitalMechanics().getStationCrd(station, timeMs, SolGame.DefinitionsData.celestialBodies, true);
	}
};
