var PersistentDataAccess = require('./PersistentDataAccess');

/*
CelestialBody = function(celestialBodyId, name, mass, radius, imgUrl, parentBodyId, distanceFromParent, flags) {
	this.celestialBodyId = celestialBodyId;
	this.name = name;
	this.mass = mass;
	this.radius = radius;
	this.imgUrl = imgUrl;
	this.parentBodyId = parentBodyId;
	this.distanceFromParent = distanceFromParent;
	this.flags = flags;
};
*/
module.exports = function() {
	var module = {};
	
	module.getBodies = function(callback) {
		PersistentDataAccess().query('SELECT * FROM cfg_celestial_bodies WHERE 0 = (flags & 1)', function (err, rows, fields) {
			if(err) throw err;
			
			// TODO change distance units to km
	/*
			var celestialBodies = [];
			
			for(i = 0; i < rows.length; i++) {
				celestialBodies[i] = new CelestialBody(
					rows[i]['celestial_body_id'],
					rows[i]['name'],
					rows[i]['mass'],
					rows[i]['radius'],
					rows[i]['img_url'],
					rows[i]['parent_body_id'],
					rows[i]['distance_from_parent'],
					rows[i]['flags']
				);
			}
	*/
			callback(rows);
		});
	};
	
	return module;
}
