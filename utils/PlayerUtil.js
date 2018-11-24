var PlayerDAO = require('../models/PlayerDAO');
var PlayerRoutesDAO = require('../models/PlayerRoutesDAO');

var NavigationMechanics = require('../helpers/NavigationMechanics');

const DataSources = require('../data/DataSources');

module.exports = function() {
	var module = {};
	
	/**
	 * Gives or takes credits from a player.
	 *
	 * @param allowDebt Allow the result of removing credits to cause the player to have a negative balance.
	 *
	 * Calls callback with the amount of credits added / removed from the player's account.
	 */
	module.modifyPlayerCredits = function(dataBox, credits, allowDebt, callback) {
		credits = parseInt(credits);
		if(!credits) {
			callback(0);
			return;
		}
		
		PlayerDAO().modifyCredits(dataBox, credits, callback);
	};
	
	/**
	 * Returns the player's location. Currently this is just the information in
	 * the player record, but we're piping this through a function because that
	 * may change later.
	 *
	 * Calls callback with locationType and locationId as parameters.
	 */
	module.getPlayerLocation = function(dataBox, plrId, timeMs, callback) {
		PlayerDAO().getPlayer(dataBox, plrId, function(plrRecord) {
			callback(plrRecord['location_type'], plrRecord['location_id']);
		});
	};
	
	module.syncLocation = function(dataBox, callback) {
		PlayerDAO().getPlayer(dataBox, dataBox.getPlrId(), function(plrRecord) {
			PlayerRoutesDAO().getPlayerRoutes(dataBox, dataBox.getPlrId(), function(plrRoutes) {
				var routeSmlArr = [];
				plrRoutes.forEach(function(r) {
					routeSmlArr.push(NavigationMechanics().getRouteSml(
						r['route_id'],
						r['destination_type'],
						r['destination_id'],
						r['plr_ship_id'],
						JSON.parse(r['route_data'])
					));
				});
				
				var plrLocation = NavigationMechanics().getLocationAtTime(
					plrRecord['location_type'],
					plrRecord['location_id'],
					dataBox.getTimeMs(),
					routeSmlArr
				);
				
				if(plrLocation.locationType != plrRecord['location_type'] || plrLocation.locationId != plrRecord['location_id']) {
					plrRecord['location_type'] = plrLocation.locationType;
					plrRecord['location_id']   = plrLocation.locationId;
					
					PlayerDAO().updatePlayer(dataBox, plrRecord, function() {
						callback();
					});
				} else {
					callback();
				}
			});
		});
	};
	
	/*
	Gets all information about a player
	their location info, their criminal status, their money etc
	if they're on a ship, the info about the ship they're on and the route they're on
	*/
	module.getPlayerInfo = function(dataBox, callback) {
		//
	};
	
	module.getPlayerState = function(dataBox, plrId, callback) {
		dataBox.getData(DataSources.DAO_PLAYER, plrId, function(plrData) {
		dataBox.getData(DataSources.DAO_PLAYER, plrId, function(plrData) {
		dataBox.getData(DataSources.DAO_PLAYER, plrId, function(plrData) {
			callback({
				locType: plrData.loc_type,
				locId: plrData.loc_id,
			});
		}); }); });
	};
	
	return module;
};
