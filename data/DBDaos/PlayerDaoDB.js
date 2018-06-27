const PersistentDataAccess = require('../PersistentDataAccess');

const BaseDao = require('../BaseDao');

module.exports = function() {
	var dao = BaseDao();
	
	dao.params = {
		tableName      : 'plr_players',
		keyName        : 'plr_id',
		setType        : PersistentDataAccess().SET_TYPE_ONE
	};
	
	dao.getData = function(id, callback) {
		PersistentDataAccess().getData(dao.params, id, callback);
	};
	
	dao.setData = function(id, data, callback) {
		PersistentDataAccess().setData(dao.params, data, callback);
	};
	
	return dao;
};
