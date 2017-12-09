var PersistentDataAccess = require('./PersistentDataAccess');

module.exports = function() {
	var module = {};
	
	module.tableName = 'cfg_celestial_bodies'; // TODO change to def_...
	module.keyName   = 'celestial_body_id';
	module.fields    = ['celestial_body_id', 'name', 'mass', 'radius', 'img_url', 'parent_body_id', 'distance_from_parent', 'orbital_period_hours', 'flags'];
	
	module.getBodies = function(callback) {
		PersistentDataAccess().selectAll(module.tableName, callback);
	};
	
	return module;
}
