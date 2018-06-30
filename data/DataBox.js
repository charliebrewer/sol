const DataSources = require('./DataSources');
const DaoFactoryFactory = require('./DaoFactoryFactory');

/**
 * DataBox facade for requesting data from an arbitrary number of sources.
 *
 * Sources are bitmasks of DataSources.SOURCE_* that inform the DataBox
 * where to request data and where to write data.
 *
 * Cache management is handled automatically when reading and writing data.
 * While it is not recommended, you can define custom methods in a
 * particular DAO and request that DAO through the DataBox to call the
 * functions on it. Be sure to flush cache if the functions change state.
 */
module.exports = function() {
	var module = {};
	
	module.getDataBoxServerStandard = function() {
		return module.getDataBox(
			DataSources.SOURCE_LOCAL | DataSources.SOURCE_MEMCACHE | DataSources.SOURCE_DB,
			DataSources.SOURCE_DB,
			DataSources.SOURCE_LOCAL | DataSources.SOURCE_MEMCACHE
		);
	};
	
	module.getDataBoxServerNoWrite = function() {
		return module.getDataBox(
			DataSources.SOURCE_LOCAL | DataSources.SOURCE_MEMCACHE | DataSources.SOURCE_DB,
			DataSources.SOURCE_LOCAL,
			DataSources.SOURCE_NONE
		);
	};
	
	module.getDataBoxClientStandard = function() {
		return module.getDataBox(
			DataSources.SOURCE_LOCAL | DataSources.SOURCE_SERVER,
			DataSources.SOURCE_NONE,
			DataSources.SOURCE_LOCAL
		);
	};
	
	module.getDataBox = function(readSources, writeSources, cacheSources) {
		// DAO Factory bitmasks
		var _readSources  = parseInt(readSources);
		var _writeSources = parseInt(writeSources);
		var _cacheSources = parseInt(cacheSources);
		if(isNaN(_readSources) || isNaN(_writeSources) || isNaN(_cacheSources))
			throw "Invalid DataBox sources";
		
		if(0 != (_writeSources & DataSources.SOURCE_DB) && 0 == (_cacheSources & DataSources.SOURCE_MEMCACHE))
			throw "Cannot create data box that writes to db and doesn't clear memcache";
		
		var _daos = {
			_daos : {},
			
			getDao : function(sourceType, daoType) {
				return this._daos[this.getKey(sourceType, daoType)];
			},
			
			setDao : function(sourceType, daoType, dao) {
				this._daos[this.getKey(sourceType, daoType)] = dao;
			},
			
			clrDao : function(sourceType, daoType) {
				delete this._daos[this.getKey(sourceType, daoType)];
			},
			
			getKey : function(sourceType, daoType) {
				return sourceType + '_' + daoType;
			}
		};
		
		/**
		 * Method to return a specific concrete dao. This function is exposed
		 * so that custom behavior can be added to a dao and referenced later.
		 */
		var _getDao = function(sourceType, daoType) {
			if(0 == (sourceType & (_readSources | _writeSources | _cacheSources)))
				throw "Cannot retrieve dao not associated with this DataBox";
			
			var dao = _daos.getDao(sourceType, daoType);
			
			if(undefined == dao) {
				dao = DaoFactoryFactory().getDaoFactory(sourceType).getDao(daoType);
				_daos.setDao(sourceType, daoType, dao);
			}
			
			return dao;
		};
		
		// sources, order of sources, function to call, set cache or clear cache
		
		var _getData = function(prevSourceType, daoType, id, callback) {
			var sourceType = DataSources.nextSourceType(prevSourceType, _readSources);
			
			if(DataSources.SOURCE_NONE == sourceType) {
				callback(null);
				return;
			}
			
			var dao = _getDao(sourceType, daoType);
			
			dao.getData(id, function(output) {
				if(null != output) {
					_cacheData(sourceType, daoType, id, output, function() {
						callback(output);
					});
					
					return;
				}
				
				_getData(sourceType, daoType, id, callback);
			});
		};
		
		var _setData = function(prevSourceType, daoType, id, data, callback) {
			var sourceType = DataSources.nextSourceType(prevSourceType, _writeSources);
			
			if(DataSources.SOURCE_NONE == sourceType) {
				_clearCache(DataSources.SOURCE_NONE, daoType, id, callback);
				return;
			}
			
			var dao = _getDao(sourceType, daoType);
			
			dao.setData(id, data, function() {
				_setData(sourceType, daoType, id, data, callback);
			});
		};
		
		var _addData = function(prevSourceType, daoType, id, data, callback) {
			var sourceType = DataSources.nextSourceType(prevSourceType, _writeSources);
			
			if(DataSources.SOURCE_NONE == sourceType) {
				_clearCache(DataSources.SOURCE_NONE, daoType, id, callback);
				return;
			}
			
			var dao = _getDao(sourceType, daoType);
			
			dao.addData(id, data, function() {
				_addData(sourceType, daoType, id, data, callback);
			});
		};
		
		var _delData = function(prevSourceType, daoType, id, callback) {
			var sourceType = DataSources.nextSourceType(prevSourceType, _writeSources);
			
			if(DataSources.SOURCE_NONE == sourceType) {
				_clearCache(DataSources.SOURCE_NONE, daoType, id, callback);
				return;
			}
			
			var dao = _getDao(sourceType, daoType);
			
			dao.delData(id, function() {
				_delData(sourceType, daoType, id, callback);
			});
		};
		
		var _cacheData = function(prevSourceType, daoType, id, data, callback) {
			var sourceType = DataSources.prevSourceType(prevSourceType, _cacheSources);
			
			if(DataSources.SOURCE_NONE == sourceType) {
				callback(true);
				return;
			}
			
			var dao = _getDao(sourceType, daoType);
			
			dao.setData(id, data, function() {
				_cacheData(sourceType, daoType, id, data, callback);
			});
		};
		
		var _clearCache = function(prevSourceType, daoType, id, callback) {
			var sourceType = DataSources.nextSourceType(prevSourceType, _cacheSources);
			
			if(DataSources.SOURCE_NONE == sourceType) {
				callback(true);
				return;
			}
			
			var dao = _getDao(sourceType, daoType);
			
			dao.delData(id, function() {
				_clearCache(sourceType, daoType, id, callback);
			});
		};
		
		return {
			getData : function(daoType, id, callback) {
				_getData(DataSources.SOURCE_NONE, daoType, id, callback);
			},
			
			setData : function(daoType, id, data, callback) {
				_setData(DataSources.SOURCE_NONE, daoType, id, data, callback);
			},
			
			addData : function(daoType, id, data, callback) {
				_addData(DataSources.SOURCE_NONE, daoType, id, data, callback);
			},
			
			delData : function(daoType, id, callback) {
				_delData(DataSources.SOURCE_NONE, daoType, id, data, callback);
			},
			
			clearCache : function(daoType, id, callback) {
				_clearCache(DataSources.SOURCE_NONE, daoType, id, callback);
			},
		};
	};
	
	return module;
};
