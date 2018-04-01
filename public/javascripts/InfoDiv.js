SolGame.InfoDiv = {
	getObj : function() {
		return $('#solInfo');
	},
	
	clear : function() {
		// TODO potentially register callback functions to call here
		SolGame.InfoDiv.getObj().html('');
	},
	
	showPlrQuests : function() {
		SolGame.InfoDiv.clear();
		
		const questTemplate = ({ plrQuestId, destinationStationId, cQuantity }) => `
		<div class='solPlrQuest'>
			<span>Quantity: ${cQuantity}</span>
			<span>Destination: ${destinationStationId}</span>
			<input type="submit" value="Complete" onclick="SolGame.models.completeQuest({plrQuestId : ${plrQuestId}}, function() {})" />
		</div>`;
		
		var output = [];
		
		SolGame.PlayerData.playerQuests.forEach(function(plrQuest) {
			if(0 == plrQuest.completed_time_sc) {
				output.push(
					questTemplate({ plrQuestId : plrQuest.plr_quest_id, destinationStationId : plrQuest.destination_station_id, cQuantity : plrQuest.commodity_quantity })
				);
			}
		});
		
		if(output.length == 0)
			output.push('You have completed all your quests!');
		
		SolGame.InfoDiv.getObj().html(output.join('<br>'));
	},
	
	showAvailableQuests : function() {
		SolGame.InfoDiv.clear();
		
		if(SolGame.PlayerData.playerRecord.location_type != SolGame.Shared.NavigationMechanics().LOCATION_TYPE_STATION) {
			SolGame.InfoDiv.getObj().html("You must be at a station to see available quests.");
			return;
		}
		
		var stationId = SolGame.PlayerData.playerRecord.location_id;
		
		var questInstances = SolGame.QuestCtrl.generateQuests(stationId);
		
		/*
		quest.defCommodityId = defCommodityId;
		quest.commodityQuantity = commodityQuantity;
		quest.totalValue = totalValue;
		quest.maxTimeSc = maxTimeSc;
		quest.destinationStationId = destinationStationId;
		*/
		
		const questTemplate = ({ destinationStationId, totalValue, generatedQuestIndex }) => `
		<div class='solQuestInstance'>
			<span>Destination: ${destinationStationId}</span>
			<span>Total Value: ${totalValue}</span>
			<input type="submit" value="Accept" onclick="SolGame.QuestCtrl.acceptGeneratedQuest(${generatedQuestIndex}, function() {})" />
		</div>`;
		
		var output = [];
		
		for(let i = 0; i < questInstances.length; i++) {
			questInstances[i].generatedQuestIndex = i;
			output.push(questTemplate(questInstances[i]));
		}
		
		if(output.length == 0)
			output.push("No quests available at this station.");
		
		SolGame.InfoDiv.getObj().html(output.join('<br>'));
	},
	
	showStations : function() {
		SolGame.InfoDiv.clear();
		
		const stationTemplate = ({ sName, plotCourse }) => `
		<div class='solStation'>
			<span>${sName}</span><input type="submit" value="Plot Course" onclick="${plotCourse}" />
		</div>`;
		
		var output = [];
		
		SolGame.models.getDefStations(function(defStations) {
			defStations.forEach(function(station) {
				output.push(stationTemplate({ sName : station.name, plotCourse : 'SolGame.NavigationController.tempPlotRoute('+ station.station_id +')' }));
			});
			
			SolGame.InfoDiv.getObj().html(output.join('<br>'));
		});
		
		/*
		plotRouteISS = function() {
			var route = SolGame.NavigationController.plotRoute(
			Date.now() + waitTimeMs,
			0,
			SolGame.NavigationController.DESTINATION_TYPE_STATION,
			1
		);
		*/
	},
	
	showShopsAtStation : function() {
		SolGame.InfoDiv.clear();
		
		if(SolGame.Shared.NavigationMechanics().LOCATION_TYPE_STATION != SolGame.PlayerData.playerRecord['location_type']) {
			SolGame.InfoDiv.getObj().html("You must be at a station to see available shops.");
			return;
		}
		
		const shopTemplate = ({ sName, sId }) => `
		<div class='solShop'>
			<span>${sName}</span><input type="submit" value="View Items" onclick="SolGame.InfoDiv.showShopItems(${sId})" />
		</div>`;
		
		var output = [];
		
		SolGame.DefinitionsData.getShopsAtStation(SolGame.PlayerData.playerRecord['location_id'], function(shopsAtStation) {
			shopsAtStation.defShops.forEach(function(defShop) {
				output.push(shopTemplate({sName : defShop['name'], sId : defShop['shop_id']}));
			});
			
			SolGame.InfoDiv.getObj().html(output.join('<br>'));
		});
	},
	
	showShopItems : function(shopId) {
		SolGame.InfoDiv.clear();
		
		if(SolGame.Shared.NavigationMechanics().LOCATION_TYPE_STATION != SolGame.PlayerData.playerRecord['location_type']) {
			SolGame.InfoDiv.getObj().html("You must be at a station to see available shops.");
			return;
		}
		
		const shopItemTemplate = ({ itemType, itemId, siId, sId }) => `
		<div class='solShopItem'>
			<span>Type: ${itemType}</span>
			<span>ID: ${itemId}</span>
			<input type="submit" value="Purchase" onclick="SolGame.models.activateShopItem({sell : 0, shopId : ${sId}, shopItemId : ${siId}}, function() {})" />
		</div>`;
		
		var output = [];
		
		SolGame.DefinitionsData.getShopsAtStation(SolGame.PlayerData.playerRecord['location_id'], function(shopsAtStation) {
			shopsAtStation.defShopItems.forEach(function(defShopItem) {
				output.push(shopItemTemplate({
					itemType : defShopItem['output_item_type'],
					itemId : defShopItem['output_item_id'],
					siId : defShopItem['shop_item_id'],
					sId : defShopItem['shop_id']
				}));
			});
			
			SolGame.InfoDiv.getObj().html(output.join('<br>'));
		});
	},
	
	showInventory : function() {
		SolGame.InfoDiv.clear();
		
		const inventoryTemplate = ({ credits }) => `
		<div class='solInventoryItem'>
			<span>Credits:</span><span>${credits}</span>
		</div>`;
		
		SolGame.InfoDiv.getObj().html(inventoryTemplate({ credits : SolGame.PlayerData.playerRecord.credits }));
	},
	
	modifyModules : function() {
		SolGame.InfoDiv.clear();
		
		const modifyModulesTemplate = () => `
		<div class='solModifyModules'>
			<input type="submit" value="Modify" onclick="SolGame.ShipController().modifyModules()" />
		</div>`;
		
		SolGame.InfoDiv.getObj().html(modifyModulesTemplate());
	}
};
