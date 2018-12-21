const DataValidator = require('../DataValidator');

module.exports = {
	getTemplate: function() {
		var vec = {
			x: {type: DataValidator.DATA_FLOAT},
			y: {type: DataValidator.DATA_FLOAT}
		};
		
		return {
			pcb: {type: DataValidator.DATA_INT},
			tMs: {type: DataValidator.DATA_INT},
			pos: {type: DataValidator.DATA_OBJ, template: vec},
			mov: {type: DataValidator.DATA_OBJ, template: vec}
		};
	},
	
	Crd: function() {
		this.pcb = 0; // Parent celestial body
		this.tMs = 0;
		this.pos = {x: 0, y: 0};
		this.mov = {x: 0, y: 0};
		
		this.copy = function(other) {
			other = DataValidator.cleanObj(other, module.exports.getTemplate());
			
			this.pcb = other.pcb;
			this.tMs = other.tms;
			this.pos.x = other.pos.x;
			this.pos.y = other.pos.y;
			this.mov.x = other.mov.x;
			this.mov.y = other.mov.y;
			
			return this;
		};
		
		/**
		 * Checks if two coordinates are equal.
		 *
		 * Note - even though two coordinates may be equal, if they do not have the
		 * same parent body they are not considered equal to each other. They should
		 * be translated to the same parent body first.
		 *
		 * TODO - add thresholds to allow for fudge factor
		 */
		this.equals = function(other) {
			if(this.pcb != other.pcb)
				return false;
			
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
