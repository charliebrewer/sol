SolGame.app = {
	init : function(callback) {
		SolGame.models.init();
		
		// Start pixi and load assets
		SolGame.views.init();
		
		// Load data from server
		SolGame.DefinitionsData.updateDefinitionsData(function() {
			// Load player data
			SolGame.PlayerData.updatePlayerData(function() {
				var db = SolGame.Shared.DataBox().getDataBoxClientStandard();
				
				SolGame.Shared.MapData.buildSystemMap(db, function(systemMap) {
					SolGame.MapViewer.systemMap = systemMap;
					SolGame.MapViewer.setTarget(SolGame.Shared.MapData.MAPOBJ_CELBODY, SolGame.Shared.MapData.SOL_ID);
					
					SolGame.MapViewer.loadResources(function() {
						SolGame.views.pixiApp.ticker.add(SolGame.MapViewer.draw);
					});
				});
			});
		});
	},
	
	start : function(callback) {
		// Load navigation screen and connect ticker to renderer
		//SolGame.views.renderNavigationView();
	}
};
