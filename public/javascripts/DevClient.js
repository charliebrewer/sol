SolGame.DevClient = {
	clear : function() {
		// TODO
	},
	
	getBox : function(properties) {
		return `
		<div class="box">
			<div class="name">${properties.name}</div>
			<div class="desc">${properties.desc}</div>
			<input type="submit" onclick="${properties.onclick}"></input>
		</div>
		`;
	},
	
	getContainer : function(properties) {
		return `
		<div class="container">
			<span>Name: ${properties.name}</span>
			${properties.contents}
		</div>
		`;
	},
	
	renderObjects : function(name, objectArr) {
		var containerProperties = {name : name};
		containerProperties.contents = '';
		
		objectArr.forEach(function(obj) {
			containerProperties.contents += SolGame.DevClient.getBox(obj);
		});
		
		var container = $('#solColumns').html() + this.getContainer(containerProperties);
		
		$('#solColumns').html(container);
	},
	
	// Temp function
	addColumn : function() {
		var objectArr = [];
		objectArr.push({name: 'hi', desc: 'bye', onclick:"alert('hey');"});
		objectArr.push({name: 'hi', desc: 'bye', onclick:"alert('hey');"});
		objectArr.push({name: 'hi', desc: 'bye', onclick:"alert('hey');"});
		
		this.renderObjects('cb', objectArr);
	},
	
	renderBasePage : function() {
		$('#solContainer').html(`
		<input type="submit" onclick="SolGame.DevClient.addColumn();"></input>
		<input type="submit" onclick="SolGame.ShopController.renderDevClient(1);"></input>
		<div id="solColumns"></div>
		`);
	},
	
	renderStoreItems : function() {},
};
