function Field(tagnumber, indicator1, indicator2, subfields) {
	var that = this;
	var tagnumber = tagnumber;
	var ind1 = indicator1;
	var ind2 = indicator2;
	var subfields = subfields;

}

Field.prototype.indicator = function(num, val) {

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

	// privileged
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

