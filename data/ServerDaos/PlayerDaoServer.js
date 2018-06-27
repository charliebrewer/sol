const BaseDao = require('../BaseDao');

module.exports = function() {
	var dao = BaseDao();
	
	dao.getData = function(id, callback) {
		SolGame.models.getPlayerData(function(playerData) {
			callback(playerData.playerRecord);
		});
	};
	
	return dao;
};
