// Object -> marc editor wrapper
function createFixedFieldCell(string, elem, offset, tag) {
	var name = $(elem).attr('name');
	var position = $(elem).attr('position') - offset;
	var length = $(elem).attr('length');
	var inputtype = $(elem).attr('inputtype');
	var hidden = $(elem).attr('hidden');
	var html = '';
	html += '<td';
	if( inputtype == 'hidden' || inputtype == 'blank' ) {
		html += ' style="display:none;"';
	}
	html += '>';
	html += name;
	html += '</td>';
	html += '<td';
	if( inputtype == 'hidden' || inputtype == 'blank' ) {
		html += ' style="display:none;"';
	}
	html += '>';
	var value = string.substr(position, length);	
	// fix ctry codes which can be 2 chars instead of 3
	if( name == 'Ctry' ) {
		if (value.substr(2,1) == ' ' ) {
			value = value.substr(0,2);
		}
	}
	if( inputtype == 'textbox' ) {
		html += '<input id="'+name+'" type="text" onclick="showTagHelp(this)" onblur="onFixedFieldEditorBlur(this)" maxlength="'+value.length+'" size="'+value.length+'" class="fixedfield '+tag+'" value="'+value+'">';
	}
	else if(inputtype == 'blank' ) {
		value = '';
		for( var k = 0; k < length; k++) {
			value += ' ';
		}
		html += '<input id="'+name+'" size="'+length+'" maxlength="'+length+'" onclick="showTagHelp(this)" style="display: none;" class="fixedfield '+tag+'" type="text" value="'+value+'">';
	}
	else if(inputtype == 'hidden') {
		html += '<input id="'+name+'" size="'+length+'" maxlength="'+length+'" class="fixedfield '+tag+'" style="display: none;" type="text" value="'+value+'">';
	}
	else if (inputtype == 'menulist' || inputtype == 'menubox') {
		html += '<select name="'+name+'" onclick="showTagHelp(this)" class="fixedfield '+tag+'" onblur="onFixedFieldEditorBlur(this)" id="'+name+'" >';
		$('option', elem).each( function(j) {
			if( $(this).text() == value ) {
				html += '<option selected value="'+$(this).text()+'">';

			}
			else {
				html += '<option value="'+$(this).text()+'">';
			}
			html += $(this).text()+'</option>';
		});
		html += '</select>';
	}
	html += '</td>';
	return html;
} // createFixedFieldCell

function MarcEditor(ffeditor, vareditor, editorid) {
	// private
	var that = this;
	var ffed = ffeditor;
	var vared = vareditor;
    var editorid = editorid;
	var htmled = '';	
	var lastFocusedEl;
	var currFocusedEl;
	var fieldlist = new Array();
	var fields = new Array();
	var marcrecord = null;

	// private methods
	function createFieldList() {
		for( var i = 0; i<fields.length; i++) {
			fieldlist.push( fields[i].tagnumber() );
		}
	}

	function createFields() {
		// make sure we start w/ empty arrays
		fields.length = 0;
		fieldlist.length = 0;
		var editorfields = $('.tag', UI.editor[editorid].vared);
		for( var i = 0; i < editorfields.length; i++) {
				var newfield = createField( $(editorfields).eq(i) );
				fields.push(newfield);
				fieldlist.push( $(editorfields).get(i).id.substring(0,3));
		}
		marcrecord = new MarcRecord(fields);
	}
	
	function createField(elem) {
		var newfield;
		var tagnumber = $(elem).children('.tagnumber', UI.editor[editorid].vared).eq(0).val();
		var id = $(elem).get(0).id;
		var ind1 = $(elem).children('.indicator', UI.editor[editorid].vared).eq(0).val();
		var ind2 = $(elem).children('.indicator', UI.editor[editorid].vared).eq(1).val();
		if( tagnumber < '010' ) {
			var value = $(elem).children('.controlfield', UI.editor[editorid].vared).val();	
			newfield = new Field(tagnumber, ind1, ind2, [{code: '', value: value}]);
		}
		else {
			var editorsubfields = $('[@id='+id+']', UI.editor[editorid].vared).children('.subfields').children('.subfield');
			var subfields = new Array();
			for(var j = 0; j < editorsubfields.length; j++) {
				var code = editorsubfields.eq(j).find('.subfield-delimiter').val().substr(1, 1);
				var value = editorsubfields.eq(j).find('.subfield-text').val();
				var newsf = new Subfield(code, value);
				subfields.push(newsf);
				newfield = new Field(tagnumber, ind1, ind2, subfields);
			}
		}
		return newfield;
	}

	function update(elem) {
		createFields();
		//update marcrecord instance
		marcrecord = new MarcRecord(fields);
	}

	// privileged methods
	this._getFieldList = function() {
		return fieldlist;
	};

	this._getFields = function() {
		return fields;
	};

	this._getField = function(tagnumber) {
		for ( var i = 0; i < fields.length; i++ ) {
			if( fields[i].tagnumber() == tagnumber ) {
				return fields[i];
			}
		}
	};

	// privileged
	this._hasField = function(tagnumber) {
		if( fieldlist.indexOf(tagnumber) >= 0 ) {
			return true;
		}
		else {
			return false;
		}
	};
	
	this._hasFieldAndSubfield = function(tagnumber, subfieldcode) {
		if( this._hasField(tagnumber) ) {
			return this._getField(tagnumber).hasSubfield(subfieldcode);
		}
		else {
			return false;
		}
	};

	this._fieldIndex = function(tagnumber) {
		return fieldlist.indexOf(tagnumber);
	};

	this._setValue = function(tag, subfield, value) {
		$('[@id^='+tag+'] .'+subfield+' .subfield-text', UI.editor[editorid].vared).val(value);
		update();
	};

	this._getValue = function(tag, subfield) {
		if( subfield != null ) {
			return $('[@id^='+tag+'] .'+subfield+'.subfield-text', UI.editor[editorid].vared).val();
		}
		else {
			return $('[@id^='+tag+']').children('.controlfield', UI.editor[editorid].vared).val();
		}
	};

	this._rawFields = function() {
		return $('.tag', UI.editor[editorid].vared);
	};

	this._rawField = function(tagnumber, i) {
		if( !Ext.isEmpty(i) ) {
			return $('.tag', UI.editor[editorid].vared).filter('[@id*='+tagnumber+']').eq(i);
		}
		else {
			return $('.tag', UI.editor[editorid].vared).filter('[@id*='+tagnumber+']');
		}
	};

	this._rawSubfields = function(tagnumber, i) {
		if( !Ext.isEmpty(i) ) {
			return $('.tag', UI.editor[editorid].vared).filter('[@id*='+tagnumber+']').eq(i).children('.subfields').children('.subfield');
		}
		else {
			return $('.tag', UI.editor[editorid].vared).filter('[@id*='+tagnumber+']').children('.subfields').children('.subfield');
		}
	};

	this._addField = function(editorid, tagnumber, ind1, ind2, subfields) {
		if( tagnumber ) {
			doAddField(editorid, tagnumber, ind1, ind2, subfields);
		}
		else {
			Ext.MessageBox.prompt('Add tag', 'Choose a tag number', function(btn, tagnumber) {
				doAddField(editorid, tagnumber);
			});
		}
		function doAddField(editorid, tagnumber, ind1, ind2, subfields) {
			var firstind = ind1 || ' ';
			var secondind = ind2 || ' ';
			var sf = subfields || [ {'delimiter': 'a', 'text': ''} ];
			if(debug) { console.info("Adding tag with tagnumber: " + tagnumber);  }

			// insert the new field in numerical order among the existing tags
			var tags = $(".tag",UI.editor[editorid].vared  );
			var tagToInsertAfter; // the tag just before where we'll insert the new tag
			var highestSuffix = 1; // highest number appended to tag id's with this tag number.  Add 1 to it to get suffix for new tag
			var newSuffix = tags.length +1;
			for( var i = 0; i<tags.length; i++) {
				var id = $(tags[i]).attr('id').substr(0,3);
				if( id < tagnumber) {
					tagToInsertAfter = tags[i];
				}
			}
			var newId = tagnumber + "-" + newSuffix;
			  var newtag = '<div class="tag" id="'+newId+'">';
			  newtag += '<input size="3" onblur="onBlur(this)" onfocus="onFocus(this)" class="tagnumber" id="d'+tagnumber+'" value="'+tagnumber+'" />';
			  newtag += '<input size="1" onblur="onBlur(this)" onfocus="onFocus(this)" size="2" class="indicator" value="'+firstind+'" id="dind1'+newId+'"/>';
			  newtag += '<input size="1" onblur="onBlur(this)" onfocus="onFocus(this)" size="2" class="indicator" value="'+secondind+'" id="dind2'+newId+'"/>';
			if( tagnumber < '010' ) {
				newtag += '<input type="text" onblue="onBlur(this)" onfocus="onFocus(this)" class="controlfield '+tagnumber+'" value="">';
			} // insert controlfield
			else {
			  newtag += '<span class="subfields" id="dsubfields'+newId+'">';
			  for( var i = 0; i< sf.length; i++) {
				  newtag += '<span class="subfield" id="dsubfields'+tagnumber+newId+'">';
				  newtag += '<input onblur="onBlur(this)" onfocus="onFocus(this)" class="subfield-delimiter" maxlength="2" size="2" value="&Dagger;'+sf[i]['delimiter']+'">';
				  var textlength = sf[i]['text'].length;
				  newtag += '<input id="dsubfields'+newId+i+'text" onfocus="onFocus(this)" onblur="onBlur(this)" class="subfield-text" size="'+textlength+'" value="'+sf[i]['text']+'">';
				}
			} // insert datafield
			// insert out new tag after the tag we just found
			$(tagToInsertAfter, UI.editor[editorid].vared).after(newtag);
			update();
			// set the focus to this new tag
			//$( newId ).get(0).focus();
		}
	};

	this._deleteField = function(editorid, tagnumber, i) {
		//if(debug) { console.info('removing tag: ' + $(UI.editor.lastFocusedEl).parents('.tag').get(0).id)}
		if( tagnumber ) {
			// remove  the ith tagnumber if we were passed an i
			if( !Ext.isEmpty(i) ) {
				$('#'+editorid).find('.tag').filter('[@id*='+tagnumber+']').eq(i).remove();
			}
			// else remove all!
			else {
				$('#'+editorid).find('.tag').filter('[@id*='+tagnumber+']').remove();
			}
		}
		else {
			// focus previous or next tag
			var prev = $(UI.editor[editorid].lastFocusedEl).parents('.tag').slice(0,1).prev();
			var next = $(UI.editor[editorid].lastFocusedEl).parents('.tag').slice(0,1).next();
			$(UI.editor[editorid].lastFocusedEl).parents('.tag').slice(0,1).remove();
			if( $(next).length ) {
				$(next).get(0).focus();
				UI.editor[editorid].lastFocusedEl = $(next);
			}
			else if( $(prev).length ) {
				$(prev).get(0).focus();
				UI.editor[editorid].lastFocusedEl = $(prev);
			}
		}
		update();
	};
	
	this._getIndexOf = function(elem) {
		var id = $(elem).get(0).id;
		var tagnumber = id.substr(0,3);
		// find all tags with this tagnumber
		var tags = $("div[@id^="+tagnumber+"]", UI.editor[editorid].vared);
		for( var i = 0; i < tags.length; i++ ) {
			if( tags.get(i).id == id ) {
				return i;
			}
		}
	};

	this._addSubfield = function(editorid, tag, index, subfield, value) {
		// get last subfield in this tag
		var numsf = $('div[@id^='+tag+']', UI.editor[editorid].vared).eq(index).find('.subfield-text').length;
		var lastsf = $('div[@id^='+tag+']', UI.editor[editorid].vared).eq(index).find('.subfield-text').eq(numsf-1);
		var lastFocused = UI.editor[editorid].lastFocusedEl;
		// if we're adding tag w/ tagnumber via macro
		if( tag ) {
			var afterEl = lastsf;	
			 // get a new random id for the new elements
			 var newid="newsubfield-" + Math.floor(Math.random()*100);    
			$(afterEl).parents('.subfield').after("<span id='subfield-"+newid+"' class='subfield'><input onblur='onBlur(this)' onfocus='onFocus(this)' id='delimiter-"+newid+"' length='2' maxlength='2' class='subfield-delimiter' onblur='onBlur(this)' onfocus='onFocus(this)' value='&Dagger;'><input id='subfield-text-'"+newid+"' onfocus='onFocus(this)' onblur='onBlur(this)' class='subfield-text'></span>");
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
		// if we're just adding a sf w/ kb or toolbar tn
		else {
			var afterEl = lastFocused;	
			var newid="newsubfield-" + Math.floor(Math.random()*100);    
			$(afterEl).parents('.subfield').after("<span id='subfield-"+newid+"' class='subfield'><input onblur='onBlur(this)' onfocus='onFocus(this)' id='delimiter-"+newid+"' length='2' maxlength='2' class='subfield-delimiter' onblur='onBlur(this)' onfocus='onFocus(this)' value='&Dagger;'><input id='subfield-text-'"+newid+"' onfocus='onFocus(this)' onblur='onBlur(this)' class='subfield-text'></span>");
		}
		update();
	};

	this._deleteSubfield = function(editorid, tag, index, subfield) {
		if(debug) { console.info('removing subfield with text: ' + $(UI.editor.lastFocusedEl).val());}
		var next = $(UI.editor[editorid].lastFocusedEl).parents('.subfield').next().children('.subfield-delimiter');
		var prev = $(UI.editor[editorid].lastFocusedEl).parents('.subfield').prev().children('.subfield-delimiter');
		var ind2 = $(UI.editor[editorid].lastFocusedEl).parents('.tag').children('.indicator').eq(1);
		// remove current subfield
		$(UI.editor[editorid].lastFocusedEl).parents('.subfield').remove();
		// focus next subfield 
		if( $(UI.editor[editorid].lastFocusedEl).parents('.subfield').next().length )  {
			$(next).get(0).focus();	
			UI.editor[editorid].lastFocusedEl = $(next);
		}
		else if( $(UI.editor.lastFocusedEl).parents('.subfield').prev().length )  {
			$(prev).get(0).focus();
			UI.editor[editorid].lastFocusedEl = $(prev);
		}
		// or indicator
		else if( $(ind2).length) {
			$(ind2).get(0).focus();
			UI.editor[editorid].lastFocusedEl = $(ind2);
		}
		update();
	};

	this._deleteSubfields = function(tag) {
		$('[@id^='+tag+']', UI.editor[editorid].vared).children('.subfields').find('.subfield').remove();
		update();
	};

	this._focusTag = function(tag) {
		$('[@id^='+tag+']', UI.editor[editorid].vared).children('.tagnumber').focus();
	};

	this._focusSubfield = function(tag, subfield) {
		$('[@id^='+tag+']', UI.editor[editorid].vared).children('.subfields').children('[@id*='+subfield+']').children('.subfield-text').focus();
	};
	
	this._XML = function() {
		return marcrecord.XML();
	};

	this._XMLString = function() {
		return marcrecord.XMLString();
	};

	this._update = function(elem) {
		update(elem);
	};

	this._loadXml = function(marcXmlDoc) {
		var html = '';
		html += '<div class="ffeditor">';
		html += '<div id="fixedfields_editor">';
		html += '<table id="fixed_field_grid">';
		// leader
		var string = $('leader', marcXmlDoc).text();
		html += '<tr>';
		$('field[@tag=000] value', marc21defs).each( function(i) {
			html += createFixedFieldCell(string, $(this), 0, '000');
		});
		//UI.editor.progress.updateProgress(.2, 'Leader editor created');
		//end leader row
		html += '</tr>';
		// 008 row
		var tag008 = $('controlfield[@tag=008]', marcXmlDoc).text();
		var rectype = $('leader', marcXmlDoc).text().substr(6,1);
		var biblevel = $('leader', marcXmlDoc).text().substr(7,1);
		var mattype = get008MaterialName(rectype);
		// 008 row
		html += '<tr>';
		var cell = 0;
			$('mattypes mattype[@value='+mattype+'] position', marc21defs).each( function(i) {
				var type = $(this).text();
				$('field[@tag=008] value[@name='+type+']', marc21defs).each( function(j) {
					if( cell == 9 ) {
						html += '</tr><tr>';
					}
					html += createFixedFieldCell(tag008, $(this) , 0, '008');
					cell++;
				});
			});
		html += '</tr>';
		//UI.editor.progress.updateProgress(.3, '008 editor created');

		// 006 row
		if( $('controlfield[@tag=006]', marcXmlDoc).length > 0 ) {
			html += '<tr>';
			var mattype = get008MaterialName(rectype);	
			$('mattypes mattype[@value='+mattype+'] position', marc21defs).each( function(i) {
				var type = $(this).text();
				$('field[@tag=006] value[@name='+type+']', marc21defs).each( function(j) {
					html += createFixedFieldCell(tag006, $(this) , 17, '006');
				});
			});
			html += '</tr>'; // end 006 row
			//UI.editor.progress.updateProgress(.4, '006 editor created');
		}
		// 007 row
		if( $('controlfield[@tag=007]', marcXmlDoc ).length > 0 )  {
			html += '<tr>';
			var cat = $('controlfield[@tag=007]', marcXmlDoc).text().substr(0,1);
			var tag007 = $('controlfield[@tag=007]', marcXmlDoc).text();
			var mattype = get007MaterialName(cat);
			// find field def for this 007 mat type
			$('field[@tag=007][@mattype='+mattype+']', marc21defs).each( function(i) {
				$('value', this).each( function(j) {
					html += createFixedFieldCell(tag007, $(this) , 0, '007');
				}); // loop through positions in 007

			});

			html += '</tr>';
			//UI.editor.progress.updateProgress(.5, '007 editor created');
		}
		html += '</table>';
		html += '</div>'; // close fixedfields_editor
		html += '</div>'; // close ff_editor
		html += '<div class="vareditor">';
		html += '<div id="varfields_editor">';
		var leader = $('leader', marcXmlDoc).text();
		html += '<div class="tag controlfield 000" id="000"><input onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="tagnumber" value="000"><input onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="indicator" value="#"><input onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="indicator" value="#"><input class="controlfield" type="text" size="24" maxlength="24" value="'+leader+'"></div>';
		fields.push( new Field('000', '', '', [{code: '', value: leader}]) );

		$('controlfield', marcXmlDoc).each( function(i) {
			val = $(this).text();
			size = val.length;
			tagnum = $(this).attr('tag');
			html += '<div id="'+tagnum+'" class="tag controlfield ';
			html += tagnum;
			html += '"';
			html += '>';
			html += '<input maxlength="3" onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="tagnumber" value="'+tagnum+'">';
			html += '<input maxlength="1" onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="indicator" value="'+'#'+'">';
			html += '<input maxlength="1" onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="indicator" value="'+'#'+'">';
			html += '<input onblur="onBlur(this)" onfocus="onFocus(this)" ';
			html += 'type="text" '; 
			html += 'value="'+val+'" ';
			html += 'class="controlfield ';
			html += tagnum;
			html += '"';
			html += ' size="'+size+'"';
			html += '>';
			html += '</div>';
			fields.push( new Field(tagnum, '', '', [{code: '', value: val}]) );
		});	
		//UI.editor.progress.updateProgress(.6, 'Controlfields editor created');

		$('datafield', marcXmlDoc).each(function(i) {
			var value = $(this).text();
			var tagnum = $(this).attr('tag');
			var ind1 = $(this).attr('ind1') || ' ';
			var ind2 = $(this).attr('ind2') || ' ';
			var id = tagnum+'-'+i;
			html += '<div class=" tag datafield ';
			html += tagnum;
			html += '" ';
			html += 'id="'+id+'"';
			html += '>';
			html += '<input maxlength="3" onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="tagnumber" value="'+tagnum+'">';
			html += '<input maxlength="1" onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="indicator" value="'+ind1+'">';
			html += '<input maxlength="1" onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="indicator" value="'+ind2+'">';
			
			var id = tagnum+'-'+i;
            var sftemplate = new Ext.DomHelper.createTemplate({
                tag: 'span',
                cls: 'subfield',
                id: '{sfid}',
                children: [
                {
                    tag: 'input',
                    maxlength: '2',
                    onblur: 'onBlur(this)',
                    onfocus: 'onFocus(this)',
                    type: 'text',
                    cls: 'subfield-delimiter {sfcode}',
                    value: '&#8225;{sfcode}',
                    id: '{delimid}'
                },
                {
                    tag: 'input',
                    size: '{size}',
                    onblur: 'onBlur(this)',
                    onfocus: 'onFocus(this)',
                    cls: 'subfield-text {sfcode}',
                    value: '{sfval}',
                    id: '{textid}'
                }
                ]
            }).compile();
             var sftemplateTextarea = new Ext.DomHelper.createTemplate({
                tag: 'span',
                cls: 'subfield',
                id: '{sfid}',
                children: [
                {
                    tag: 'input',
                    maxlength: '2',
                    onblur: 'onBlur(this)',
                    onfocus: 'onFocus(this)',
                    type: 'text',
                    cls: 'subfield-delimiter {sfcode}',
                    value: '&#8225;{sfcode}',
                    id: '{delimid}'
                },
                {
                    tag: 'textarea',
                    cols: '{cols}',
                    style: {width: '{width}'}, // this isn't being set properly by extjs
                    onblur: 'onBlur(this)',
                    onfocus: 'onFocus(this)',
                    html: '{sfval}',
                    cls: 'subfield-text {sfcode}',
                    id: '{textid}'
                }
                ]
            }).compile();
			html += '<span class="subfields" id="'+id+'">';
			var subfields = new Array();
			$('subfield', this).each(function(j) {
				var sfval = $(this).text();
                // replace any quotes contained in text so it doesn't mess up html
				var sfsize = sfval.length;
				var sfcode = $(this).attr('code');
                var sfclass = 'subfield ' + sfcode;
                var sfid = 'dsubfields'+sfcode+'-'+Ext.id();
				subfields.push( new Subfield(sfcode, sfval) );
                if( sfsize > 100 ) {
                    html += sftemplateTextarea.applyTemplate({
                        sfclass: sfclass,
                        sfid: sfid,
                        sfcode: sfcode,
                        cols: '100',
                        width: Ext.get(editorid).getWidth(),
                        sfval: sfval,
                        delimid: Ext.id(),
                        textid: Ext.id()
                    });
                }
                else {
                    html += sftemplate.applyTemplate({
                        sfclass: sfclass,
                        sfid: sfid,
                        sfcode: sfcode,
                        size: sfsize,
                        sfval: sfval,
                        delimid: Ext.id(),
                        textid: Ext.id()
                    });
                }
            });
            // close subfields span
			html + '</span>';
			html += '</div>'; // close datafield div	
			fields.push( new Field(tagnum, ind1, ind2, subfields) );
		});
		//UI.editor.progress.updateProgress(.7, 'Datafields editor created');
		html += '</div>'; // end vareditor div
		html += '</div>'; // varfields_editor div
		marcrecord = new MarcRecord(fields);
		createFieldList();
		//UI.editor.progress.updateProgress(.8, 'MarcEditor created');
		htmled = html;
		return html;
	};

	this._getEditorHtml = function() {
		return htmled;
	};

}
// Public methods 
MarcEditor.prototype.getValue = function(tag, subfield) {
	return this._getValue(tag, subfield);
};

MarcEditor.prototype.setValue = function(tag, subfield, value) {
	this._setValue(tag, subfield, value);
};

MarcEditor.prototype.deleteSubfield = function(editorid, tag, index, subfield) {
	this._deleteSubfield(editorid, tag, index, subfield);
};

MarcEditor.prototype.deleteSubfields = function(tag) {
	this._deleteSubfields(tag);
};

MarcEditor.prototype.addSubfield = function(editorid, tag, index, subfield, value) {
	this._addSubfield(editorid, tag, index, subfield, value);
};

MarcEditor.prototype.focusTag = function(tag) {
	this._focusTag(tag);
};

MarcEditor.prototype.focusSubfield = function(tag, subfield) {
	this._focusSubfield(tag, subfield);
};

MarcEditor.prototype.addField = function(editorid, tag, ind1, ind2, subfields) {
	this._addField(editorid, tag, ind1, ind2, subfields);
};

MarcEditor.prototype.deleteField = function(editorid, tagnumber, i) {
	this._deleteField(editorid, tagnumber, i);
};

MarcEditor.prototype.getFieldList = function() {
	return this._getFieldList();
};

MarcEditor.prototype.hasField = function(tagnumber) {
	return this._hasField(tagnumber);
};

MarcEditor.prototype.hasFieldAndSubfield = function(tagnumber, subfieldcode) {
	return this._hasFieldAndSubfield(tagnumber, subfieldcode);
};

MarcEditor.prototype.fieldIndex = function(tagnumber, i) {
	return this._fieldIndex(tagnumber, i);
};

MarcEditor.prototype.rawSubfields = function(tagnumber, i) {
	return this._rawSubfields(tagnumber, i);
};

MarcEditor.prototype.rawField = function(tagnumber, i) {
	return this._rawField(tagnumber, i);
};

MarcEditor.prototype.rawFields = function() {
	return this._rawFields();
};

MarcEditor.prototype.getFields = function() {
	return this._getFields();
};

MarcEditor.prototype.getField = function(tagnumber) {
	return this._getField(tagnumber);
};

MarcEditor.prototype.XML = function() {
	return this._XML();
};

MarcEditor.prototype.XMLString = function() {
	return this._XMLString();
};

MarcEditor.prototype.update = function(elem) {
	return this._update(elem);
};

MarcEditor.prototype.getIndexOf = function(elem) {
	return this._getIndexOf(elem);
};

MarcEditor.prototype.loadXml = function(xmldoc) {
	return this._loadXml(xmldoc);
};

MarcEditor.prototype.getEditorHtml = function() {
	return this._getEditorHtml();
};

