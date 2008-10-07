Ext.ux.GearsTreeLoader = function(config) {
	this.clearOnLoad = config.clearOnLoad || true;
	this.selectSql = config.selectSql || null;
	this.whereClause = config.whereClause || null;
	this.db = config.db || null;
	this.applyLoader = config.applyLoader || true;
    // callers can pass in their own custom processData function to use
    this.processData = config.processData || this.processData;

	Ext.apply(this, config);

	this.addEvents(
		"beforeload",
		"load",
		"loadexception"
	);

	Ext.ux.GearsTreeLoader.superclass.constructor.call(this);
};

Ext.extend(Ext.ux.GearsTreeLoader, Ext.util.Observable, {

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
	 	if( this.whereClause ) {
			var rs = db.execute(this.selectSql + this.whereClause, [node.attributes.id]);
		}
		else {
			var rs = db.execute(this.selectSql);
		}

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

    processData: function(data) {
        var json = [];
        for( var i = 0; i < data.length; i++) {
            var id = data[i][0];
            var text = data[i][1];
            var savefileid = data[i][0];
            var parentid = data[i][2];
            var qtip = data[i][3];
            var icon = data[i][4];
            var allowDelete = data[i][5];
            var allowAdd = data[i][6];
            var allowDrag = data[i][7];
            var allowDrop = data[i][8];
            var ddGroup = data[i][9];
            json.push({
                id: id,
                text: text,
                savefileid: savefileid,
                parentid: parentid,
                qtip: qtip,
                icon: uiPath + icon,
                leaf: false,
                allowDelete: allowDelete,
                allowAdd: allowAdd,
                allowDrag: allowDrag,
                allowDrop: allowDrop,
                expandable: false,
                expanded: true,
                ddGroup:ddGroup
            });
        }
        return json;
    },
	isLoading: function() {
		return this.isLoading;
	},

	abort: function() {

	},

	handleResponse: function(response) {
		this.processResponse(response, response.node, response.callback);
		this.fireEvent('load', this, response.node, response);
	}, // end handle resp method

    /**
    * Override this function for custom TreeNode node implementation
    */
    createNode : function(attr){
        // apply baseAttrs, nice idea Corey!
        if(this.baseAttrs){
            Ext.applyIf(attr, this.baseAttrs);
        }
        if(this.applyLoader !== false){
            attr.loader = this;
        }
        if(typeof attr.uiProvider == 'string'){
           attr.uiProvider = this.uiProviders[attr.uiProvider] || eval(attr.uiProvider);
        }
        return(attr.leaf ?
                        new Ext.tree.TreeNode(attr) :
                        new Ext.tree.AsyncTreeNode(attr));
    },

	processResponse : function(response, node, callback) {
		var data = response.data;
		json = this.processData(data);
		try {
            node.beginUpdate();
            for(var i = 0, len = json.length; i < len; i++){
                var n = this.createNode(json[i]);
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



