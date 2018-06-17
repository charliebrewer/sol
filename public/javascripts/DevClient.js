SolGame.DevClient = {
	MAX_TIERS : 10,
	
	////////////////////////////////////////////////////////////////
	// Generic Render Functions
	////////////////////////////////////////////////////////////////
	
	getBox : function(properties) {
		return `
		<div class="box">
			<div class="name">${properties.name}</div>
			<div class="desc">${properties.desc}</div>
			<input type="submit" onclick="${properties.onclick}"></input>
		</div>
		`;
	},
	
	getContainer : function(tier, properties) {
		return `
		<div class="container tier_${tier}">
			<span>${properties.name}</span>
			${properties.contents}
		</div>
		`;
	},
	
	renderObjects : function(tier, name, objectArr) {
		if(tier > this.MAX_TIERS)
			throw "Too many tiers";
		
		$('#outputText').val('');
		for(let i = tier; i < this.MAX_TIERS; i++)
			$('.container.tier_'+ i).remove();
		
		var containerProperties = {name : name};
		containerProperties.contents = '';
		
		objectArr.forEach(function(obj) {
			containerProperties.contents += SolGame.DevClient.getBox(obj);
		});
		
		var container = $('#solColumns').html() + this.getContainer(tier, containerProperties);
		
		$('#solColumns').html(container);
	},
	
	displayOutput : function(output) {
		$('#outputText').val(JSON.stringify(output));
	},
	
	////////////////////////////////////////////////////////////////
	// Specific Render Functions
	////////////////////////////////////////////////////////////////
	
	renderCelestialBodies : function(tier) {
		SolGame.models.getDefinitionsData(function(defData) {
			var objArr = [];
			
			defData.celestialBodies.forEach(function(cBody) {
				objArr.push({
					name: cBody.name,
					desc: '',
					onclick: `SolGame.DevClient.renderCelestialBodyOptions(${tier + 1}, ${cBody.celestial_body_id});`
				});
			});
			
			SolGame.DevClient.renderObjects(tier, `Celestial Bodies`, objArr);
		});
	},
	
	renderCelestialBodyOptions : function(tier, cBodyId) {
		var objArr = [];

		objArr.push({
			name: 'View Stations',
			desc: '',
			onclick: `SolGame.DevClient.renderStations(${tier + 1}, ${cBodyId});`
		});
		objArr.push({
			name: 'Navigate Here',
			desc: '',
			onclick: `alert('thats what you think');`
		});
		
		SolGame.DevClient.renderObjects(tier, `Options for body ${cBodyId}`, objArr);
	},
	
	renderStations : function(tier, cBodyId) {
		SolGame.models.getDefinitionsData(function(defData) {
			var objArr = [];
			
			defData.stations.filter(e => e.parent_body_id == cBodyId).forEach(function(station) {
				objArr.push({
					name: station.name,
					desc: '',
					onclick: `SolGame.DevClient.renderStationOptions(${tier + 1}, ${station.station_id});`
				});
			});
			
			SolGame.DevClient.renderObjects(tier, `Stations Here`, objArr);
		});
	},
	
	renderStationOptions : function(tier, stationId) {
		var objArr = [];

		objArr.push({
			name: 'View Shops',
			desc: '',
			onclick: `SolGame.DevClient.renderShopsAtStation(${tier + 1}, ${stationId});`
		});
		objArr.push({
			name: 'View Quests',
			desc: '',
			onclick: `SolGame.DevClient.renderQuestsAtStation(${tier + 1}, ${stationId});`
		});
		objArr.push({
			name: 'Navigate Here',
			desc: '',
			onclick: `alert('thats what you think');`
		});
		
		SolGame.DevClient.renderObjects(tier, `Options for station ${stationId}`, objArr);
	},
	
	renderShopsAtStation : function(tier, stationId) {
		SolGame.models.getShopsAtStation(stationId, function(defShops) {
			var objArr = [];
			
			defShops.defShops.forEach(function(defShop) {
				objArr.push({
					name: defShop.name,
					desc: '',
					onclick: `SolGame.DevClient.renderShopItems(${tier + 1}, ${stationId}, ${defShop.shop_id});`
				});
			});
			
			SolGame.DevClient.renderObjects(tier, `Shops at Station ${stationId}`, objArr);
		});
	},
	
	renderQuestsAtStation : function(tier, stationId) {
		SolGame.QuestCtrl.generateQuests(function(questInstances) {
			var objArr = [];
			
			for(let i = 0; i < questInstances.length; i++) {
				objArr.push({
					name: 'Need name',
					desc: JSON.stringify(questInstances[i]),
					onclick: `SolGame.QuestCtrl.acceptGeneratedQuest(${i}, SolGame.DevClient.displayOutput);`
				});
			}
			
			SolGame.DevClient.renderObjects(tier, `Quests at station ${stationId}`, objArr);
		});
	},
	
	renderShopItems : function(tier, stationId, shopId) {
		SolGame.models.getShopsAtStation(stationId, function(defShops) {
			var objArr = [];
			
			defShops.defShopItems.filter(e => e.shop_id == shopId).forEach(function(shopItem) {
				objArr.push({
					name: `Type: ${shopItem.output_item_type}, ID: ${shopItem.output_item_id}`,
					desc: `Type: ${shopItem.input_item_type}, ID: ${shopItem.input_item_id}`,
					onclick: `SolGame.models.activateShopItem({sell : 0, shopItemId : ${shopItem.shop_item_id}}, SolGame.DevClient.displayOutput);`
				});
			});
			
			SolGame.DevClient.renderObjects(tier, `Shop Items at Shop ${shopId}`, objArr);
		});
	},
	
	////////////////////////////////////////////////////////////////
	// Inventory
	////////////////////////////////////////////////////////////////
	
	renderInventory : function(tier) {
		var objArr = [];
		
		SolGame.models.getPlayerData(function(playerData) {
			objArr.push({
				name: 'Currency',
				desc: `Credits: ${playerData.playerRecord.credits}`,
				onclick: ``
			});
			objArr.push({
				name: 'Ships',
				desc: '',
				onclick: `SolGame.DevClient.renderPlrShips(${tier + 1});`
			});
			objArr.push({
				name: 'Player Location',
				desc: '',
				onclick: `alert('thats what you think');`
			});
			
			SolGame.DevClient.renderObjects(tier, `Inventory`, objArr);
		});
	},
	
	renderPlrShips : function(tier) {
		SolGame.models.getPlayerData(function(plrData) {
			SolGame.models.getDefinitionsData(function(defData) {
				var objArr = [];
				var defShip;
				
				plrData.playerShips.forEach(function(plrShip) {
					defShip = defData.defShips.find(e => e['ship_id'] == plrShip['def_ship_id']);
					
					objArr.push({
						name: `${defShip.name}`,
						desc: ``,
						onclick: `SolGame.DevClient.renderShipOptions(${tier + 1}, ${defShip.ship_id});`
					});
				});
				
				SolGame.DevClient.renderObjects(tier, `Player Ships`, objArr);
			});
		});
	},
	
	renderShipOptions : function(tier, defShipId) {
		var objArr = [];
		
		SolGame.models.getPlayerData(function(plrData) {
			objArr.push({
				name: `View Cargo`,
				desc: ``,
				onclick: `SolGame.DevClient.renderShipCargo(${tier + 1}, ${defShipId});`
			});
			objArr.push({
				name: `View Loadout`,
				desc: ``,
				onclick: `SolGame.DevClient.renderShipLoadout(${tier + 1}, ${defShipId});`
			});
			objArr.push({
				name: 'Outfit',
				desc: '',
				onclick: `alert('thats what you think');`
			});
			
			SolGame.DevClient.renderObjects(tier, `Ship ${defShipId} Options`, objArr);
		});
	},
	
	renderShipCargo : function(tier, defShipId) {
		var objArr = [];
		
		SolGame.models.getPlayerData(function(plrData) {
			var plrShip = plrData.playerShips.find(e => e['def_ship_id'] == defShipId);
			
			objArr.push({
				name: `TODO make items boxes`,
				desc: JSON.stringify(plrShip['cargo']),
				onclick: ``
			});
			
			SolGame.DevClient.renderObjects(tier, `Ship ${defShipId} Cargo`, objArr);
		});
	},
	
	renderShipLoadout : function(tier, defShipId) {
		var objArr = [];
		
		SolGame.models.getPlayerData(function(plrData) {
			var plrShip = plrData.playerShips.find(e => e['def_ship_id'] == defShipId);
			
			objArr.push({
				name: `TODO make loadout boxes`,
				desc: plrShip['loadout'].split(','),
				onclick: ``
			});
			
			SolGame.DevClient.renderObjects(tier, `Ship ${defShipId} Cargo`, objArr);
		});
	},
};
