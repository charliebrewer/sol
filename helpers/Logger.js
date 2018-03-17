module.exports = function() {
	var module = {};
	
	module.NONE     = 0;
	module.NORMAL   = 1;
	module.DEBUG    = 2;
	module.VERBOSE  = 4;
	module.DATABASE = 8;
	
	module.logLevel = module.NONE;
	module.logLevel = module.logLevel | module.NORMAL;
	//module.logLevel = module.logLevel | module.DEBUG;
	//module.logLevel = module.logLevel | module.VERBOSE;
	module.logLevel = module.logLevel | module.DATABASE;
	
	module.log = function(logLevel, logStr) {
		if(0 != (module.logLevel & logLevel))
			console.log(logStr);
	};
	
	return module;
};
