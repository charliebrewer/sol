SolGame.PlayerData = {
	plrId : 0,
	
	playerRecord : {},
	playerRoutes : [],
	
	updatePlayerData : function(callback) {
		SolGame.models.getPlayerData(function(playerData) {
			SolGame.PlayerData.playerRecord = playerData.playerRecord;
			SolGame.PlayerData.playerRoutes = playerData.playerRoutes;
			SolGame.PlayerData.playerQuests = playerData.playerQuests;
			callback();
		});
	}
};
