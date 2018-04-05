var PersistentDataAccess = require('../models/PersistentDataAccess');
//var PlayerDAO = require('../models/PlayerDAO');
var DefQuestsDAO = require('../models/DefQuestsDAO');
var PlayerRoutesDAO = require('../models/PlayerRoutesDAO');
var CelestialBodiesDAO = require('../models/CelestialBodiesDAO');
var DefCommoditiesDAO = require('../models/DefCommoditiesDAO');
var DefBucketItemsDAO = require('../models/DefBucketItemsDAO');
var ItemUtil = require('../utils/ItemUtil');
var NavigationController = require('./NavigationController');
var QuestController = require('./QuestController');
var DefinitionsController = require('./DefinitionsController');
var ShipController = require('./ShipController');
var OrbitalMechanics = require('../helpers/OrbitalMechanics');
var QuestMechanics = require('../helpers/QuestMechanics');
var ShipMechanics = require('../helpers/ShipMechanics');
var NavigationMechanics = require('../helpers/NavigationMechanics');
var Bezier = require('bezier-js');
var DataBox = require('../helpers/DataBox');
var BucketMechanics = require('../helpers/BucketMechanics');
var pda = require('../models/PersistentDataAccess');

module.exports = function() {
	var module = {};

	module.runTempFunction = function(dataBox, input, output, callback) {
		console.log('hey');
		console.log(pda().dataBox.data);
		DefinitionsController().getAllDefinitionsData(dataBox, input, output, function(data) {
			console.log(pda().dataBox.data);
			DefinitionsController().getAllDefinitionsData(dataBox, input, output, function(data2) {
				callback(output);
			});
		});
		
		return;
		
		input.defStationId = 1;
		QuestController().arriveAtStation(dataBox, input, output, callback);
		
		return;
		
		// Accept quest
		DefQuestsDAO().getQuests(dataBox, function(defQuests) {
			var defQuest = defQuests[1];
			
			DefCommoditiesDAO().getCommodities(dataBox, function(defCommodities) {
				input.questInstance = QuestMechanics().generateQuestInstance(defQuest, defCommodities);
				input.defQuestId = defQuest['quest_id'];
				
				QuestController().acceptQuest(dataBox, input, output, function(res) {});
				
				callback(output);
			});
		});
		
		return;
		
		input.defQuestId = 0;
		input.questInstance = {};
		
		QuestController().acceptQuest(dataBox, input, output, function(res) {
			QuestController().arriveAtStation();
		});
		
		
		return;
		ShipController().setActiveShip(dataBox, {"plrShipId" : 1}, output, callback);
		
		var bucket = BucketMechanics().createEmptyBucket();
		bucket.modifyContents(BucketMechanics().ITEM_TYPE_SHIP, 1, -1);
		
		ItemUtil().giveBucketToPlr(dataBox, dataBox.getPlrId(), bucket, function(res) { console.log(res); });
		
		
		callback(output);
		return;
		
		var shipCargo = {};
		shipCargo = ShipMechanics().modifyShipCargo(shipCargo, 1, 1, -10);
		console.log(shipCargo);
		/*
		shipCargo = ShipMechanics().modifyShipCargo(shipCargo, 1, 2, 2);
		console.log(shipCargo);
		shipCargo = ShipMechanics().modifyShipCargo(shipCargo, 1, 1, -2);
		console.log(shipCargo);
		shipCargo = ShipMechanics().modifyShipCargo(shipCargo, 1, 1, -8);
		console.log(shipCargo);
		shipCargo = ShipMechanics().modifyShipCargo(shipCargo, 1, 2, -2);
		console.log(shipCargo);
		*/
		
		
		
		/*
		module.getRouteSegSml = function(
		startCrd, endCrd, routeControl1X, routeControl1Y, routeControl2X, routeControl2Y,
		speedControl1X, speedControl1Y, speedControl2X, speedControl2Y, fuelBurn
		*/
		var routeSegsSml = [];
		for(let i = 0; i < 3; i++) {
			var routeSegSml = NavigationMechanics().getRouteSegSml(OrbitalMechanics().getCrd(0, 1, 2, 3, 1234567890), OrbitalMechanics().getCrd(0, 1, 2, 3, 1234567890), 0, 1, 2, 3, 4, 5, 6, 7, 100);
			routeSegsSml.push(routeSegSml);
		}
		
		var routeSml = NavigationMechanics().getRouteSml(1, 1, 2, 12893798, routeSegsSml);
		console.log(JSON.stringify(routeSml));
		output.messages.push(routeSml);
		
		var routeLrg = NavigationMechanics().getRouteLrg(routeSml);
		//console.log(JSON.stringify(routeLrg));
		output.messages.push(routeLrg);
		
		var routeSml2 = NavigationMechanics().convertRouteLrgToSml(routeLrg);
		console.log(JSON.stringify(routeSml2));
		
		callback(output);
		
		/*
		var startCrd = OrbitalMechanics().getCrd(400, 0, 0, 200, 0);
		var endCrd, newCrd;
		var driftCrds = [];
		var prevCrd = startCrd;
		driftCrds.push(prevCrd);
		
		CelestialBodiesDAO().getBodies(function(celestialBodies) {
			for(var i = 0; i < 5; i++) {
				OrbitalMechanics().populateOrbitalPositions(celestialBodies, prevCrd.t * 1000);
				
				newCrd = OrbitalMechanics().getDriftCoordinate(prevCrd.pos, prevCrd.mov, prevCrd.t, OrbitalMechanics().TIME_UNIT, celestialBodies);
				driftCrds.push(newCrd);
				prevCrd = newCrd;
			}
			
			endCrd = prevCrd;
			
			console.log(startCrd);
			console.log(endCrd);
			//console.log(driftCrds);
			
			var curve = NavigationMechanics().getCurveFromCrds(
				startCrd, endCrd
			);
			
			//console.log(driftCrds);
			console.log(curve);
			
			PlayerRoutesDAO().getPlayerRoutes(input.plrId, function(playerRoutes) {
				var playerRoute = playerRoutes.pop();
				if(undefined == playerRoute) {
					output.messages.push('no player route');
					callback(output);
					return;
				}
				
				playerRoute.route_data[0].rsx = startCrd.pos.x;
				playerRoute.route_data[0].rsy = startCrd.pos.y;
				playerRoute.route_data[0].rex = endCrd.pos.x;
				playerRoute.route_data[0].rey = endCrd.pos.y;
				playerRoute.route_data[0].rc1x = curve.points[1].x;
				playerRoute.route_data[0].rc1y = curve.points[1].y;
				playerRoute.route_data[0].rc2x = curve.points[2].x;
				playerRoute.route_data[0].rc2y = curve.points[2].y;
console.log(playerRoute);
console.log(JSON.stringify(playerRoute));
				PlayerRoutesDAO().updatePlayerRoutes(playerRoute, function(prOutput) {
					callback(output);
				});
			});
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
