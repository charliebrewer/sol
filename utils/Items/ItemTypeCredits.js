const PlayerDAO = require('../../models/PlayerDAO');

const PlayerUtil = require('../PlayerUtil');

const BucketMechanics = require('../../helpers/BucketMechanics');

module.exports = function() {
	var module = {};
	
	module.decorate = function(item) {
		item.name = 'Credits';
		
		item.give = function(dataBox, plrId, callback) {
			PlayerUtil().modifyPlayerCredits(dataBox, item.quantity, true, function(creditDelta) {
				var itemsGiven = BucketMechanics().createEmptyBucket();
				
				itemsGiven.modifyContents(BucketMechanics().ITEM_TYPE_CREDITS, 0, creditDelta);
				
				callback(itemsGiven);
			});
		};
		
		item.take = function(dataBox, plrId, callback) {
			PlayerUtil().modifyPlayerCredits(dataBox, -1 * item.quantity, true, function(creditDelta) {
				var itemsGiven = BucketMechanics().createEmptyBucket();
				
				itemsGiven.modifyContents(BucketMechanics().ITEM_TYPE_CREDITS, 0, Math.abs(creditDelta));
				
				callback(itemsGiven);
			});
		};
		
		item.getNum = function(dataBox, plrId, callback) {
			PlayerDAO().getPlayer(dataBox, plrId, function(playerRecord) {
				callback(playerRecord['credits']);
			});
		};
		
		item.canGive = function(dataBox, plrId, callback) {};
		
		item.canTake = function(dataBox, plrId, callback) {};
	};
	
	return module;
};