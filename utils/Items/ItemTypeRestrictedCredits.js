const PlayerDAO = require('../../models/PlayerDAO');

const BucketMechanics = require('../../helpers/BucketMechanics');

module.exports = function() {
	var module = {};
	
	module.decorate = function(item) {
		item.name = 'Restricted Credits';
		
		item.give = function(dataBox, plrId, callback) {
			PlayerDAO().giveRestrictedCredits(dataBox, plrId, item.quantity, function(res) {
				var bucket = BucketMechanics().createEmptyBucket();
				bucket.modifyContents(BucketMechanics().ITEM_TYPE_R_CREDITS, 0, item.quantity);
				
				callback(bucket);
			});
		};
		
		item.take = function(dataBox, plrId, callback) {
			throw "Trying to take restricted credits";
		};
		
		item.getNum = function(dataBox, plrId, callback) {
			PlayerDAO().getPlayer(dataBox, plrId, function(plrRecord) {
				callback(plrRecord['r_credits'] + plrRecord['rr_credits']);
			});
		};
		
		item.canGive = function(dataBox, plrId, callback) {callback(true);};
		item.canTake = function(dataBox, plrId, callback) {callback(false);};
	};
	
	return module;
};