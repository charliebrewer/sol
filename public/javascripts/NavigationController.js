SolGame.NavigationController = {
	DESTINATION_TYPE_UNKNOWN : 0,
	DESTINATION_TYPE_STATION   : 1, // ID is station ID
	DESTINATION_TYPE_ROUTE : 4, // ID route ID
	DESTINATION_TYPE_ORBIT     : 3, // ID is celestial_body_id
	
	LOCATION_TYPE_STATION  : 1,
	LOCATION_TYPE_ROUTE    : 2,
	
	MIN_START_DELAY_MS : 5000, // Minimum seconds in the future that we are allowing for a course to start
	
	plotRoute : function(startTimeMs, plrShipId, destinationType, destinationId) {
		startTimeMs = Math.round(startTimeMs / 1000) * 1000;
		if(startTimeMs < Date.now() + SolGame.NavigationController.MIN_START_DELAY_MS) {
			alert("Route starts too soon");
			return {};
		}
		
		// TODO verify ship information and get the player's ship
		var shipThrust = 100;
		
		// TODO handle other destination types
		if(SolGame.NavigationController.DESTINATION_TYPE_STATION != destinationType) {
			alert("Only station destinations are currently supported");
			return {};
		}
		
		var locationInfo = SolGame.Shared.NavigationMechanics().getLocationAtTime(
			SolGame.PlayerData.playerRecord['location_type'],
			SolGame.PlayerData.playerRecord['location_id'],
			startTimeMs,
			SolGame.PlayerData.playerRoutes
		);
		
		// Get the player's current position
		var sCrd = SolGame.NavigationController.getCrdFromLocation(
			startTimeMs,
			locationInfo.locationType,
			locationInfo.locationId
		);
		
		var sPosVec = new SolGame.Shared.Victor(sCrd.pos.x, sCrd.pos.y);
		
		// We are estimating the destination here, first at the start time
		var eCrd = SolGame.NavigationController.getCrdFromLocation(
			startTimeMs,
			SolGame.NavigationController.DESTINATION_TYPE_STATION,
			destinationId
		);
		
		var distance = (new SolGame.Shared.Victor(sPosVec.x, sPosVec.y)).subtract(new SolGame.Shared.Victor(eCrd.pos.x, eCrd.pos.y)).magnitude();
		var endTimeMs = Math.round(startTimeMs + (1000 * (distance / shipThrust))); // Temp 1000 since converting from sc to ms and ships being unimplemented
		
		eCrd = SolGame.NavigationController.getCrdFromLocation(
			endTimeMs,
			SolGame.NavigationController.DESTINATION_TYPE_STATION,
			destinationId
		);
		
		var routeSegsSml = SolGame.Shared.NavigationMechanics().plotRoute(
			shipThrust,
			sCrd,
			eCrd,
			SolGame.DefinitionsData.celestialBodies
		);
		
		return SolGame.Shared.NavigationMechanics().getRouteSml(
			0, // We don't care about route ID since that will be handled by the server
			destinationType,
			destinationId,
			plrShipId,
			routeSegsSml
		);
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
