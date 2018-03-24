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
	module.modifyPlayerCredits = function(dataBox, credits, allowDebt, callback) {
		credits = parseInt(credits);
		if(!credits) {
			callback(0);
			return;
		}
		
		PlayerDAO().modifyCredits(dataBox, credits, callback);
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
					
					PlayerDAO().updatePlayer(dataBox, plrRecord, function() {
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
