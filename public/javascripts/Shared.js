const victor = require('victor');

const bm = require('../../helpers/BucketMechanics');
const om = require('../../helpers/OrbitalMechanics');
const nm = require('../../helpers/NavigationMechanics');
const qm = require('../../helpers/QuestMechanics');
const db = require('../../data/DataBox');
const md = require('../../helpers/MapData');

SolGame.Shared = {
	Victor : victor,
	
	BucketMechanics : bm,
	OrbitalMechanics : om,
	NavigationMechanics : nm,
	QuestMechanics : qm,
	DataBox : db
	MapData : md
};
