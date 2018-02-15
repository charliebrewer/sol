SolGame.PlayerData = {
	plrId : 0,
	
	updatePlayerData : function(callback) {
		SolGame.models.getPlayerData(function(playerData) {
			//this.items = items etc
			callback();
		});
	}
};
