SolGame.DefinitionsData = {
	celestialBodies : [],
	stations : [],
	defQuests : [],
	defShopsAtStation : {},
	
	updateDefinitionsData : function(callback) {
		SolGame.models.getDefinitionsData(function(definitionsData) {
			SolGame.DefinitionsData.celestialBodies = definitionsData.celestialBodies;
			SolGame.DefinitionsData.stations = definitionsData.stations;
			SolGame.DefinitionsData.defCommodities = definitionsData.defCommodities;
			SolGame.DefinitionsData.defQuests = definitionsData.defQuests;
			callback();
		});
	},
	
	getShopsAtStation : function(sId, callback) {
		if(undefined != SolGame.DefinitionsData.defShopsAtStation[sId]) {
			callback(SolGame.DefinitionsData.defShopsAtStation[sId]);
			return;
		}
		
		SolGame.models.getShopsAtStation(sId, function(shopsAtStation) {
			SolGame.DefinitionsData.defShopsAtStation[sId] = shopsAtStation;
			callback(shopsAtStation);
		});
	}
};
