var BucketMechanics = require('./BucketMechanics');

module.exports = function() {
	var module = {};
	
	module.MODULE_TYPE_CARGO = 1;
	// weapon, shields, etc
	
	/**
	 * Array of item types that are stored in a ship's cargo.
	 */
	module.cargoItemTypes = [
		BucketMechanics().ITEM_TYPE_COMMODITY
	];
	
	/**
	 * Get the mobility of a ship based on its mass and thrust.
	 *
	 * @return Int
	 */
	module.calcShipMobility = function(mass, thrust) {
		return thrust / mass;
	};
	
	module.cargoAcceptsItemType = function(itemType) {
		 return module.cargoItemTypes.includes(itemType);
	};
	
	/**
	 * Compares the loadout of a player ship against the allowed loadout of the definition.
	 * This currently only supports exact equipping of modules.
	 *
	 * plrShipLoadout = '1,2,3,4,5'; // def_ship_modules ids
	 * defShipLoadout = '1:2,3:4'; // module_type:module_tier, duplicates allowed
	 */
	module.validateLoadout = function(plrShipLoadout, defShipLoadout, defShipModules) {
		var plrShipModules = plrShipLoadout.split(',');
		
		var dslObj = {};
		defShipLoadout.split(',').forEach(function(typeTier) {
			var ttArr = typeTier.split(':');
			
			if(undefined == dslObj[ttArr[0]])
				dslObj[ttArr[0]] = {};
			if(undefined == dslObj[ttArr[0]][ttArr[1]])
				dslObj[ttArr[0]][ttArr[1]] = 0;
			
			dslObj[ttArr[0]][ttArr[1]] += 1;
		});
		
		var defShipModule;
		for(let i = 0; i < plrShipModules.length; i++) {
			defShipModule = defShipModules.find(e => e['ship_module_id'] == plrShipModules[i]);
			
			if(undefined == defShipModule)
				return false;
			if(undefined == dslObj[defShipModule['module_type']])
				return false;
			if(undefined == dslObj[defShipModule['module_type']][defShipModule['module_tier']])
				return false;
			if(0 >= dslObj[defShipModule['module_type']][defShipModule['module_tier']])
				return false;
			
			dslObj[defShipModule['module_type']][defShipModule['module_tier']] -= 1;
		}
		
		return true;
	};
	
	module.getCargoCapacity = function(plrShip, defShipModules) {
		return 100; // TODO temp hack
		var plrShipModules = plrShip['loadout'].split(',');
		
		var capacity = 0;
		
		var defShipModule;
		plrShipModules.forEach(function(plrShipModuleId) {
			defShipModule = defShipModules.find(e => e['ship_module_id'] == plrShipModuleId);
			
			if(module.MODULE_TYPE_CARGO == defShipModule['module_type']) {
				capacity += defShipModule['output'];
			}
		});
		
		return capacity;
	};
	
	return module;
};
