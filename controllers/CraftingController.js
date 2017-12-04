module.exports = function() {
	var module = {};
	
	/**
	 * Attempts to execute craft_id for plr_id.
	 * 
	 * @return Object containing a message and array of containing items taken and items given.
	 * Example: {"message" : "Success.", "itemsDelta" : []}
	 */
	module.executeCraftId = function(plr_id, craft_id) {
		return {"message" : "Success.", "itemsDelta" : []};
	}
	
	return module;
}
