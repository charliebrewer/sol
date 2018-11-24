var express = require('express');
var router = express.Router();

var CommandController = require('../controllers/CommandController');

var GameUtil = require('../utils/GameUtil');

var DataBox = require('../helpers/DataBox');

var RESPONSE_SUCCESS = 0;
var RESPONSE_FAILURE = 1;

router.post('/', function(req, res, next) {
	var output = {"responseCode" : RESPONSE_FAILURE, "messages" : [], "data" : {}};

	var error = true;
	
	if(!req.body.req) {
		output.messages.push("req was not defined");
	} else {
		// TODO add exception handling for invalid JSON
		var request = JSON.parse(req.body.req);
		
		if(!request.command) {
			output.messages.push("no command specified");
		} else {
			var command = parseInt(request.command);

			if(!command) {
				// Invalid command
				output.messages.push("invalid command");
			} else if(!request.data) {
				output.messages.push("invalid data");
			} else {
				// Valid command
				error = false;
				
				// TODO populate player id, where does session validation go?
				var dataBox = DataBox().getBox(100000, Date.now());
				
				// We set the output to success first, but it may be changed in the call
				output.responseCode = RESPONSE_SUCCESS;
				
				// Before we run any commands, we update the game state for this player
				GameUtil().updateGameState(dataBox, function() {
					
					// Run the command
					CommandController().runCommand(dataBox, command, request.data, output, function(result) {
						res.json(result);
					});
				});
			}
		}
	}

	if(error) {
		res.json(output);
	}
});

module.exports = router;
