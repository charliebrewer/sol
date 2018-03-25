SolGame.InfoDiv = {
	getObj : function() {
		return $('#solInfo');
	},
	
	clear : function() {
		// TODO potentially register callback functions to call here
		SolGame.InfoDiv.getObj().html('');
	},
	
	showQuests : function() {
		SolGame.InfoDiv.clear();
		
		const questTemplate = ({ qId, cId, cQuantity }) => `
		<div class='solQuest'>
			<span>Commodity ID: ${cId}</span>
			<span>Quantity: ${cQuantity}</span>
			<input type="submit" value="Complete" onclick="alert(${qId})" />
		</div>`;
		
		var output = [];
		
		SolGame.PlayerData.playerQuests.forEach(function(plrQuest) {
			output.push(
				questTemplate({ qId : plrQuest.plr_quest_id, cId : plrQuest.def_commodity_id, cQuantity : plrQuest.commodity_quantity })
			);
		});
		
		SolGame.InfoDiv.getObj().html(output.join('<br>'));
	}
};
