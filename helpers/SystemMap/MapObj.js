const PathObj = require('./PathObj');

module.exports = {
	TYPE_NONE:    0,
	TYPE_CELBODY: 1,
	TYPE_STATION: 2,
	TYPE_ANOMALY: 3,
	
	MapObj: function({ type, id, imgUrl, pathObj }) {
		this.type    = type;
		this.id      = id;
		this.imgUrl  = imgUrl;
		this.pathObj = pathObj;
		this.active  = true;
	}
};
