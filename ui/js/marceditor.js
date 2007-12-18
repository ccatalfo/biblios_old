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
		// make sure we start w/ empty arrays
		fields.length = 0;
		fieldlist.length = 0;
		var editorfields = $('.tag');
		for( var i = 0; i < editorfields.length; i++) {
				var newfield = createField( $(editorfields).eq(i) );
				fields.push(newfield);
				fieldlist.push( $(editorfields).get(i).id.substring(0,3));
		}
		marcrecord = new MarcRecord(fields);
	}
	
	function createField(elem) {
		var newfield;
		var tagnumber = $(elem).children('.tagnumber').eq(0).val();
		var id = $(elem).get(0).id;
		var ind1 = $(elem).children('.indicator').eq(0).val();
		var ind2 = $(elem).children('.indicator').eq(1).val();
		if( tagnumber < '010' ) {
			var value = $(elem).children('.controlfield').val();	
			newfield = new Field(tagnumber, ind1, ind2, [{code: '', value: value}]);
		}
		else {
			var editorsubfields = $('[@id='+id+']').children('.subfields').children('.subfield');
			var subfields = new Array();
			for(var j = 0; j < editorsubfields.length; j++) {
				var code = editorsubfields.eq(j).find('.subfield-delimiter').val().substring(1);
				var value = editorsubfields.eq(j).find('.subfield-text').val();
				var newsf = new Subfield(code, value);
				subfields.push(newsf);
				newfield = new Field(tagnumber, ind1, ind2, subfields);
			}
		}
		return newfield;
	}

	function update(elem) {
		// if we're passed a single element, just update that one
		if( elem ) {
			// get the tagnumber to update var tagnumber = $(elem).parents('.tag').children('.tagnumber').val();
			// replace with this tag
			var tag = $(elem).parents('.tag');
			var tagnumber = $(elem).parents('.tag').find('.tagnumber').val();
			// loop through fields in this marceditor instance, replacing the one whose tagnumber
			// we're modifying
			for( var i = 0; i < fields.length; i++) {
				if( fields[i].tagnumber() == tagnumber ) {
					fields[i] = createField(tag); 		
				}
			}
		}
		// otherwise update them all
		else {
			createFields();
		}
		//update marcrecord instance
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
		if( this._hasField(tagnumber) ) {
			return this._getField(tagnumber).hasSubfield(subfieldcode);
		}
		else {
			return false;
		}
	}

	this._fieldIndex = function(tagnumber) {
		return fieldlist.indexOf(tagnumber);
	}

	this._setValue = function(tag, subfield, value) {
		$('[@id^='+tag+']').children('.subfields').children('[@id*='+subfield+']').find('.subfield-text').val(value);
		update();
	}

	this._getValue = function(tag, subfield) {
		if( subfield != null ) {
			return $('[@id^='+tag+']').children('.subfields').children('[@id*='+subfield+']').find('.subfield-text').val();
		}
		else {
			return $('[@id^='+tag+']').children('.controlfield').val();
		}
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

	this._addField = function(tagnumber, ind1, ind2, subfields) {
		if( tagnumber ) {
			doAddField(tagnumber, ind1, ind2, subfields);
		}
		else {
			Ext.MessageBox.prompt('Add tag', 'Choose a tag number', function(btn, tagnumber) {
				doAddField(tagnumber);
			});
		}
		function doAddField(tagnumber, ind1, ind2, subfields) {
			var firstind = ind1 || '#';
			var secondind = ind2 || '#';
			var sf = subfields || [ {'delimiter': 'a', 'text': ''} ];
			if(debug) { console.info("Adding tag with tagnumber: " + tagnumber);  }; 

			// insert the new field in numerical order among the existing tags
			var tags = $(".tag", UI.editor.doc );
			var tagToInsertAfter; // the tag just before where we'll insert the new tag
			var highestSuffix = 1; // highest number appended to tag id's with this tag number.  Add 1 to it to get suffix for new tag
			var newSuffix = 1;
			for( var i = 0; i<tags.length; i++) {
				var id = $(tags[i]).attr('id').substr(0,3);
				if( id < tagnumber) {
					tagToInsertAfter = tags[i];
				}
				// get a new suffix number for our new tags id
				else if( id == tagnumber ) {
					var currSuffix = $(tags[i]).attr('id').substr(3);
					if( currSuffix > highestSuffix ) {
						highestSuffix = currSuffix;
					} 
				}
			}
			newSuffix = highestSuffix + 1;
			var newId = tagnumber + "-" + newSuffix;
			  var newtag = '<div class="tag" id="'+newId+'">';
			  newtag += '<input class="tagnumber" id="d'+tagnumber+'" value="'+tagnumber+'" />';
			  newtag += '<input size="2" class="indicator" value="'+firstind+'" id="dind1'+newId+'"/>';
			  newtag += '<input size="2" class="indicator" value="'+secondind+'" id="dind2'+newId+'"/>';
			  newtag += '<span class="subfields" id="dsubfields'+newId+'">';
			  for( var i = 0; i< sf.length; i++) {
				  newtag += '<span class="subfield" id="'+tagnumber+newId+'">';
				  newtag += '<input class="subfield-delimiter" maxlength="2" size="2" value="&Dagger;'+sf[i]['delimiter']+'">';
				  var textlength = sf[i]['text'].length;
				  newtag += '<input id="'+tagnumber+newId+i+'text"class="subfield-text" size="'+textlength+'" value="'+sf[i]['text']+'">';
				}
			// insert out new tag after the tag we just found
			$(tagToInsertAfter, UI.editor.doc).after(newtag);
			update();
			// set the focus to this new tag
			//$( newId ).get(0).focus();
		}
	}

	this._deleteField = function(tagnumber, i) {
		if( tagnumber ) {
			// remove  the ith tagnumber if we were passed an i
			if( !Ext.isEmpty(i) ) {
				$('.tag').filter('[@id*='+tagnumber+']').eq(i).remove();
			}
			// else remove all!
			else {
				$('.tag').filter('[@id*='+tagnumber+']').remove();
			}
			update();
		}
		else {
			// focus previous or next tag
			var prev = $(UI.editor.lastFocusedEl).parents('.tag').prev().children('.tagnumber');
			var next = $(UI.editor.lastFocusedEl).parents('.tag').next().children('.tagnumber');
			$(UI.editor.lastFocusedEl).parents('.tag').remove();
			update();
			if( $(next).length ) {
				$(next).focus();
			}
			else {
				$(prev).focus();
			}
		}
	}

	this._addSubfield = function(tag, subfield, value) {
		// get last subfield in this tag
		var numsf = $('[@id^='+tag+']').find('.subfield-text').length;
		var lastsf = $('[@id^='+tag+']').find('.subfield-text').eq(numsf-1);
		// add a subfield after it
		addSubfield(lastsf);
		// now set its delimiter to the passed in subfield code
		var oldval = $(lastsf).parents('.subfield').next().children('.subfield-delimiter').val();
		$(lastsf).parents('.subfield').next().children('.subfield-delimiter').val(oldval+subfield);
		if(value) {
			// set its value to pass in param
			$(lastsf).parents('.subfield').next().children('.subfield-text').val(value);
		}
		update();
		// focus the new subfield-text
		$(lastsf).parents('.subfield').next().children('.subfield-text').focus();
	}

	this._deleteSubfield = function(tag, subfield) {
		var sf = $('[@id^='+tag+']').children('.subfields').children('[@id*='+subfield+']').children('.subfield-text');
		UI.editor.lastFocusedEl = sf;
		removeSubfield();
		update();
	}

	this._deleteSubfields = function(tag) {
		$('[@id^='+tag+']').children('.subfields').find('.subfield').remove();
		update();
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

	this._update = function(elem) {
		update(elem);
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

MarcEditor.prototype.deleteSubfields = function(tag) {
	this._deleteSubfields(tag);
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

MarcEditor.prototype.update = function(elem) {
	return this._update(elem);
}
