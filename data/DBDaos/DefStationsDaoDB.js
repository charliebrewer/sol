const PersistentDataAccess = require('../PersistentDataAccess');

const BaseDao = require('../BaseDao');

module.exports = function() {
	var dao = BaseDao();
	
	dao.params = {
		tableName      : 'def_stations',
		keyName        : 'station_id',
		setType        : PersistentDataAccess().SET_TYPE_ALL
	};
	
	dao.getData = function(id, callback) {
		PersistentDataAccess().getData(dao.params, id, callback);
	};
	
	return dao;
};
