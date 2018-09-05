var sprintf = require("sprintf-js").sprintf;
var SqlString = require('sqlstring');

var mysql = require('mysql');

var Logger = require('../helpers/Logger');
//var DataBox = require('../helpers/DataBox');

var pool = mysql.createPool({
	connectionLimit : 10,
	host            : '127.0.0.1',
	user            : 'sleddog',
	password        : 'asdf',
	database        : 'sol'
});

module.exports = function() {
	var module = {};
	
	module.SET_TYPE_ONE = 1;
	module.SET_TYPE_MANY = 2;
	module.SET_TYPE_ALL = 3;
	
	module.getDataKey = function(generic, specific) {
		// TODO run some tests so we aren't accepting empty keys for example
		return sprintf("%s_%s", generic, specific);
	};
	
	/**
	 * The primary way that other DAO files access their data.
	 *
	 * @param specificId The specific ID to be used in the data set. Note that
	 *        this should be set even when selecting all data for cache key purposes.
	 */
	module.getData = function(params, specificId, callback) {
		var dataKey = module.getDataKey(params.tableName, specificId);
		
		switch(params.setType) {
			case module.SET_TYPE_ONE:
				module.selectOne(params.tableName, params.keyName, specificId, function(output) {
					//module.cacheData(dataBox, params, specificId, output);
					callback(output);
				});
				break;
				
			case module.SET_TYPE_MANY:
				module.selectMany(params.tableName, params.keyName, specificId, function(output) {
					//module.cacheData(dataBox, params, specificId, output);
					callback(output);
				});
				break;
				
			case module.SET_TYPE_ALL:
				module.selectAll(params.tableName, function(output) {
					//module.cacheData(dataBox, params, specificId, output);
					callback(output);
				});
				break;
				
			default:
				Logger().log(Logger().NORMAL, sprintf("Unrecognized set type %s", params.setType));
		}
	};
	
	/**
	 * The primary way that DAO files create and update data. This function
	 * utilizes a INSERT ON DUPLICATE KEY UPDATE statement, so if the primary
	 * key in the table is present in the row, the data will be updated instead.
	 */
	module.setData = function(params, row, callback) {
		if(undefined == row[params.keyName]) {
			Logger().log(Logger().NORMAL, "Setting data but keyName is not present in row");
			callback();
			return;
		}
		
		//module.clearCache(dataBox, params, row[params.keyName]);
		
		module.updateOrInsert(params.tableName, row, callback);
	};
	
	module.cacheData = function(dataBox, params, specificId, data) {
		var dataKey = module.getDataKey(params.tableName, specificId);
		
		if(params.useDataBox) {
			dataBox.setData(dataKey, data);
		}
		
		if(0 < params.cacheTimeoutSc) {
			// TODO
		}
	};
	
	module.clearCache = function(dataBox, params, specificId) {
		var dataKey = module.getDataKey(params.tableName, specificId);
		
		dataBox.clrData(dataKey);
		
		// TODO cache
	};
	
	module.query = function(queryStr, callback) {
		Logger().log(Logger().DATABASE, queryStr);
		
		pool.query(queryStr, function (err, rows, fields) {
			if (err) throw err;

			callback(rows);
		});
	};
	
	module.selectAll = function(tableName, callback) {
		module.query(sprintf("SELECT * FROM %s WHERE 1", tableName), callback);
	};
	
	module.selectMany = function(tableName, keyName, keyValue, callback) {
		module.query(
			sprintf("SELECT * FROM %s WHERE %s = '%s'",
				tableName,
				keyName,
				SqlString.format(keyValue)
			),
			callback
		);
	};
	
	module.selectOne = function(tableName, keyName, keyValue, callback) {
		module.query(
			sprintf("SELECT * FROM %s WHERE %s = '%s'",
				tableName,
				keyName,
				SqlString.format(keyValue)
			),
			function(rows) {
				if(rows.length != 1) {
					Logger().log(Logger().NORMAL, (sprintf("Didn't get one row for: %s %s %s", tableName, keyName, keyValue)));
					callback(null);
				} else {
					callback(rows.pop());
				}
			}
		);
	};
	
	/**
	 * Function to update a single row in the db.
	 *
	 * TODO remove this function, it is deprecated
	 * 
	 * @param tableName The name of the table to update.
	 * @param keyName The name of the key to be used in the WHERE statement. Must be present in updatedRow, value must be integer.
	 * @param fields Array of field names in this table.
	 * @param updatedRow Object containing keys from fields mapping to values.
	 */
	module.updateOne = function(tableName, keyName, fields, updatedRow, callback) {
		if(undefined == updatedRow[keyName]) {
			Logger().log(Logger().NORMAL, 'No key value defined in update');
			callback({});
			return;
		}
		
		var updateValues = [];
		fields.forEach(function(field) {
			if(field == keyName)
				return; // We don't touch the key name
			
			if(undefined != updatedRow[field]) {
				updateValues.push(sprintf("%s = '%s'", field, SqlString.format(updatedRow[field])));
			}
		});
		
		if(updateValues.length > 0) {
			// TODO flush cache
			module.query(
				sprintf("UPDATE %s SET %s WHERE %s = %i LIMIT 1",
					tableName,
					updateValues.join(', '),
					keyName,
					SqlString.format(updatedRow[keyName])
				),
				callback
			);
		}
	};
	
	module.updateOrInsert = function(tableName, row, callback) {
		var fieldNames = [];
		var values = [];
		var combined = [];
		
		for(var key in row) {
			fieldNames.push(key);
			values.push(sprintf("'%s'", row[key]));
			combined.push(sprintf("%s='%s'", key, row[key]));
		}
		
		module.query(
			sprintf("INSERT INTO %s (%s) VALUES (%s) ON DUPLICATE KEY UPDATE %s",
				tableName,
				fieldNames.join(', '),
				values.join(', '),
				combined.join(', ')
			),
			callback
		);
	};
	
	module.updateByDelta = function(tableName, pkName, pkValue, fieldName, delta, callback) {
		var query = sprintf(
			"UPDATE %s SET %s = %s + %i WHERE %s = %s LIMIT 1",
			tableName, fieldName, fieldName, delta, pkName, pkValue
		);
		
		module.query(query, callback);
	};
	
	return module;
}
