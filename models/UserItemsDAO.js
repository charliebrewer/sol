var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.getPlayerItems = function(plrId, callback) {
		PersistentDataAccess().query('SELECT * FROM usr_items WHERE plr_id = ' + plrId, function (err, rows, fields) {
			if(err) throw err;
			
			callback(rows);
		});
	};
	
	return module;
};
