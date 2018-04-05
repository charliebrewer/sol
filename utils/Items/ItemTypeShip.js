const PlayerShipsDAO = require('../../models/PlayerShipsDAO');

const ShipUtil = require('../ShipUtil');

const BucketMechanics = require('../../helpers/BucketMechanics');

module.exports = function() {
	var module = {};
	
	module.decorate = function(item) {
		item.name = "Ship";
		
		if(1 != item.quantity)
			throw "Creating ship item without a quantity of 1";
		
		item.give = function(dataBox, plrId, callback) {
			ShipUtil().modifyPlayerShips(dataBox, item.itemId, 1, function(res) {
				var itemsGiven = BucketMechanics().createEmptyBucket();
				
				if(res)
					itemsGiven.modifyContents(BucketMechanics().ITEM_TYPE_SHIP, item.itemId, 1);
				
				callback(itemsGiven);
			});
		};
		
		item.take = function(dataBox, plrId, callback) {
			ShipUtil().modifyPlayerShips(dataBox, item.itemId, -1, function(res) {
				var itemsGiven = BucketMechanics().createEmptyBucket();
				
				if(res)
					itemsGiven.modifyContents(BucketMechanics().ITEM_TYPE_SHIP, item.itemId, 1);
				
				callback(itemsGiven);
			});
		};
		
		item.getNum = function(dataBox, plrId, callback) {
			PlayerShipsDAO().getPlayerShips(dataBox, function(plrShips) {
				var ship = plrShips.find(e => e['def_ship_id'] == item.itemId && 0 == (e['flags'] & PlayerShipsDAO().FLAG_SOLD));
				if(undefined == ship)
					callback(0);
				else
					callback(1);
			});
		};
		
		item.canGive = function(dataBox, plrId, callback) {throw "todo";};
		
		item.canTake = function(dataBox, plrId, callback) {throw "todo";};
	};
	
	return module;
};