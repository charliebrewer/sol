var victor = require('victor');

var om = require('../../helpers/OrbitalMechanics');
var nm = require('../../helpers/NavigationMechanics');
var qm = require('../../helpers/QuestMechanics');

SolGame.Shared = {
	Victor : victor,
	
	OrbitalMechanics : om,
	NavigationMechanics : nm,
	QuestMechanics : qm
};
