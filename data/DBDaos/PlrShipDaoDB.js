const PersistentDataAccess = require('../PersistentDataAccess');

const BaseDao = require('../BaseDao');

module.exports = function() {
	var dao = BaseDao();
	
	dao.params = {
		tableName      : 'plr_ships',
		keyName        : 'plr_ship_id',
		setType        : PersistentDataAccess().SET_TYPE_ONE
	};
	
	dao.getData = function(id, callback) {
		PersistentDataAccess().getData(dao.params, id, callback);
	};
	
	return dao;
};
