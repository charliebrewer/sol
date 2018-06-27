const DataSources = require('./DataSources');

const LocalDao = require('./LocalDao');

module.exports = function() {
	var module = {};
	
	module.sourceType = DataSources.SOURCE_LOCAL;
	
	module.getDao = function(daoType) {
		// We don't care about daoType here, all local daos are the same.
		return LocalDao();
	};
	
	return module;
};
