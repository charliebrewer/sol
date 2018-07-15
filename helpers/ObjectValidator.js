module.exports = {
	DATA_ANY:   0,
	DATA_BOOL:  1,
	DATA_INT:   2,
	DATA_FLOAT: 3,
	DATA_STR:   4,
	DATA_ARR:   5,
	DATA_OBJ:   6,
	
	/**
	 * Function to compare an object against a template. Builds a new object
	 * based on the template and returns it.
	 *
	 * @param obj The object to be validated.
	 * @param template Template object to compare against. Keys in the template
	 *     correspond to named keys expected in the object, and the values of each
	 *     key map to an object with the following keys.
	 *       type: ObjectValidator.DATA_INT - Required
	 *       template: {} - Another valid template, used for object types and arrays containing objects
	 *       arrType: ObjectValidator.DATA_INT - The type of elements in an array
	 */
	cleanObj: function(obj, template) {
		if('object' != typeof obj || Array.isArray(obj))
			throw "Not validating object";
		
		var retObj = {};
		
		Object.keys(template).forEach(function(key) {
			if(undefined == obj[key])
				throw "Object doesn't have key: " + key;
			
			if(module.exports.DATA_ANY == template[key].type) {
				retObj[key] = obj[key];
			} else if(module.exports.DATA_OBJ == template[key].type) {
				if('object' != typeof obj[key])
					throw "Key was not object: " + key;
				
				retObj[key] = module.exports.cleanObj(obj[key], template[key].template);
			} else if(module.exports.DATA_ARR == template[key].type) {
				if(!Array.isArray(obj[key]))
					throw "Key was not array: " + key;
				
				if(module.exports.DATA_ARR == template[key].arrType)
					throw "Arrays within arrays not supported";
					
				retObj[key] = [];
				
				obj[key].forEach(function(val) {
					if(module.exports.DATA_OBJ == template[key].arrType)
						retObj[key].push(module.exports.cleanObj(val, template[key].template));
					else
						retObj[key].push(module.exports.cleanData(val, template[key].arrType));
				});
			} else {
				// Assumed primitive data type
				retObj[key] = module.exports.cleanData(obj[key], template[key].type);
			}
		});
		
		return retObj;
	},
	
	/**
	 * Function to clean primitive data. Not used for arrays and objects.
	 *
	 * @param data The data to be cleaned
	 * @param type The type of data expected, DATA_*
	 *
	 * @return Primitive data type
	 */
	cleanData: function(data, type) {
		var retData;
		
		switch(type) {
			case module.exports.DATA_BOOL:
				retData = !!data;
			break;
			
			case module.exports.DATA_INT:
				retData = parseInt(data);
				
				if(isNaN(retData))
					throw "Expected int, got NaN";
			break;
			
			case module.exports.DATA_FLOAT:
				retData = parseFloat(data);
				
				if(isNaN(retData))
					throw "Expected float, got NaN";
			break;
			
			case module.exports.DATA_STR:
				retData = data + '';
			break;
			
			default:
				throw "Unhandled primitive data type: " + type;
			break;
		}
		
		return retData;
	},
};
