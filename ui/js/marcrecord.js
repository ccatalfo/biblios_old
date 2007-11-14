function Field(tagnumber, indicator1, indicator2, subfields) {
	var that = this;
	var tagnumber = tagnumber;
	var indicators = new Array(indicator1, indicator2);
	var subfields = subfields;

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
			marcxml.appendChild(record);
			var lv = marcxml.createTextNode( subfields[0].value );
			leader.appendChild(lv);
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
}

Field.prototype.XML = function() {
	return this._XML();
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



function MarcRecord(ffeditor, vareditor) {
	// private
	var that = this;
	var ffed = ffeditor;
	var vared = vareditor;
	var fields = new Array();

	// inititalize
	createFieldList();

	// private methods
	function createFieldList() {
		$('.tag').each( function(i) {
			fields.push($(this).get(0).id.substring(0,3));
		});
	}

	// privileged methods
	this._getFields = function() {
		return fields;
	}

	// privileged
	this._hasField = function(tagnumber) {
		if( fields.indexOf(tagnumber) >= 0 ) {
			return true;
		}
		else {
			return false;
		}
	}

	this._fieldIndex = function(tagnumber) {
		return fields.indexOf(tagnumber);
	}

	this._setValue = function(tag, subfield, value) {
		$('[@id^='+tag+']').children('.subfields').children('[@id*='+subfield+']').children('.subfield-text').val(value);
	}

	this._getValue = function(tag, subfield) {
		return $('[@id^='+tag+']').children('.subfields').children('[@id*='+subfield+']').children('.subfield-text').val();
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
MarcRecord.prototype.getValue = function(tag, subfield) {
	return this._getValue(tag, subfield);
}

MarcRecord.prototype.setValue = function(tag, subfield, value) {
	this._setValue(tag, subfield, value);
}

MarcRecord.prototype.deleteSubfield = function(tag, subfield) {
	this._deleteSubfield(tag, subfield);
}

MarcRecord.prototype.addSubfield = function(tag, subfield, value) {
	this._addSubfield(tag, subfield, value);
}

MarcRecord.prototype.focusTag = function(tag) {
	this._focusTag(tag);
}

MarcRecord.prototype.focusSubfield = function(tag, subfield) {
	this._focusSubfield(tag, subfield);
}

MarcRecord.prototype.addField = function(tag, ind1, ind2, subfields) {
	this._addField(tag, ind1, ind2, subfields);
}

MarcRecord.prototype.deleteField = function(tagnumber, i) {
	this._deleteField(tagnumber, i);
}

MarcRecord.prototype.getFields = function() {
	return this._getFields();
}


MarcRecord.prototype.hasField = function(tagnumber) {
	return this._hasField(tagnumber);
}

MarcRecord.prototype.fieldIndex = function(tagnumber) {
	return this._fieldIndex(tagnumber);
}
