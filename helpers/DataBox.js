module.exports = function() {
	var module = {};
	
	module.getBox = function(plrId, timeMs) {
		var dataBox = {};
		
		dataBox.plrId = parseInt(plrId);
		dataBox.timeMs = parseInt(timeMs);
		
		dataBox.data = {};
		
		dataBox.getPlrId = function() {
			return dataBox.plrId;
		};
		
		dataBox.getTimeMs = function() {
			return dataBox.timeMs;
		};
		
		dataBox.getData = function(tag) {
			return dataBox.data[tag];
		};
		
		dataBox.setData = function(tag, data) {
			dataBox.data[tag] = data;
		};
		
		dataBox.hasData = function(tag) {
			return undefined != dataBox.getData(tag);
		};
		
		dataBox.clrData = function(tag) {
			delete dataBox.data[tag];
		};
		
		dataBox.flush = function() {
			dataBox.data = {};
		};
		
		return dataBox;
	};
	
	return module;
};
