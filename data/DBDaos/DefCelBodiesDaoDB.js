const PersistentDataAccess = require('../PersistentDataAccess');

const BaseDao = require('../BaseDao');

module.exports = function() {
	var dao = BaseDao();
	
	dao.params = {
		tableName      : 'def_celestial_bodies',
		keyName        : 'celestial_body_id',
		setType        : PersistentDataAccess().SET_TYPE_ALL
	};
	
	dao.getData = function(id, callback) {
		PersistentDataAccess().getData(dao.params, 0, callback);
	};
	
	return dao;
};
