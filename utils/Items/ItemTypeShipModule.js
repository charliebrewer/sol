const PlayerShipsDAO = require('../../models/PlayerShipsDAO');

const BucketMechanics = require('../../helpers/BucketMechanics');

module.exports = function() {
	var module = {};
	
	module.decorate = function(item) {
		item.name = "Module";
		
		item.give = function(dataBox, plrId, callback) {
			throw "Attempting to give a module via ItemUtil";
		};
		
		item.take = function(dataBox, plrId, callback) {
			throw "Attempting to take a module via ItemUtil";
		};
		
		item.getNum = function(dataBox, plrId, callback) {
			// Get player's ships, and their active ship cargo
			var sum = 0;
			var cargoBucket;
			
			PlayerShipsDAO().getPlayerShips(dataBox, function(plrShips) {
				plrShips.forEach(function(plrShip) {
					cargoBucket = BucketMechanics().createBucketFromString(plrShip['cargo']);
					sum += cargoBucket.getItemQuantity(item.itemType, item.itemId);
					
					plrShip['loadout'].split(',').forEach(function(moduleId) {
						if(moduleId == item.itemId)
							sum++;
					});
				});
				
				callback(sum);
			});
		};
		
		item.canGive = function(dataBox, plrId, callback) {callback(false);};
		
		item.canTake = function(dataBox, plrId, callback) {callback(false);};
	};
	
	return module;
};