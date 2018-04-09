const DefQuestsDAO = require('../models/DefQuestsDAO');
const PlayerQuestsDAO = require('../models/PlayerQuestsDAO');

const PlayerUtil = require('./PlayerUtil');

const NavigationMechanics = require('../helpers/NavigationMechanics');
const QuestMechanics = require('../helpers/QuestMechanics');

module.exports = function() {
	module = {};
	
	module.getDailyCompletedValue = function(dataBox, plrId, callback) {
		PlayerQuestsDAO().getPlayerQuests(dataBox, function(plrQuests) {
			var sum = 0;
			var lastDaySc = Math.round(dataBox.getTimeMs() / 1000) - 86400;
			
			plrQuests.forEach(function(plrQuest) {
				if(lastDaySc < plrQuest['completed_time_sc'])
					sum += plrQuest['quest_value'];
			});
			
			callback(sum);
		});
	};
	
	/**
	 * Filters def_quests to only those that the player could possibly accept.
	 * This does not validate things like cargo space.
	 */
	module.getQuestsAvailableToPlr = function(dataBox, callback) {
		var quests = [];
		
		PlayerUtil().getPlayerLocation(dataBox, dataBox.getPlrId(), dataBox.getTimeMs(), function(locationType, locationId) {
			if(NavigationMechanics().LOCATION_TYPE_STATION != locationType) {
				callback(quests);
				return;
			}
			
			PlayerQuestsDAO().getPlayerQuests(dataBox, function(plrQuests) {
				if(undefined != plrQuests.find(e => 0 == e['completed_time_sc'])) {
					callback(quests);
					return;
				}
				
				var plrQuestValueSum = QuestMechanics().getPlrQuestValueSum(dataBox.getTimeMs(), plrQuests);
				var plrCmpltPct      = QuestMechanics().getPlrCmpltPct(dataBox.getTimeMs(), plrQuests);
				
				DefQuestsDAO().getQuests(dataBox, function(defQuests) {
					var originStationIds;
					
					defQuests.forEach(function(defQuest) {
						originStationIds = defQuest['origin_station_ids'].split(',');
						if(undefined == originStationIds.find(e => 0 == e || e == locationId))
							return;
						
						if(defQuest['min_quest_value_sum'] > plrQuestValueSum)
							return;
						if(defQuest['max_quest_value_sum'] <= plrQuestValueSum)
							return;
						if((defQuest['min_cmplt_pct_1000'] / 1000) > plrCmpltPct)
							return;
						if((defQuest['max_cmplt_pct_1000'] / 1000) < plrCmpltPct)
							return;
						
						quests.push(defQuest);
					});
					
					callback(quests);
				});
			});
		});
	};
	
	return module;
};
