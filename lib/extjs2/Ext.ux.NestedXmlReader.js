// based on code on extjs forums at http://extjs.com/forum/showthread.php?t=4285&highlight=nested+XmlReader
Ext.namespace('Ext.ux');

Ext.ux.NestedXmlReader = function(meta, recordType) {
	Ext.data.XmlReader.superclass.constructor.call(this, meta, recordType);
};

// extend
Ext.extend(Ext.ux.NestedXmlReader, Ext.data.XmlReader, {
	readRecords : function(doc){
        this.xmlData = doc;
        var root = doc.documentElement || doc;
    	var q = Ext.DomQuery;
    	var recordType = this.recordType, fields = recordType.prototype.fields;
    	var sid = this.meta.id;
    	var totalRecords = 0;
    	if(this.meta.totalRecords){
    	    totalRecords = q.selectNumber(this.meta.totalRecords, root, 0);
    	}
    	var records = [];
    	var ns = q.select(this.meta.record, root);
        for(var i = 0, len = ns.length; i < len; i++) {
	        var n = ns[i];
	        var values = {};
	        var id = sid ? q.selectValue(sid, n) : undefined;
	        for(var j = 0, jlen = fields.length; j < jlen; j++){
	            var f = fields.items[j];
                    var v;
                    if( typeof f.mapping == "function" ){
                          v = f.mapping(n);
                     } else {
                           v = q.selectValue(f.mapping || f.name, n, f.defaultValue);
                     }
	            v = f.convert(v);
	            values[f.name] = v;
	        }
	        var record = new recordType(values, id);
	        record.node = n;
	        records[records.length] = record;
	    }
	    
	    return {
	        records : records,
	        totalRecords : totalRecords || records.length
	    };
    }	

});

