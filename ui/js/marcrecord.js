function MarcRecord(ffeditor, vareditor) {
	// private
	var that = this;
	var ffed = ffeditor;
	var vared = vareditor;

	// privileged
	this._updateEditor = function(tag, subfield, value) {
		$('[@id^='+tag+']').children('.subfields').children('[@id*='+subfield+']').children('.subfield-text').val(value);

	}

	this._focusTag = function(tag) {
		$('[@id^='+tag+']').children('.tagnumber').focus();
	}

	this._focusSubfield = function(tag, subfield) {
		$('[@id^='+tag+']').children('.subfields').children('[@id*='+subfield+']').children('.subfield-text').focus();
	}

}

MarcRecord.prototype.update = function(tag, subfield, value) {
	this._updateEditor(tag, subfield, value);
}

MarcRecord.prototype.focusTag = function(tag) {
	this._focusTag(tag);
}

MarcRecord.prototype.focusSubfield = function(tag, subfield) {
	this._focusSubfield(tag, subfield);
}

