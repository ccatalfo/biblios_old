function MarcRecord(fieldlist) {
	var fields = new Array();
	if(fields) {
		fields = fieldlist;
	}
	var numfields = fields.length;	

	this.fields = function() {
		return fields;
	}

	this._field = function(fieldno) {
		for(var i=0; i<fields.length; i++){
			if( fields[i].tagnumber() == fieldno ) {
				return fields[i];
			}
		}
		return false;
	}

	this._addField = function(field) {
		fields.push(field);
	}

	this._removeField = function(fieldno) {
		for(var i=0; i<fields.length; i++){
			if( fields[i].tagnumber() == fieldno ) {
				fields.splice(i, 1);
			}
		}
	}

	this._XML = function() {
		// fixme this isn't working correctly: it's failing on trying to add xml fragment 
		// returned from fields[i].XML()
		//var xml = Sarissa.getDomDocument("", "record");
		//for(var i=0; i<fields.length; i++){
		//	xml.appendChild( fields[i].XML() );
		//}
		//return xml;
		return xslTransform.loadString( this._XMLString() );
	}

	this._XMLString = function() {
		var xml = '<record>';
		for(var i=0; i<fields.length; i++){
			xml += fields[i].XMLString();
		}
		xml += '</record>';
		return xml;
	}

}

MarcRecord.prototype.field = function(fieldno) {
	return this._field(fieldno);
}
 
MarcRecord.prototype.fields = function() {
	return this.fields();
}

MarcRecord.prototype.addField = function(field) {
	this._addField(field);
}

MarcRecord.prototype.removeField = function(fieldno) {
	this._removeField(fieldno);
}

MarcRecord.prototype.XML = function() {
	return this._XML();
}

MarcRecord.prototype.XMLString = function() {
	return this._XMLString();
}

function Field(tagnumber, indicator1, indicator2, subfields) {
	var that = this;
	var tagnumber = tagnumber;
	var indicators = new Array(indicator1, indicator2);
	var subfields = subfields;

	this._tagnumber = function() {
		return tagnumber;
	}

	this._indicator = function(num, val) {
		if( !Ext.isEmpty(val) ) {
			indicators[num] = val;
		}
		return indicators[num];
	}

	this._indicators = function() {
		return indicators;
	}

	this._hasSubfield = function(code) {
		for(var i = 0; i<subfields.length; i++) {
			if( subfields[i].code == code ) {	
				return true;
			}
		}
		return false;
	}
		
	this._subfields = function() {
		return subfields;
	}

	this._subfield = function(code, val) {
		var sf = '';
		for(var i = 0; i<subfields.length; i++) {
			if( subfields[i].code == code ) {
				sf = subfields[i];
			}
		}
		if( !Ext.isEmpty(val) ) {
			sf.value = val;
		}
		return sf;
	}

	this._XML = function() {
		var marcxml = Sarissa.getDomDocument('', '');
		// decide if it's controlfield of datafield	
		if( tagnumber == '000') {
			var leader = marcxml.createElement('leader');
			var lv = marcxml.createTextNode( subfields[0].value );
			leader.appendChild(lv);
			marcxml.appendChild(leader);
			return leader;
		}
		else if( tagnumber < '010' ) {
			var cf = marcxml.createElement('controlfield'); 
			cf.setAttribute('tag', tagnumber);
			var text = marcxml.createTextNode( subfields[0].value );
			cf.appendChild(text);
			return cf;
		}
		// datafield
		else {
			var df = marcxml.createElement('datafield');
			var tagAttr = marcxml.createAttribute('tag');		
			tagAttr.nodeValue = tagnumber;
			df.setAttributeNode(tagAttr);
			df.setAttribute('ind1', indicators[0]);
			df.setAttribute('ind2', indicators[1]);
			for( var i = 0; i< subfields.length; i++) {
				var sf = marcxml.createElement('subfield');
				sf.setAttribute('code', subfields[i].code);
				var text = marcxml.createTextNode( subfields[i].value );
				sf.appendChild(text);
				df.appendChild(sf);	
			}
			return df;
		}
	}

	this._XMLString = function() {
		return xslTransform.serialize( this.XML() );
	}
}

Field.prototype.XML = function() {
	return this._XML();
}

Field.prototype.XMLString = function() {
	return this._XMLString();
}

Field.prototype.subfields = function() {
	return this._subfields();	
}

Field.prototype.subfield = function(code, val) {
	return this._subfield(code, val);
}

Field.prototype.hasSubfield = function(code) {
	return this._hasSubfield(code);
}

Field.prototype.tagnumber = function() {
	return this._tagnumber();
}

Field.prototype.indicator = function(num, val) {
	return this._indicator(num, val);
}

Field.prototype.indicators = function() {
	return this._indicators();
}


function Subfield(code, value) {
	var that = this;
	that.code = code;
	that.value = value;
}

Subfield.prototype.setCode = function(code) {
	this.code = code;
}

Subfield.prototype.getCode = function(code) {
	return this.code;
}

Subfield.prototype.setValue = function(value) {
	this.value = value;
}

Subfield.prototype.getValue = function(value) {
	return this.value;
}


// Object -> marc editor wrapper
function MarcEditor(ffeditor, vareditor) {
	// private
	var that = this;
	var ffed = ffeditor;
	var vared = vareditor;
	var fieldlist = new Array();
	var fields = new Array();

	// inititalize
	createFieldList();
	createFields();

	// private methods
	function createFieldList() {
		$('.tag').each( function(i) {
			fieldlist.push($(this).get(0).id.substring(0,3));
		});
	}

	function createFields() {
		var editorfields = $('.tag');
		for( var i = 0; i < editorfields.length; i++) {
			var tagnumber = editorfields.eq(i).children('.tagnumber').eq(0).val();
			var id = editorfields[i].id;
			var ind1 = editorfields.eq(i).children('.indicator').eq(0).val();
			var ind2 = editorfields.eq(i).children('.indicator').eq(1).val();
			if( tagnumber < '010' ) {
				var value = editorfields.eq(i).children('.controlfield').val();	
				var newfield = new Field(tagnumber, ind1, ind2, [{code: '', value: value}]);
				fields.push(newfield);
			}
			else {
				var editorsubfields = $('[@id='+id+']').children('.subfields').children('.subfield');
				var subfields = new Array();
				for(var j = 0; j < editorsubfields.length; j++) {
					var code = editorsubfields.eq(j).children('.subfield-delimiter').val().substring(1);
					var value = editorsubfields.eq(j).children('.subfield-text').val();
					var newsf = new Subfield(code, value);
					subfields.push(newsf);
				}
				var newfield = new Field(tagnumber, ind1, ind2, subfields);
				fields.push(newfield);
			}
		}
	}

	// privileged methods
	this._getFieldList = function() {
		return fieldlist;
	}

	this._getFields = function() {
		return fields;
	}

	// privileged
	this._hasField = function(tagnumber) {
		if( fieldlist.indexOf(tagnumber) >= 0 ) {
			return true;
		}
		else {
			return false;
		}
	}

	this._fieldIndex = function(tagnumber) {
		return fieldlist.indexOf(tagnumber);
	}

	this._setValue = function(tag, subfield, value) {
		$('[@id^='+tag+']').children('.subfields').children('[@id*='+subfield+']').children('.subfield-text').val(value);
	}

	this._getValue = function(tag, subfield) {
		return $('[@id^='+tag+']').children('.subfields').children('[@id*='+subfield+']').children('.subfield-text').val();
	}

	this._rawFields = function() {
		return $('.tag');
	}

	this._rawField = function(tagnumber, i) {
		if( !Ext.isEmpty(i) ) {
			return $('.tag').filter('[@id*='+tagnumber+']').eq(i);
		}
		else {
			return $('.tag').filter('[@id*='+tagnumber+']');
		}
	}

	this._rawSubfields = function(tagnumber, i) {
		if( !Ext.isEmpty(i) ) {
			return $('.tag').filter('[@id*='+tagnumber+']').eq(i).children('.subfields').children('.subfield');
		}
		else {
			return $('.tag').filter('[@id*='+tagnumber+']').children('.subfields').children('.subfield');
		}
	}

	this._addField = function(tag, ind1, ind2, subfields) {
		addField(tag, ind1, ind2, subfields);
	}

	this._deleteField = function(tagnumber, i) {
		removeTag(tagnumber, i);
	}

	this._addSubfield = function(tag, subfield, value) {
		// get last subfield in this tag
		var numsf = $('[@id^='+tag+']').children('.subfields').children('.subfield').length;
		var lastsf = $('[@id^='+tag+']').children('.subfields').children('.subfield').eq(numsf-1).children('.subfield-text');
		// add a subfield after it
		addSubfield(lastsf);
		// now set its delimiter to the passed in subfield code
		var oldval = $(lastsf).parents('.subfield').next().children('.subfield-delimiter').val();
		$(lastsf).parents('.subfield').next().children('.subfield-delimiter').val(oldval+subfield);
		if(value) {
			// set its value to pass in param
			$(lastsf).parents('.subfield').next().children('.subfield-text').val(value);
		}
		// focus the new subfield-text
		$(lastsf).parents('.subfield').next().children('.subfield-text').focus();
	}

	this._deleteSubfield = function(tag, subfield) {
		var sf = $('[@id^='+tag+']').children('.subfields').children('[@id*='+subfield+']').children('.subfield-text');
		UI.editor.lastFocusedEl = sf;
		removeSubfield();
	}

	this._focusTag = function(tag) {
		$('[@id^='+tag+']').children('.tagnumber').focus();
	}

	this._focusSubfield = function(tag, subfield) {
		$('[@id^='+tag+']').children('.subfields').children('[@id*='+subfield+']').children('.subfield-text').focus();
	}

}

// Public methods 
MarcEditor.prototype.getValue = function(tag, subfield) {
	return this._getValue(tag, subfield);
}

MarcEditor.prototype.setValue = function(tag, subfield, value) {
	this._setValue(tag, subfield, value);
}

MarcEditor.prototype.deleteSubfield = function(tag, subfield) {
	this._deleteSubfield(tag, subfield);
}

MarcEditor.prototype.addSubfield = function(tag, subfield, value) {
	this._addSubfield(tag, subfield, value);
}

MarcEditor.prototype.focusTag = function(tag) {
	this._focusTag(tag);
}

MarcEditor.prototype.focusSubfield = function(tag, subfield) {
	this._focusSubfield(tag, subfield);
}

MarcEditor.prototype.addField = function(tag, ind1, ind2, subfields) {
	this._addField(tag, ind1, ind2, subfields);
}

MarcEditor.prototype.deleteField = function(tagnumber, i) {
	this._deleteField(tagnumber, i);
}

MarcEditor.prototype.getFieldList = function() {
	return this._getFieldList();
}


MarcEditor.prototype.hasField = function(tagnumber) {
	return this._hasField(tagnumber);
}

MarcEditor.prototype.fieldIndex = function(tagnumber, i) {
	return this._fieldIndex(tagnumber, i);
}

MarcEditor.prototype.rawSubfields = function(tagnumber, i) {
	return this._rawSubfields(tagnumber, i);
}

MarcEditor.prototype.rawField = function(tagnumber, i) {
	return this._rawField(tagnumber, i);
}

MarcEditor.prototype.rawFields = function() {
	return this._rawFields();
}

MarcEditor.prototype.getFields = function() {
	return this._getFields();
}

