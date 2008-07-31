/* Fix for Opera, which does not seem to include the map function on Array's */
if(!Array.prototype.map) {
    Array.prototype.map = function(fun) {
		var len = this.length;
		if (typeof fun != "function") {
		    throw new TypeError();
		}
		var res = new Array(len);
		var thisp = arguments[1];
		for(var i = 0; i < len; i++) {
		    if(i in this) {
	 			res[i] = fun.call(thisp, this[i], i, this);
		    }
		}
      	return res;
	};
}

/* Paging Memory Proxy, allows to use paging grid with in memory dataset */
Ext.data.PagingMemoryProxy = function(data) {
	Ext.data.PagingMemoryProxy.superclass.constructor.call(this);
	this.data = data;
};

Ext.extend(Ext.data.PagingMemoryProxy, Ext.data.MemoryProxy, {
	load : function(params, reader, callback, scope, arg) {
		params = params || {};
		var result;
		try {
			result = reader.readRecords(this.data);
		} catch(e) {
			this.fireEvent("loadexception", this, arg, null, e);
			callback.call(scope, null, arg, false);
			return;
		}
		
		// filtering
		if (params.filter) {
		    result.records = result.records.filter(function(el) {
				if (typeof(el) == "object") {
					var att = params.filterCol || el.fields.keys[0];
					return String(el.data[att]).match(params.filter)?true:false;
				} else {
				    return String(el).match(params.filter)?true:false;
				}
		    });
			result.totalRecords = result.records.length;
		}
		
		// sorting
		if (params.sort) {
		    var dir = String(params.dir).toUpperCase() == "DESC" ? -1 : 1;
       	    var fn = function(r1, r2) {
       	    	var v = 0;
       	    	if (r1 < r2) {
       	    		v = -1;
      	    	} else if (r1 > r2) {
      	    		v = 1;
     	    	}
     	    	return v;
       	    };
		    result.records.sort(function(a, b) {
				var v = 0;
				if (typeof(a) == "object") {
				    v = fn(a.data[params.sort], b.data[params.sort]) * dir;
				} else {
				    v = fn(a, b) * dir;
				}
				if (v == 0) {
				    v = (a.id < b.id ? -1 : 1);
				}
				return v;
		    });
		}
		
		// paging
		if (params.start !== undefined && params.limit !== undefined) {
			result.records = result.records.slice(params.start, params.start+params.limit);
		}
		callback.call(scope, result, arg, true);
	}
});
