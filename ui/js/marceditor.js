// Object -> marc editor wrapper
function createFixedFieldCell(string, elem, offset) {
	var html = '';
	var name = $(elem).attr('name');
	var position = $(elem).attr('position') - offset;
	var length = $(elem).attr('length');
	var inputtype = $(elem).attr('inputtype');
	html += '<td>';
	html += name;
	html += '</td>';
	html += '<td>';
	var value = string.substr(position, length);	
	if( inputtype == 'textbox' ) {
		html += '<input type="text" size="'+value.length+'" class="fixedfield" value="'+value+'">';
	}
	else if (inputtype == 'menulist' || inputtype == 'menubox') {
		html += '<select>';
		$('option', elem).each( function(j) {
			if( $(this).text() == value ) {
				html += '<option selected>';
			}
			else {
				html += '<option>';
			}
			html += $(this).text()+'</option>';
		});
		html += '</select>';
	}
	return html;
} // createFixedFieldCell

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
		$('.tag', vared).each( function(i) {
			fieldlist.push($(this).get(0).id.substring(0,3));
		});
	}

	function createFields() {
		// make sure we start w/ empty arrays
		fields.length = 0;
		fieldlist.length = 0;
		var editorfields = $('.tag', vared);
		for( var i = 0; i < editorfields.length; i++) {
				var newfield = createField( $(editorfields).eq(i) );
				fields.push(newfield);
				fieldlist.push( $(editorfields).get(i).id.substring(0,3));
		}
		marcrecord = new MarcRecord(fields);
	}
	
	function createField(elem) {
		var newfield;
		var tagnumber = $(elem).children('.tagnumber', vared).eq(0).val();
		var id = $(elem).get(0).id;
		var ind1 = $(elem).children('.indicator', vared).eq(0).val();
		var ind2 = $(elem).children('.indicator', vared).eq(1).val();
		if( tagnumber < '010' ) {
			var value = $(elem).children('.controlfield', vared).val();	
			newfield = new Field(tagnumber, ind1, ind2, [{code: '', value: value}]);
		}
		else {
			var editorsubfields = $('[@id='+id+']', vared).children('.subfields').children('.subfield');
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
			return $('[@id^='+tag+'] .'+subfield+' .subfield-text', vared).val();
		}
		else {
			return $('[@id^='+tag+']').children('.controlfield', vared).val();
		}
	}

	this._rawFields = function() {
		return $('.tag', vared);
	}

	this._rawField = function(tagnumber, i) {
		if( !Ext.isEmpty(i) ) {
			return $('.tag', vared).filter('[@id*='+tagnumber+']').eq(i);
		}
		else {
			return $('.tag', vared).filter('[@id*='+tagnumber+']');
		}
	}

	this._rawSubfields = function(tagnumber, i) {
		if( !Ext.isEmpty(i) ) {
			return $('.tag', vared).filter('[@id*='+tagnumber+']').eq(i).children('.subfields').children('.subfield');
		}
		else {
			return $('.tag', vared).filter('[@id*='+tagnumber+']').children('.subfields').children('.subfield');
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
			var tags = $(".tag",vared  );
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
			  newtag += '<input size="3" onblur="onBlur(this)" onfocus="onFocus(this)" class="tagnumber" id="d'+tagnumber+'" value="'+tagnumber+'" />';
			  newtag += '<input size="1" onblur="onBlur(this)" onfocus="onFocus(this)" size="2" class="indicator" value="'+firstind+'" id="dind1'+newId+'"/>';
			  newtag += '<input size="1" onblur="onBlur(this)" onfocus="onFocus(this)" size="2" class="indicator" value="'+secondind+'" id="dind2'+newId+'"/>';
			  newtag += '<span class="subfields" id="dsubfields'+newId+'">';
			  for( var i = 0; i< sf.length; i++) {
				  newtag += '<span class="subfield" id="dsubfields'+tagnumber+newId+'">';
				  newtag += '<input onblur="onBlur(this)" onfocus="onFocus(this)" class="subfield-delimiter" maxlength="2" size="2" value="&Dagger;'+sf[i]['delimiter']+'">';
				  var textlength = sf[i]['text'].length;
				  newtag += '<input id="dsubfields'+newId+i+'text" onfocus="onFocus(this)" onblur="onBlur(this)" class="subfield-text" size="'+textlength+'" value="'+sf[i]['text']+'">';
				}
			// insert out new tag after the tag we just found
			$(tagToInsertAfter, vared).after(newtag);
			update();
			// set the focus to this new tag
			//$( newId ).get(0).focus();
		}
	}

	this._deleteField = function(tagnumber, i) {
		if( tagnumber ) {
			// remove  the ith tagnumber if we were passed an i
			if( !Ext.isEmpty(i) ) {
				$('.tag', vared).filter('[@id*='+tagnumber+']').eq(i).remove();
			}
			// else remove all!
			else {
				$('.tag', vared).filter('[@id*='+tagnumber+']').remove();
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
	
	this._getIndexOf = function(elem) {
		var id = $(elem).get(0).id;
		var tagnumber = id.substr(0,3);
		// find all tags with this tagnumber
		var tags = $("div[@id^="+tagnumber+"]", vared);
		for( var i = 0; i < tags.length; i++ ) {
			if( tags.get(i).id == id ) {
				return i;
			}
		}
	}

	this._addSubfield = function(tag, index, subfield, value) {
		// get last subfield in this tag
		var numsf = $('div[@id^='+tag+']', vared).eq(index).find('.subfield-text').length;
		var lastsf = $('div[@id^='+tag+']', vared).eq(index).find('.subfield-text').eq(numsf-1);
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

	this._deleteSubfield = function(tag, index, subfield) {
		var sf = $('[@id^='+tag+']', vared).children('.subfields').children('[@id*='+subfield+']').children('.subfield-text');
		UI.editor.lastFocusedEl = sf;
		removeSubfield();
		update();
	}

	this._deleteSubfields = function(tag) {
		$('[@id^='+tag+']', vared).children('.subfields').find('.subfield').remove();
		update();
	}

	this._focusTag = function(tag) {
		$('[@id^='+tag+']', vared).children('.tagnumber').focus();
	}

	this._focusSubfield = function(tag, subfield) {
		$('[@id^='+tag+']', vared).children('.subfields').children('[@id*='+subfield+']').children('.subfield-text').focus();
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

	this._loadXml = function(marcXmlDoc) {
		var html = '';
		html += '<div class="ffeditor">';
		html += '<div id="fixedfields_editor">';
		html += '<table id="fixed_field_grid">';
		// leader
		var string = $('leader', marcXmlDoc).text();
		html += '<tr>';
		$('field[@tag=000] value', marc21defs).each( function(i) {
			html += createFixedFieldCell(string, $(this));
		});
		//end leader row
		html += '</tr>';
		// 008 row
		var tag008 = $('controlfield[@tag=008]', marcXmlDoc).text();
		var rectype = $('leader', marcXmlDoc).text().substr(6,1);
		html += '<tr>';
		$('mattypes mattype[@value=All] position', marc21defs).each( function(i) {
			var type = $(this).text();
			$('field[@tag=008] value[@name='+type+']', marc21defs).each( function(j) {
				html += createFixedFieldCell(tag008, $(this) );
			});
		});
		html += '</tr>';
		// material specific 008 row
		html += '<tr>';
		var mattype = '';
		if( rectype == 'a' || rectype == 't' ) {
			mattype = 'Books';
		}
		if( rectype == 'm' ) {
			mattype = 'ComputerFile';
		}
		if( rectype == 'e' || rectype == 'f' ) {
			mattype = 'Maps';
		}
		if( rectype == 'c' || rectype == 'd' || rectype == 'j' || rectype == 'i') {
			mattype = 'Music';
		}
		if( rectype == 'g' || rectype == 'k' || rectype == 'o' || rectype == 'r') {
			mattype = 'Visual';
		}
		if( rectype == 'p' ) {
			mattype = 'Mixed';
		}
			$('mattypes mattype[@value='+mattype+'] position', marc21defs).each( function(i) {
				var type = $(this).text();
				$('field[@tag=008] value[@name='+type+']', marc21defs).each( function(j) {
					html += createFixedFieldCell(tag008, $(this) , 0);
				});
			});
		html += '</tr>';

		// 006 row
		if( $('controlfield[@tag=006]', marcXmlDoc).length > 0 ) {
			html += '<tr>';
			var mattype = '';
			if( rectype == 'a' || rectype == 't' ) {
				mattype = 'Books';
			}
			if( rectype == 'm' ) {
				mattype = 'ComputerFile';
			}
			if( rectype == 'e' || rectype == 'f' ) {
				mattype = 'Maps';
			}
			if( rectype == 'c' || rectype == 'd' || rectype == 'j' || rectype == 'i') {
				mattype = 'Music';
			}
			if( rectype == 'g' || rectype == 'k' || rectype == 'o' || rectype == 'r') {
				mattype = 'Visual';
			}
			if( rectype == 'p' ) {
				mattype = 'Mixed';
			}
			$('mattypes mattype[@value='+mattype+'] position', marc21defs).each( function(i) {
				var type = $(this).text();
				$('field[@tag=006] value[@name='+type+']', marc21defs).each( function(j) {
					html += createFixedFieldCell(tag006, $(this) , 17);
				});
			});
			html += '</tr>'; // end 006 row
		}
		// 007 row
		if( $('controlfield[@tag=007]', marcXmlDoc ).length > 0 )  {
			html += '<tr>';
			var cat = $('controlfield[@tag=007]', marcXmlDoc).text().substr(0,1);
			var tag007 = $('controlfield[@tag=007]', marcXmlDoc).text();
			var mattype = '';
			if( cat == 'a' ) {
				mattype = 'MAP';
			}
			if( cat == 'c' ) {
				mattype = 'ELECTRONIC';
			}
			if( cat == 'd' ) {
				mattype = 'GLOBE';
			}
			if( cat == 'f' ) {
				mattype = 'TACTILE';
			}
			if( cat == 'g' ) {
				mattype = 'PROJECTED';
			}
			if( cat == 'h' ) {
				mattype = 'MICROFORM';
			}
			if( cat == 'k' ) {
				mattype = 'NONPROJECTED';
			}
			if( cat == 'm' ) {
				mattype = 'MOTION';
			}
			if( cat == 'o' ) {
				mattype = 'KIT';
			}
			if( cat == 'q' ) {
				mattype = 'NOTATED';
			}
			if( cat == 'r' ) {
				mattype = 'REMOTE';
			}
			if( cat == 's' ) {
				mattype = 'SOUND';
			}
			if( cat == 't' ) {
				mattype = 'TEXT';
			}
			if( cat == 'v' ) {
				mattype = 'VIDEORECORDING';
			}
			if( rectype == 'z' ) {
				mattype = 'UNSPECIFIED';
			}
			// find field def for this 007 mat type
			$('field[@tag=007][@mattype='+mattype+']', marc21defs).each( function(i) {
				$('value', this).each( function(j) {
					html += createFixedFieldCell(tag007, $(this) , 0);
				}); // loop through positions in 007

			});

			html += '</tr>';
		}
		html += '</table>';
		html += '</div>'; // close fixedfields_editor
		html += '</div>'; // close ff_editor
		var leader = $('leader', marcXmlDoc).text();
		html += '<div class="leader" class="controlfield" id="leader"><input type="text" class="tagnumber" value="000"><input type="text" class="indicator" value="#"><input type="text" class="indicator" value="#"><input class="controlfield" type="text" value="'+leader+'"></div>';

		html += '<div class="vareditor">';
		html += '<div id="varfields_editor">';
		$('controlfield', marcXmlDoc).each( function(i) {
			val = $(this).text();
			tag = $(this).attr('tag');
			html += '<div class="tag controlfield ';
			html += tag
			html += '"';
			html += '>';
			html += '<input maxlength="3" onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="tagnumber" value="'+tag+'">';
			html += '<input maxlength="1" onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="indicator" value="'+'#'+'">';
			html += '<input maxlength="1" onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="indicator" value="'+'#'+'">';
			html += '<input onblur="onBlur(this)" onfocus="onFocus(this)" ';
			html += 'type="text" '; 
			html += 'value="'+val+'" ';
			html += 'class="controlfield ';
			html += tag;
			html += '"';
			html += '>';
			html += '</div>';
			fields.push( new Field(tag, '', '', [{code: '', value: val}]) );
		});	

		$('datafield', marcXmlDoc).each(function(i) {
			var val = $(this).text();
			var tag = $(this).attr('tag');
			var ind1 = $(this).attr('ind1') || ' ';
			var ind2 = $(this).attr('ind2') || ' ';
			var id = tag+'-'+i;
			html += '<div class=" tag datafield ';
			html += tag;
			html += '" ';
			html += 'id="'+id+'"';
			html += '>';
			html += '<input maxlength="3" onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="tagnumber" value="'+tag+'">';
			html += '<input maxlength="1" onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="indicator" value="'+ind1+'">';
			html += '<input maxlength="1" onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="indicator" value="'+ind2+'">';
			
			var id = tag+'-'+i;
			html += '<span class="subfields" id="'+id+'">';
			var subfields = new Array();
			$('subfield', this).each(function(j) {
				var sfval = $(this).text();
				var sfcode = $(this).attr('code');
				subfields.push( new Subfield(sfcode, sfval) );
				var sfid = 'dsubfields'+tag+'-'+i;
				html += '<span class="subfield '+sfcode+'" id="'+sfid+'">';
				html += '<input maxlength="2" onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="subfield-delimiter" value="&#8225;'+sfcode+' ">';
				html += '<input onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="subfield-text" value="'+sfval+' ">';
				// close subfield span
				html += '</span>';
			});
				// close subfields span
			html + '</span>';
			html += '</div>'; // close datafield div	
			fields.push( new Field(tag, ind1, ind2, subfields) );
		});
		html += '</div>'; // end vareditor div
		html += '</div>'; // varfields_editor div
		marcrecord = new MarcRecord(fields);
		return html;
	}

}
// Public methods 
MarcEditor.prototype.getValue = function(tag, subfield) {
	return this._getValue(tag, subfield);
}

MarcEditor.prototype.setValue = function(tag, subfield, value) {
	this._setValue(tag, subfield, value);
}

MarcEditor.prototype.deleteSubfield = function(tag, index, subfield) {
	this._deleteSubfield(tag, index, subfield);
}

MarcEditor.prototype.deleteSubfields = function(tag) {
	this._deleteSubfields(tag);
}

MarcEditor.prototype.addSubfield = function(tag, index, subfield, value) {
	this._addSubfield(tag, index, subfield, value);
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

MarcEditor.prototype.getIndexOf = function(elem) {
	return this._getIndexOf(elem);
}

MarcEditor.prototype.loadXml = function(xmldoc) {
	return this._loadXml(xmldoc);
}

MarcEditor.prototype.editorHtml = function() {
	return this.html;
}

