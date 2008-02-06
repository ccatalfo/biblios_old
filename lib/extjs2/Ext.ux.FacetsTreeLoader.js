Ext.namespace('Ext.ux');

Ext.ux.FacetsTreeLoader = Ext.extend(Ext.tree.TreeLoader, {

	processResponse : function(response, node, callback) {
		var json = '';
		json += '[';
		var xml = response.responseXML;
		var lists = Ext.DomQuery.select('list', xml);
		for( var i = 0; i < lists.length; i++) {
			if( i > 0 ) {
				json += ',';
			}
			var name = Ext.DomQuery.select('@name', lists[i])[0].firstChild.nodeValue;
			json += '{"text":"'+name+'",';
			json += '"leaf":false,';
			var terms = Ext.DomQuery.select('term', lists[i]);
			json += 'children: [';
			for( var j = 0; j < terms.length; j++) {
				if( j > 0 ) {
					json += ',';
				}
				var name = Ext.DomQuery.select('name', terms[j])[0].firstChild.nodeValue;
				var freq = Ext.DomQuery.select('frequency', terms[j])[0].firstChild.nodeValue;
				json += '{"text":"'+name+' ('+freq+')", "leaf":true}';
			} // terms
			json += ']'; // end children list
			json += '}';
		}
		json += ']';
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
            if(typeof callback == "function"){
                callback(this, node);
            }
        }catch(e){
            this.handleFailure(response);
        }
	} // processResponse
});
