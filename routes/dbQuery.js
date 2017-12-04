var express = require('express');
var router = express.Router();

var PersistentDataAccess = require('../models/PersistentDataAccess');

/* GET home page. */
router.get('/', function(req, res, next) {
	console.log(req);
	
	PersistentDataAccess().query('SELECT * FROM cfg_celestial_bodies WHERE 1', function (err, rows, fields) {
		if(err) throw err;

		res.render('dbQuery', { output: rows[0]['name'] });
	});
});

module.exports = router;
