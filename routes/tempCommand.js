var express = require('express');
var router = express.Router();

var CommandController = require('../controllers/CommandController');

var RESPONSE_SUCCESS = 0;
var RESPONSE_FAILURE = 1;

router.get('/', function(req, res, next) {
	//var request = JSON.parse(req.body.req);
	var output = {};
	
	CommandController().runCommand(0, {} /* request.data */, output, function(output){
		res.json(output);
	});
});

module.exports = router;
