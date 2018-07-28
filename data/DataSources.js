module.exports = {
	SOURCE_NONE     : 0,
	SOURCE_LOCAL    : 1,
	SOURCE_MEMCACHE : 2,
	SOURCE_SERVER   : 4,
	SOURCE_DB       : 8,
	SOURCE_ALL      : 255,
	
	/**
	 * Returns the next numerically higher data source contained in the sources
	 * bitmask. Returns SOURCE_NONE when there are no more sources.
	 */
	nextSourceType : function(currFactory, sources) {
		if(0 == (sources & ~Math.max(0, currFactory * 2 - 1)))
			return this.SOURCE_NONE;
		
		// Guaranteed to have another source here
		var nextFactory;
		
		for(let i = 0; i < this.SOURCE_ALL; i++) {
			nextFactory = ((sources >> i) & 1) << i;
			if(0 != nextFactory && nextFactory > currFactory)
				return nextFactory;
		}
		
		throw "Failed to find next factory";
	},
	
	/**
	 * Returns the next numerically lower data source contained in the sources
	 * bitmask. Returns SOURCE_NONE when there are no more sources.
	 */
	prevSourceType : function(currFactory, sources) {
		if(this.SOURCE_NONE == currFactory)
			currFactory = this.SOURCE_ALL + 1;
		
		do {
			currFactory /= 2;
			if(0 != (sources & currFactory))
				return currFactory;
		} while(currFactory > 1);
		
		return this.SOURCE_NONE;
	},
	
	DAO_PLAYER: 1,
	DAO_CEL_BODIES: 2,
	DAO_STATIONS: 3,
};
