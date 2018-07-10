SolGame.MapViewer = SolGame.MapViewer || {
	systemMap: null,
	
	zoom: 1, // 0-1
	
	viewOffset: {x: 0, y: 0},
	
	focusMapObj: null,
	
	getRenderedPosition: function(pos, isX) {
		if(isX)
			return (((pos - SolGame.MapViewer.focusMapObj.pos.x + SolGame.MapViewer.viewOffset.x) + (SolGame.views.systemSizeX / 2)) / SolGame.views.systemSizeX) * SolGame.views.pixiApp.renderer.width;
		else
			return (((pos - SolGame.MapViewer.focusMapObj.pos.y + SolGame.MapViewer.viewOffset.y) + (SolGame.views.systemSizeY / 2)) / SolGame.views.systemSizeY) * SolGame.views.pixiApp.renderer.height;
	},
	
	setSpritePos: function(mapObj) {
		mapObj.sprite.x = SolGame.MapViewer.getRenderedPosition(mapObj.pos.x, true);
		mapObj.sprite.y = SolGame.MapViewer.getRenderedPosition(mapObj.pos.y, false);
	},
	
	setTarget: function(mapObjType, mapObjId) {
		SolGame.MapViewer.viewOffset.x = 0;
		SolGame.MapViewer.viewOffset.y = 0;
		
		SolGame.MapViewer.systemMap.forActiveMapObj(function(mapObj) {
			if(mapObjType == mapObj.type && mapObjId == mapObj.id) {
				SolGame.MapViewer.focusMapObj = mapObj;
			}
		});
	},
	
	loadResources: function(callback) {
		SolGame.MapViewer.systemMap.forAllMapObj(function(mapObj) {
			if(!SolGame.views.pixiApp.loader.resources[mapObj.imgUrl])
				SolGame.views.pixiApp.loader.add(mapObj.imgUrl, mapObj.imgUrl);
		});
		
		SolGame.views.pixiApp.loader.load((loader, pResources) => {
			SolGame.MapViewer.systemMap.forAllMapObj(function(mapObj) {
				var sprite = new PIXI.Sprite(pResources[mapObj.imgUrl].texture);
				
				sprite.scale.x = 0.1;
				sprite.scale.y = 0.1;
				
				sprite.anchor.x = 0.5;
				sprite.anchor.y = 0.5;
				
				sprite.interactive = true;
				sprite.on("click", function() {
					SolGame.MapViewer.setTarget(mapObj.type, mapObj.id);
				});
				
				SolGame.views.pixiApp.stage.addChild(sprite);
				
				mapObj.sprite = sprite;
			});
		});
		
		SolGame.views.pixiApp.loader.onComplete.add(callback);
	},
	
	// Function passed to ticker
	draw: function(delta) {
		SolGame.MapViewer.systemMap.updateAllPos(Date.now());
		SolGame.MapViewer.systemMap.forActiveMapObj(SolGame.MapViewer.setSpritePos);
	},
};
