Ext.ux.GearsTreeLoader = function(config) {
	Ext.tree.TreeLoader.superclass.constructor.call(this, config);
	this.clearOnLoad = config.clearOnLoad || true;
	this.selectSql = config.selectSql || null;
	this.db = config.db;
};
Ext.extend(Ext.ux.GearsTreeLoader, Ext.tree.TreeLoader, {


	load : function(node, callback) {
		if(this.clearOnLoad){
            while(node.firstChild){
                node.removeChild(node.firstChild);
            }
        }
        if(this.doPreload(node)){ // preloaded json children
            if(typeof callback == "function"){
                callback();
            }
		}
		else if(this.selectSql) {	
			this.requestData(node, callback);
		}
	}, // end load method

	doPreload: function(node) {

	}, //end dopreload method

	requestData: function(node, callback){
	 if(this.fireEvent("beforeload", this, node, callback) !== false){
		var rs = db.execute(this.selectSql);
		var data = new Array();
		try {
			this.isLoading = true;
			while( rs.isValidRow() ) {
				var row = new Array();
				var count = rs.fieldCount();
				for( var i = 0; i<count; i++) {
					row.push( rs.field(i) );
				}
				data.push( row );
				rs.next();
			}
			this.handleResponse({node: node, callback: callback, data: data});
		}
		catch(ex) {
			this.handleFailure();
		}
	 }
	 else {
		 // if the load is cancelled, make sure we notify
		// the node that we are done
		if(typeof callback == "function"){
			callback();
		}
	 }

	},// end requestData method

	isLoading: function() {
		return this.isLoading;
	},

	abort: function() {

	},

	handleResponse: function(response) {
		this.processResponse(response, response.node, response.callback);
		this.fireEvent('load', this, response.node, response);
	}, // end handle resp method

	processResponse : function(response, node, callback) {
		var json = '';
		var data = response.data;
		for( var i = 0; i < data.length; i++) {

		}
		try {
            var o = eval("("+json+")");
            node.beginUpdate();
            for(var i = 0, len = o.length; i < len; i++){
                var n = this.createNode(o[i]);
                if(n){
                    node.appendChild(n);
                }
            }
            node.endUpdate();
			this.isLoading = false;
            if(typeof callback == "function"){
                callback(this, node);
            }
        }catch(e){
            this.handleFailure(response);
        }
	}, // end process response

	handleFailure: function(response) {

	} // end handle failure
});


