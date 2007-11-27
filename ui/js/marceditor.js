// Object -> marc editor wrapper
function MarcEditor(ffeditor, vareditor) {
	// private
	var that = this;
	var ffed = ffeditor;
	var vared = vareditor;
	var fieldlist = new Array();
	var fields = new Array();
	var marcrecord = null;

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
		marcrecord = new MarcRecord(fields);
	}

	// privileged methods
	this._getFieldList = function() {
		return fieldlist;
	}

	this._getFields = function() {
		return fields;
	}

	this._getField = function(tagnumber) {
		for ( f in fields ) {
			if( fields[f].tagnumber() == tagnumber ) {
				return fields[f];
			}
		}
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
	
	this._hasFieldAndSubfield = function(tagnumber, subfieldcode) {
		return this._getField(tagnumber).hasSubfield(subfieldcode);
	}

	this._hasFieldAndSubfield = function(tagnumber, subfieldcode) {
		return this._getField(tagnumber).hasSubfield(subfieldcode);
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
	
	this._XML = function() {
		return marcrecord.XML();
	}

	this._XMLString = function() {
		return marcrecord.XMLString();
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

MarcEditor.prototype.hasFieldAndSubfield = function(tagnumber, subfieldcode) {
	return this._hasFieldAndSubfield(tagnumber, subfieldcode);
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

MarcEditor.prototype.getField = function(tagnumber) {
	return this._getField(tagnumber);
}

MarcEditor.prototype.XML = function() {
	return this._XML();
}

MarcEditor.prototype.XMLString = function() {
	return this._XMLString();
}
