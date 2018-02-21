var PersistentDataAccess = require('../models/PersistentDataAccess');
//var PlayerDAO = require('../models/PlayerDAO');
var PlayerRoutesDAO = require('../models/PlayerRoutesDAO');
//var ItemController = require('./ItemController');
var NavigationController = require('./NavigationController');
var OrbitalMechanics = require('../helpers/OrbitalMechanics');
var NavigationMechanics = require('../helpers/NavigationMechanics');
var Bezier = require('bezier-js');

module.exports = function() {
	var module = {};

	module.runTempFunction = function(input, output, callback) {
		input.plrId = 100000;
		input.timeMs = Date.now();
		output.messages = [];
		
		var route_data = [ // route data
			{ // Each of these is a single route segment
				"ts"      : 0, // timestart
				"fb"       : 0, // [0,100] Integer representing engine burn "fuel burn"
				"rsx"    : -200, // route start x
				"rsy"    : -200, // route start y
				"rex"      : 200, // route end x
				"rey"      : 200, // route end y
				"rc1x" : 100, // route control 1 x
				"rc1y" : 100,
				"rc2x" : 100,
				"rc2y" : 100,
				"sc1x" : 0, // We don't need start or end for speed since they are always 0,0 and 1,1
				"sc1y" : 0, // speed control 1 y
				"sc2x" : 0,
				"sc2y" : 0
			}
		];
		
		PlayerRoutesDAO().getPlayerRoutes(input.plrId, function(playerRoutes) {
			for(var i = 0; i < playerRoutes.length; i++) {
				playerRoutes[i]['route_data'] = JSON.stringify(route_data);
				PlayerRoutesDAO().updatePlayerRoutes(playerRoutes[i]);
			}
		});
		
		//NavigationController().plotCourse(input, output, callback);
		/*
		var curve = new Bezier(1,2,3,4,5,6);
		//console.log(curve);
		//console.log(JSON.stringify(curve));
		
		var navSeg = NavigationMechanics().getNavSeg(
			NavigationMechanics().getBezierCurveQuad(1,2,3,4,5,6),
			NavigationMechanics().getBezierCurveQuad(6,5,4,3,2,1),
			Math.round(Date.now() / 1000),
			Math.round(Date.now() / 1000) + 10,
			0
		);
		
		//console.log(navSeg);
		
		var simpleSeg = NavigationMechanics().getSimpleNavSeg(navSeg);
		
		//console.log(simpleSeg);
		
		var complexSeg = NavigationMechanics().getComplexNavSeg(simpleSeg);
		
		//console.log(complexSeg);
		
		console.log(NavigationMechanics().getSimpleNavSeg(complexSeg));
		
		//console.log(JSON.stringify(NavigationMechanics().getTransportCurve(1,2,3,4,5,6,7,8)));
		*/
		//callback({});
		//getTransportCurve = function(startX, startY, controlX, controlY, endX, endY, startTime, endTime) 
		//console.log(JSON.stringify(new Bezier(1, 1,1,1,1,1)));
		//input.startCrd = new OrbitalMechanics().getCrd(12345, 12345, 5, 5, Math.round(Date.now() + 50000));
		//NavigationController().plotDrift(input, output, callback);
/*
		PlayerDAO().getPlayer(100000, function(playerRecord) {

			playerRecord['credits'] += 10;

			PlayerDAO().updatePlayer(playerRecord, function(res) {
				output.playerRecord = playerRecord;
				output.res = res;
				callback(output);
			});
		});
		
*/

		/*
		//update = function(tableName, keyName, fields, updatedRow, callback)
		var updatedRow = {'plr_id' : 100000, 'credits' : -10, 'name' : 'Charlie'};
		
		//var fields = ['plr_id', 'acct_id', 'name', 'credits', 'location_type', 'location_id', 'flags'];
		
		PersistentDataAccess().updateOne("plr_players", "plr_id", PlayerDAO().fields, updatedRow, function(out) {
			console.log(out);
		});
		*/
	};
	
	return module;
};
