const PlayerShipsDAO = require('../../models/PlayerShipsDAO');

const ShipUtil = require('../ShipUtil');

const BucketMechanics = require('../../helpers/BucketMechanics');

module.exports = function() {
	var module = {};
	
	module.decorate = function(item) {
		item.name = "Commodity";
		
		item.give = function(dataBox, plrId, callback, give = true) {
			var bucketToAdd = BucketMechanics().createEmptyBucket();
			bucketToAdd.setAllowNegatives(true);
			
			var c = give ? 1 : -1;
			
			bucketToAdd.modifyContents(item.itemType, item.itemId, c * item.quantity);
			
			ShipUtil().modifyActiveShipCargo(dataBox, bucketToAdd, function(success) {
				if(success)
					callback(bucketToAdd);
				else
					callback(BucketMechanics().createEmptyBucket());
			});
		};
		
		item.take = function(dataBox, plrId, callback) {
			item.give(dataBox, plrId, callback, false);
		};
		
		item.getNum = function(dataBox, plrId, callback) {
			PlayerShipsDAO().getPlayerShips(dataBox, function(plrShips) {
				var activeShip = plrShips.find(e => 1 == e['is_active']);
				
				if(undefined == activeShip) {
					callback(0);
					return;
				}
				
				var shipCargo = BucketMechanics().createBucketFromString(activeShip['cargo']);
				callback(shipCargo.getItemQuantity(item.itemType, item.itemId));
			});
		};
		
		item.canGive = function(dataBox, plrId, callback) {throw "todo";};
		
		item.canTake = function(dataBox, plrId, callback) {throw "todo";};
	};
	
	return module;
};