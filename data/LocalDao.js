const BaseDao = require('./BaseDao');

module.exports = function() {
	var dao = BaseDao();
	
	dao.data = {};
	
	dao.getData = function(id, callback) {
		if(undefined != dao.data[id]) {
			callback(dao.data[id]);
			return;
		}
		
		callback(null);
	};
	
	dao.setData = function(id, data, callback) {
		dao.data[id] = data;
		
		callback(true);
	};
	
	dao.addData = function(id, data, callback) {
		dao.getData(id, function(output) {
			if(null != output)
				callback(false);
			else {
				dao.setData(id, data, callback);
			}
		});
	};
	
	dao.delData = function(id, callback) {
		if(undefined == dao.data[id])
			callback(false);
		else {
			delete dao.data[id];
			
			callback(true);
		}
	};
	
	return dao;
};
