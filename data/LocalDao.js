const BaseDao = require('./BaseDao');

module.exports = function() {
	var dao = BaseDao();
	
	var _data = {};
	
	dao.getData = function(id, callback) {
		if(undefined != _data[id]) {
			callback(_data[id]);
			return;
		}
		
		callback(null);
	};
	
	dao.setData = function(id, data, callback) {
		_data[id] = data;
		
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
		if(undefined == _data[id])
			callback(false);
		else {
			delete _data[id];
			
			callback(true);
		}
	};
	
	return dao;
};
