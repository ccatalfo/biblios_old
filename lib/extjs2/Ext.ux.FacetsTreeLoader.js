Ext.namespace('Ext.ux');

Ext.ux.FacetsTreeLoader = Ext.extend(Ext.tree.TreeLoader, {

	processResponse : function(response, node, callback) {
		var json = [];
		var xml = response.responseXML;
		var lists = Ext.DomQuery.select('list', xml);
		for( var i = 0; i < lists.length; i++) {
			var term = Ext.DomQuery.select('@name', lists[i])[0].firstChild.nodeValue;

			var terms = Ext.DomQuery.select('term', lists[i]);
            var children = [];
			for( var j = 0; j < terms.length; j++) {
				var name = Ext.DomQuery.select('name', terms[j])[0].firstChild.nodeValue;
				var freq = Ext.DomQuery.select('frequency', terms[j])[0].firstChild.nodeValue;
				var checked = false;
				if( UI.searchLimits[name] ) {
					checked = true;
				}
                children.push({
                    id: name,
                    searchType: term,
                    text: name + ' (' + freq + ')',
                    leaf: true,
                    checked:checked
                });
			} // terms
            json.push({
                text: term,
                leaf: false,
                children: children
            });
		}
        try {
            node.beginUpdate();
            for(var i = 0, len = json.length; i < len; i++){
                var n = this.createNode(json[i]);
                if(n){
                    node.appendChild(n);
                }
            }
            node.endUpdate();
            if(typeof callback == "function"){
                callback(this, node);
            }
        }catch(e){
            this.handleFailure(response);
        }
	} // processResponse
});
