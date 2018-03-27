var BucketMechanics = require('./BucketMechanics');

module.exports = function() {
	var module = {};
	
	module.MAX_MODULE_TIER = 10;
	
	module.MODULE_TYPE_CARGO = 1;
	
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
	
	/**
	 * Equips a module to a ship by modifying the 'loadout' field of the plrShip
	 * parameter.
	 *
	 * @return bool Success or failure to add the module.
	 */
	module.equipModule = function(moduleId, plrShip, defShip, defShipModules) {
		var plrShipModules = plrShip['loadout'].split(',');
		// TODO get this out of a bucket... this is a bad code smell that we're using buckets like this for modules
		var defShipLoadout = BucketMechanics().createBucketFromString(defShip['loadout']);
		var moduleToEquip  = defShipModules.find(e => e['ship_module_id'] == moduleId);
		
		// First "equip" all existing modules to the ship definition loadout
		var plrShipModule;
		plrShipModules.forEach(function(plrShipModuleId) {
			plrShipModule = defShipModules.find(e => e['ship_module_id'] == plrShipModuleId);
			
			if(plrShipModule['module_type'] == moduleToEquip['module_type']) {
				// Find the smallest slot this can occupy
				for(let i = plrShipModule['module_tier']; i <= module.MAX_MODULE_TIER; i++) {
					if(0 < defShipLoadout.getItemQuantity(plrShipModule['module_type'], plrShipModule['module_tier'])) {
						defShipLoadout.modifyContents(plrShipModule['module_type'], plrShipModule['module_tier'], -1);
						break;
					}
				}
			}
		});
		
		// We have "equipped" all the existing modules, see if we can equip this one
		for(let i = moduleToEquip['module_tier']; i <= module.MAX_MODULE_TIER; i++) {
			if(0 < defShipLoadout.getItemQuantity(moduleToEquip['module_type'], moduleToEquip['module_tier'])) {
				// Success, there is room for this module
				plrShipModules.push(moduleToEquip['ship_module_id']);
				plrShip['loadout'] = plrShipModules.join(',');
				
				return true;
			}
		}
		
		return false;
	};
	
	return module;
};
