module.exports = function() {
	var module = {};

	module.runTempFunction = function(input, output, callback) {
		output.message = 'ran temp function';
		
		
		
		callback(output);
	};
	
	return module;
};
