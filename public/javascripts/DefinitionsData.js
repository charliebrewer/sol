SolGame.DefinitionsData = {
	celestialBodies : [],
	stations : [],
	// etc
	
	updateDefinitionsData : function(callback) {
		SolGame.models.getDefinitionsData(function(definitionsData) {
			SolGame.DefinitionsData.celestialBodies = definitionsData.celestialBodies;
			callback();
		});
	}
};
