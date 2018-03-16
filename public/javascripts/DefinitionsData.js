SolGame.DefinitionsData = {
	celestialBodies : [],
	stations : [],
	defQuests : [],
	
	updateDefinitionsData : function(callback) {
		SolGame.models.getDefinitionsData(function(definitionsData) {
			SolGame.DefinitionsData.celestialBodies = definitionsData.celestialBodies;
			SolGame.DefinitionsData.stations = definitionsData.stations;
			SolGame.DefinitionsData.defQuests = definitionsData.defQuests;
			callback();
		});
	}
};
