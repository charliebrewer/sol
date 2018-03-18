var PlayerDAO = require('../models/PlayerDAO');
var PlayerRoutesDAO = require('../models/PlayerRoutesDAO');

var NavigationMechanics = require('../helpers/NavigationMechanics');

module.exports = function() {
	var module = {};
	
	/**
	 * Gives or takes credits from a player.
	 *
	 * @param allowDebt Allow the result of removing credits to cause the player to have a negative balance.
	 *
	 * Calls callback with the amount of credits added / removed from the player's account.
	 */
	module.modifyPlayerCredits = function(plrId, credits, allowDebt, callback) {
		credits = parseInt(credits);
		if(!credits) {
			callback(0);
			return;
		}
		
		PlayerDAO().getPlayer(plrId, function(playerRecord) {
			if(!allowDebt && 0 > credits && 0 > playerRecord['credits'] + credits) {
				callback(0);
				return;
			}
			
			playerRecord['credits'] += credits;
			
			PlayerDAO().updatePlayer(playerRecord, function() {
				callback(credits);
			});
		});
	};
	
	module.syncLocation = function(dataBox, callback) {
		PlayerDAO().getPlayer(dataBox.getPlrId(), function(plrRecord) {
			PlayerRoutesDAO().getPlayerRoutes(dataBox.getPlrId(), function(plrRoutes) {
				var routeSmlArr = [];
				plrRoutes.forEach(function(r) {
					routeSmlArr.push(NavigationMechanics().getRouteSml(
						r['route_id'],
						r['destination_type'],
						r['destination_id'],
						r['plr_ship_id'],
						r['route_data']
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
					
					PlayerDAO().updatePlayer(plrRecord, function() {
						callback();
					});
				} else {
					callback();
				}
			});
		});
	};
	
	return module;
};
