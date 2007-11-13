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
		$('[@id^='+tag+']').children('.subfields').children('[@id*='+subfield+']').children('.subfield-text').val();
	}

	this._addSubfield = function(tag, subfield) {
		
		UI.editor.lastFocusedEl = '';
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
	this._getValue(tag, subfield);
}

MarcRecord.prototype.setValue = function(tag, subfield, value) {
	this._setValue(tag, subfield, value);
}

MarcRecord.prototype.deleteSubfield = function(tag, subfield) {
	this._deleteSubfield(tag, subfield);
}

MarcRecord.prototype.addSubfield = function(tag, subfield) {
	this._addSubfield(tag, subfield);
}

MarcRecord.prototype.focusTag = function(tag) {
	this._focusTag(tag);
}

MarcRecord.prototype.focusSubfield = function(tag, subfield) {
	this._focusSubfield(tag, subfield);
}

