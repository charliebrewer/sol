module.exports = function() {
	var module = {};
	
	module.getData = function(id, callback) {
		callback(null);
	};
	
	module.setData = function(id, data, callback) {
		callback(false);
	};
	
	module.addData = function(id, data, callback) {
		callback(false);
	};
	
	module.delData = function(id, callback) {
		callback(false);
	};
	
	return module;
};
