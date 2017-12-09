var sprintf = require("sprintf-js").sprintf;
var SqlString = require('sqlstring');

var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit : 10,
	host            : 'localhost',
	user            : 'sleddog',
	password        : 'asdf',
	database        : 'sol'
});

module.exports = function() {
	var module = {};
	
	module.getCacheKey = function(tableName, key) {
		return sprintf("%s_%s", tableName, key);
	};

	module.query = function(queryStr, callback) {
		pool.query(queryStr, function (err, rows, fields) {
			if (err) throw err;

			callback(rows);
		});
	};
	
	module.selectAll = function(tableName, callback) {
		module.query(sprintf("SELECT * FROM %s WHERE 1", tableName), callback);
	};
	
	module.selectMany = function(tableName, keyName, keyValue, callback) {
		// TODO check cache first
		module.query(
			sprintf("SELECT * FROM %s WHERE %s = '%s'",
				tableName,
				keyName,
				SqlString.format(keyValue)
			),
			callback
		);
	};
	
	/**
	 * Function to update a single row in the db.
	 * 
	 * @param tableName The name of the table to update.
	 * @param keyName The name of the key to be used in the WHERE statement. Must be present in updatedRow, value must be integer.
	 * @param fields Array of field names in this table.
	 * @param updatedRow Object containing keys from fields mapping to values.
	 */
	module.updateOne = function(tableName, keyName, fields, updatedRow, callback) {
		if(undefined == updatedRow[keyName]) {
			console.log('No key value defined in update');
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
	
	return module;
}
