const BaseDao = require('../BaseDao');

module.exports = function() {
	var dao = BaseDao();
	
	dao.getData = function(id, callback) {
		SolGame.models.getDefinitionsData(function(defData) {
			callback(defData.stations);
		});
	};
	
	return dao;
};
