module.exports = {
	Crd: function({tMs = 0, pos = {x: 0, y: 0}, mov = {x: 0, y: 0}}) {
		this.tMs = tMs;
		
		this.pos = {};
		this.pos.x = pos.x;
		this.pos.y = pos.y;
		
		this.mov = {};
		this.mov.x = mov.x;
		this.mov.y = mov.y;
		
		this.equals = function(other) {
			if(this.tMs != other.tMs)
				return false;
			
			if(this.pos.x != other.pos.x)
				return false;
			
			if(this.pos.y != other.pos.y)
				return false;
			
			if(this.mov.x != other.mov.x)
				return false;
			
			if(this.mov.y != other.mov.y)
				return false;
			
			return true;
		};
	}
};
