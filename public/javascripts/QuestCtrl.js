SolGame.QuestCtrl = {
	generatedQuests : [],
	
	generateQuests : function(callback) {
		SolGame.QuestCtrl.generatedQuests = [];
		
		SolGame.models.getQuests(function(defQuests) {
			defQuests.forEach(function(defQuest) {
				SolGame.QuestCtrl.generatedQuests.push(SolGame.Shared.QuestMechanics().generateQuestInstance(defQuest, SolGame.DefinitionsData.defCommodities));
			});
			
			callback(SolGame.QuestCtrl.generatedQuests);
		});
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
