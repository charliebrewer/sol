var mysql = require('mysql')
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'sleddog',
  password : 'asdf',
  database : 'sol'
});

module.exports = function() {
	var module = {};

	module.query = function(queryStr, callback) {
		connection.connect();

		var returnRows = connection.query(queryStr, callback);/*function (err, rows, fields) {
			if (err) throw err;

		  //console.log('Ran query: ' + queryStr + '. Result was: ', rows[0])
		  
		  //returnRows = rows;
		});
		//*/

		connection.end();

		//console.log(returnRows.results);
		
		//return returnRows;
	};
	
	module.create = function(queryStr, callback) {
		// TODO clear cache
		module.query(queryStr, callback);
	};
	
	module.read = function(queryStr, callback) {
		// TODO check cache first
		module.query(queryStr, callback);
	};
	
	module.update = function(queryStr, callback) {
		module.query(queryStr, callback);
	};
	
	return module;
}
