SolGame.app = {
	init : function(callback) {
		// Start pixi and load assets
		SolGame.views.init();
		
		// Load data from server
		SolGame.DefinitionsData.updateDefinitionsData(function() {
			// Load player data
			SolGame.PlayerData.updatePlayerData(function() {
				callback();
			});
		});
	},
	
	start : function(callback) {
		// Load navigation screen and connect ticker to renderer
		SolGame.views.renderNavigationView();
	}
};
