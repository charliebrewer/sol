SolGame.QuestCtrl = {
	generatedQuests : [],
	
	generateQuests : function(stationId) {
		SolGame.QuestCtrl.generatedQuests = [];
		
		SolGame.DefinitionsData.defQuests.forEach(function(defQuest) {
			if(defQuest['station_id'] == stationId)
				SolGame.QuestCtrl.generatedQuests.push(SolGame.Shared.QuestMechanics().generateQuestInstance(defQuest, SolGame.DefinitionsData.defCommodities));
		});
		
		return SolGame.QuestCtrl.generatedQuests;
	},
	
	acceptGeneratedQuest : function(index, callback) {
		if(undefined == SolGame.QuestCtrl.generatedQuests[index]) {
			console.log('attempting to accept bad index');
			callback();
			return;
		}
		
		var quest = SolGame.QuestCtrl.generatedQuests[index];
		
		SolGame.models.acceptQuest({'defQuestId' : quest.defQuestId, 'questInstance' : quest}, callback);
	}
};
