Ext.ux.GearsTreeLoader = function(config) {
	Ext.tree.TreeLoader.superclass.constructor.call(this, config);
	this.clearOnLoad = config.clearOnLoad || true;
	this.selectSql = config.selectSql || null;
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

	},// end requestData method

	isLoading: function() {

	},

	abort: function() {

	},

	handleResponse: function(response) {

	}, // end handle resp method

	handleFailure: function(response) {

	} // end handle failure
});


