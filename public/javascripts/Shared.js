var victor = require('victor');

var db = require('../../helpers/DataBox');
var om = require('../../helpers/OrbitalMechanics');
var nm = require('../../helpers/NavigationMechanics');
var qm = require('../../helpers/QuestMechanics');

SolGame.Shared = {
	Victor : victor,
	
	DataBox : db,
	OrbitalMechanics : om,
	NavigationMechanics : nm,
	QuestMechanics : qm
};
