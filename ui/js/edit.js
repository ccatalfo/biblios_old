/*
    Function: getLeaderFromEditor

    Serialize the leader values from the fixed field editor into a string suitable to be placed in <leader> element of marcxml document.

    Parameters:

    ff_ed: the fixed field editor

    Returns:

    leaderval: string containing serialized leader from editor

*/

function getLeaderFromEditor(ff_ed) {
	var leaderval = '';
	var rlen = $("#RLen", ff_ed ).val(); // record length
	var base = $("#Base", ff_ed).val(); // base address of variable fields
	var rstat = $("#RStat", ff_ed ).val();
	var type = $("#Type", ff_ed ).val();
	var blvl = $("#BLvl", ff_ed ).val();
	var ctrl = $("#Ctrl", ff_ed ).val();
	var encode = $("#Enc", ff_ed ).val();
	var indc = '2'; // indicator count = 2	
	var subc = '2'; // subfield count = 2
	var elvl = $("#ELvl", ff_ed ).val();
	var desc = $("#Desc", ff_ed ).val();
	var link = $("#Link", ff_ed ).val();
	var entry = '4500'; // entry
   	leaderval = leaderval.concat( rlen, rstat, type, blvl, ctrl, encode, indc, subc, base, elvl, desc, link, entry);	
	if( leaderval.length != 24 ) {
		throw {
			error: "InvalidLeader",
			msg: "Invalid length of Leader"
		};
	}
    return leaderval;
}

/* 
    Function: get008FromEditor

    Get string representation of 008 from fixed fields editor.

    Parameters:

    ff_ed: the fixed field editor

    Returns:

    tag008val: string version of 008

*/

function check008AllMaterials(position) {
	var allmaterialscodes = new Array('00', '01', '02','03', '04', '05', '06','07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '35', '36', '37', '38', '39', '40');
	if( allmaterialscodes.indexOf(position) != -1 ) {
		return true;
	}
	else {
		return false;
	}
}

function get008MaterialName(rectype) {
	var mattype = '';
	if( rectype == 'a' || rectype == 't' ) {
		mattype = 'Books';
	}
	if( rectype == 'm' ) {
		mattype = 'Computer Files';
	}
	if( rectype == 'e' || rectype == 'f' ) {
		mattype = 'Maps';
	}
	if( rectype == 'c' || rectype == 'd' || rectype == 'j' || rectype == 'i') {
		mattype = 'Music';
	}
	if( rectype == 'g' || rectype == 'k' || rectype == 'o' || rectype == 'r') {
		mattype = 'Visual Materials';
	}
	if( rectype == 'p' ) {
		mattype = 'Mixed Materials';
	}
	return mattype;
}

function get008FromEditor(ff_ed) {
		var tag008val = '';
		var rectype = $('#Type').val();
		var mattype = get008MaterialName(rectype);
			$('mattypes mattype[@value='+mattype+'] position', marc21defs).each( function(i) {
				var type = $(this).text();
				var value = '';
				if( type.substr(0, 4) == 'Undef') {
					var length = type.substr(5,1);
					for( var k = 0; k<length; k++) {
						tag008val += ' ';
					}
				}
				if( type == 'Lang' || type == 'Ctry' ) {
					value = Ext.getCmp(type).getValue();
				}
				else {
					value = $('#'+type).val();
				}
				tag008val += value;
			});
	if( tag008val.length != 40 ) {
		throw {
			error: "Invalid008",
			msg: "Invalid length of 008"
		};
	}
    return tag008val;
}

function get006FromEditor(ff_ed) {
		var tag006val = '';
		var rectype = $('#Type').val();
		var mattype = get008MaterialName(rectype);
		$('mattypes mattype[@value='+mattype+'] position', marc21defs).each( function(i) {
			var type = $(this).text();
			if( type.substr(0, 4) == 'Undef') {
				var length = type.substr(5,1);
				for( var k = 0; k<length; k++) {
					tag006val += ' ';
				}
			}
			var value = $('#'+type).val();
			tag006val += value;
		});
    return tag006val;
}

function get007MaterialName(cat) {
	var mattype = '';
	if( cat == 'a' ) {
		mattype = 'Map';
	}
	if( cat == 'c' ) {
		mattype = 'Electronic Resource';
	}
	if( cat == 'd' ) {
		mattype = 'Globe';
	}
	if( cat == 'f' ) {
		mattype = 'Tactile Material';
	}
	if( cat == 'g' ) {
		mattype = 'Projected Graphic';
	}
	if( cat == 'h' ) {
		mattype = 'Microform';
	}
	if( cat == 'k' ) {
		mattype = 'Nonprojected Graphic';
	}
	if( cat == 'm' ) {
		mattype = 'Motion Picture';
	}
	if( cat == 'o' ) {
		mattype = 'Kit';
	}
	if( cat == 'q' ) {
		mattype = 'Notated Music';
	}
	if( cat == 'r' ) {
		mattype = 'Remote-Sensing Image';
	}
	if( cat == 's' ) {
		mattype = 'Sound Recording';
	}
	if( cat == 't' ) {
		mattype = 'Text';
	}
	if( cat == 'v' ) {
		mattype = 'Videorecording';
	}
	if( cat == 'z' ) {
		mattype = 'Unspecified';
	}
	return mattype;
}

function get007FromEditor() {
	var tag007val = '';
	var cat = $('#Category').val();
	var mattype = get007MaterialName(cat);
			$('field[@tag=007][@mattype='+mattype+']', marc21defs).each( function(i) {
				$('value', this).each( function(j) {
					var type = $(this).attr('name');
					if( type == 'Undefined') {
						var length = $(this).attr('length');
						for( var k = 0; k<length; k++) {
							tag007val += ' ';
						}
					}
					var value = $('#'+type).val() || '';
					tag007val += value;
				}); // loop through positions in 007
			});
			return tag007val;
}


/*

*/
function updateFFEditor(editorid, ff_ed, var_ed) {
	if(debug) { console.info("updating fixed field editor from leader and 008 tags"); }
    var oDomDoc = Sarissa.getDomDocument();
    var leaderval = $('#'+editorid).find("#000", var_ed).children('.controlfield').val();
	if( leaderval.length != 24 ) {
		throw {
			error: "InvalidLeader",
			msg: "Invalid length of Leader"
		};
	}
    var tag008val = $('#'+editorid).find("#008", var_ed).children('.controlfield').val();
	if( tag008val.length != 40 ) {
		throw {
			error: "Invalid008",
			msg: "Invalid length of 008"
		};
	}
    if(debug) {
        console.info('Transferring leader value to fixed field editor from leader tag: ' + leaderval);
        console.info('Transferring 008 value to fixed field editor from 008 tag: ' + tag008val);
    }
    var newff = '<collection xmlns="http://www.loc.gov/MARC21/slim">';
    //"<?xml version='1.0' encoding='UTF-8'?>";
    newff += "<record><leader>";
    newff += leaderval;
    newff += "</leader>";
    newff += "<controlfield tag='008'>";
    newff += tag008val;
    newff += "</controlfield>";
	if( $('#'+editorid).find("#006", var_ed).length > 0 ) {
		var tag006val = $('#'+editorid).find("#006", var_ed).children('.controlfield').val();
		newff += "<controlfield tag='006'>" + tag006val + "</controlfield>";
	}
	if( $('#'+editorid).find("#007", var_ed).length > 0 ) {
		var tag007val = $('#'+editorid).find("#007", var_ed).children('.controlfield').val();
		newff += "<controlfield tag='007'>" + tag007val + "</controlfield>";
	}
    newff += "</record>";
    newff += "</collection>";
	var xmldoc = xslTransform.loadString(newff);
	//FIXME make this an jquery.xslTransform call
    $('#'+editorid).find(".ffeditor").empty();
	var temprec = new MarcEditor();
	var htmled = temprec.loadXml( xmldoc );
    $('#'+editorid).find(".ffeditor").html(htmled);
	// setup ff editor's comboboxes
	setupFFEditorCtryCombo(editorid);
	setupFFEditorLangCombo(editorid);
}



function doRecordOptions() {

}

function doMerge() {

}


/*
Function: displayHelpMsg

  Display a message in the help panel.

Parameters:
  
  msg: String containingin the message to display.

Returns:

  None.

*/
function displayHelpMsg(msg) {
	Ext.getCmp('helpIframe').el.update(msg);
}


/*
    Function: transferFF_EdToTags

    Transfer the values contained in the fixed field editor into tags to display in the marc editor (leader and 008).

    Parameters:

    ff_ed: the fixed field editor

    Returns:

    None.

*/
function transferFF_EdToTags(ff_ed, var_ed, editorid ) {
    try {
        var leaderval = getLeaderFromEditor(ff_ed);
        $('#'+editorid).find("#000", var_ed).children('.controlfield').val(leaderval);
        if(debug){console.info('Transferring leader value from fixed field editor into leader tag: ' + leaderval);}
    }
    catch(ex) {
        Ext.MessageBox.alert('Error', ex.message);
    }
    try {
        var tag008val = get008FromEditor(ff_ed);
        $('#'+editorid).find("#008", var_ed).children('.controlfield').val(tag008val);
        if(debug){console.info('Transferring 008 value from fixed field editor into 008 tag: ' + tag008val);}
    }
    catch(ex) {
        Ext.MessageBox.alert('Error', ex.message);
    }
	if( $('#'+editorid).find('#006').length > 0 ) {
        try {
            var tag006val = get006FromEditor(ff_ed);
            $('#'+editorid).find("#006", var_ed).children('.controlfield').val(tag006val);
            if(debug){console.info('Transferring 006 value from fixed field editor into 006 tag: ' + tag006val);}
        }
        catch(ex) {
            Ext.MessageBox.alert('Error', ex.message);
        }
	}
	if( $('#'+editorid).find('#007').length > 0 ) {
        try {
            var tag007val = get007FromEditor(ff_ed);
            $('#'+editorid).find("#007", var_ed).children('.controlfield').val(tag007val);
            if(debug){console.info('Transferring 007 value from fixed field editor into 007 tag: ' + tag007val);}
        }
        catch(ex) {
            Ext.MessageBox.alert('Error', ex.message);
        }
	}
}


function toggleFixedFieldDisplay(btn, toggled) {
	var editorid = btn.editorid;
	var ff_ed = $('#'+editorid).find(".ffeditor");
	var var_ed = $('#'+editorid).find(".vareditor");
	if( btn.pressed == false ) {
		// hide fixed field editor
		$('#'+editorid).find(".ffeditor").hide();
        // transfer values from fixed field editor into tags
        transferFF_EdToTags(ff_ed, var_ed, editorid);
		// show leader and 008
		$('#'+editorid).find("#000", UI.editor[editorid].vared).show();
		$('#'+editorid).find("#008", UI.editor[editorid].vared).show();
		$('#'+editorid).find("#006", UI.editor[editorid].vared).show();
		$('#'+editorid).find("#007", UI.editor[editorid].vared).show();
	}
	else {
        updateFFEditor(editorid, ff_ed, var_ed);
		$('#'+editorid).find(".ffeditor").show();
		// hide leader and fixed fields
		$('#'+editorid).find("#000", UI.editor[editorid].vared).hide();
		$('#'+editorid).find("#008", UI.editor[editorid].vared).hide();
		$('#'+editorid).find("#006", UI.editor[editorid].vared).hide();
		$('#'+editorid).find("#007", UI.editor[editorid].vared).hide();
	}

}

function create_static_editor(ffed, vared, editorid) {
	// setup marceditor macro functionality
	UI.editor[editorid].record = setupMacros(ffed, vared);
	// setup reserved (locked) tags based on remote ils bib profile
	if( Prefs.remoteILS[ UI.editor[editorid].location ] ) {
		setupReservedTags( Prefs.remoteILS[ UI.editor[editorid].location ], vared);
		setupSpecialEntries( Prefs.remoteILS[ UI.editor[editorid].location ], vared);
	}
	// add editor hotkeys
	setupEditorHotkeys(editorid);

	// apply ExtJS comboboxes for live searching of authority data
	setupMarc21AuthorityLiveSearches(editorid);
}

function onFocus(elem) {
    console.info(elem);
	$(elem).addClass('focused');
    // is this element an input or a textarea?
    var nodeName = $(elem).get(0).nodeName;
	var editorid = $(elem).parents('.marceditor').get(0).id;
    var elemid = $(elem).get(0).id;
    console.info(elemid);
	UI.editor.lastFocusedEl = elem;
	UI.editor.lastEditorId = editorid;
	UI.editor[editorid].lastFocusedEl = elem;
    // apply Ext TextField so it will grow as we type
    if( nodeName == 'INPUT' ) {
        var tf = new Ext.form.TextField({
            applyTo: elemid,
            grow: true
        });
    }
    else {
        var val = $(elem).val();
        var tf = new Ext.form.TextArea({
            applyTo: elemid,
            grow: true
        });
    }
    try {
        tf.render();
    }
    catch(ex) {
        console.info(ex);
    }
	showTagHelp(elem);
}

function showTagHelp(elem) {
	// if help panel isn't open, don't bother displaying help
	if( Ext.getCmp('helpPanel').collapsed == true ) {
		return;
	}
	Ext.get('helpIframe').mask('Loading...');
	Ext.get('helpIframe').update('');
	// if we have a fixed field editor element
	if( $(elem).parents('.ffeditor').length > 0 ) {
		var name = $(elem).get(0).id;
		var currval = $(elem).val();
		// get position location
		var position = $('value[@name='+name+']', marc21defs).attr('position');
		// pad with leading zero
		if( position.length == 1 ) {
			position = '0'+position;
		}
		// get tag this field is part of
		var tag = '';
		// figure out material type if necessary
		var rectype = $('#Type').val();
		var mattype = '';
		if( $(elem).hasClass('000') ) {
			tag = '000';
		}
		else if ( $(elem).hasClass('008') ) {
			tag = '008';
			if( check008AllMaterials(position) == true ) {
				mattype = 'All Materials';
			}
			else {
				mattype = get008MaterialName(rectype);
			}
		}
		else if( $(elem).hasClass('007') ) {
			tag = '007';
			mattype = get007MaterialName( $('#Category').val() );
		}
		else if( $(elem).hasClass('006') ) {
			tag = '006';
			mattype = get008MaterialName(rectype);
		}
		// get the help text for this fixed field
		var tagxml = '';
		if( tag == '000' ) {
			tagxml = $('tag[@code='+tag+'] position[@position^='+position+']', marc21controlfields);
		}
		else {
			$('tag[@code='+tag+']', marc21controlfields).each( function(i) {
				if( $(this).attr('materialtype') == mattype ) {
					tagxml = $(this).children('position[@position^='+position+']', marc21controlfields);
					return false;
				}
			});
		}
		var ffdesc = $(tagxml).attr('description');
		var ffname = $(tagxml).attr('name');
		UI.templates.fixedfieldHelp.append('helpIframe', {ffname: ffname, ffdesc: ffdesc});
		$(tagxml).children('value').each( function(i) {
			var code = $(this).attr('code');
			var desc = $(this).attr('description');
			UI.templates.ffOption.append('ffoptions', {code: code, desc: desc });
		});
	}
	else {
		// retrieve help for this tag
		var subfieldcode = 'a';
		var indicatornumber = '1';
		var tagname = $(elem).parents('.tag').get(0).id.substr(0,3);
		if( $(elem).hasClass('subfield-text') || $(elem).hasClass('subfield-delimiter')) {
			subfieldcode = $(elem).parents('.subfield').get(0).id.substr(13,1);
		}
		var tagdesc = '';
		if( tagname == '000' ) {
			return;
		}
		else {
			tagdesc = $('tag[@code='+tagname+']', marc21varfields).attr('description');
			UI.templates.tagHelp.append('helpIframe', {tagname: tagname, tagdesc: tagdesc});
			$('tag[@code='+tagname+']', marc21varfields).children('indicator').each( function(i) {
				var indicatornumber = $(this).attr('number');
				var indicatordesc = $(this).attr('description');
				UI.templates.indicatorsHelp.append('indicatorshelp', {indicatornumber: indicatornumber, indicatordesc: indicatordesc});
				$(this).children('option').each( function(i) {
					var optioncode = $(this).attr('code');
					var optiondesc = $(this).attr('description');
					var optionname = $(this).attr('name');
					UI.templates.indicatorValue.append('indicatorvalues-'+indicatornumber, {optioncode:optioncode, optionname: optionname, optiondesc: optiondesc});
				});
			});
			$('tag[@code='+tagname+']', marc21varfields).children('subfield').each( function(i) {
				var subfieldname = $(this).attr('name');
				var subfieldcode = $(this).attr('code');
				var subfielddesc = $(this).attr('description');
				UI.templates.subfieldsHelp.append('subfieldshelp', {subfieldname:subfieldname, subfieldcode:subfieldcode,subfielddesc:subfielddesc  });
			});
			// highlight currently selected subfield
			$('.subfieldhelp').removeClass('highlightedhelp');
			$('#subfieldhelp-'+subfieldcode).addClass('highlightedhelp');
		}
	}
	UI.editor.lastElemHelpShown = elem;
	Ext.get('helpIframe').unmask();
}

function onBlur(elem) {
	$(elem).removeClass('focused');
	var editorid = $(elem).parents('.marceditor').get(0).id;
	//UI.editor[editorid].record.update(elem);
	UI.editor.lastEditorId = editorid;
	UI.editor.lastFocusedEl = elem;
	UI.editor[editorid].lastFocusedEl = elem;
}

function onFixedFieldEditorBlur(elem) {
/*
	var editorid = $(elem).parents('.marceditor').get(0).id;
	transferFF_EdToTags(UI.editor[editorid].ffed, UI.editor[editorid].vared, editorid);
	UI.editor[editorid].record.update($('#000').find('.controlfield'));
	UI.editor[editorid].record.update($('#008').find('.controlfield'));
*/
}

function setupSpecialEntries(loc, editor) {
	var specialentries = Prefs.remoteILS[loc].instance.special_entries;
	for( var i = 0; i < specialentries.length; i++) {
		var entry = specialentries.eq(i);
		var tagnumber = $('field tag', entry).text();	
		var subfield = $('field/ ubfield', entry).text();	
		// get the element to replace w/ combobox
		var elemToReplace = $('[@id^='+tagnumber+']').children('.subfields').children('[@id*='+subfield+']').children('.subfield-text');
		if(elemToReplace.length == 0) {
			return false;
		}
		var currentValue = $(elemToReplace).val();
		var id = $(elemToReplace).get(0).id;
		// get parent .subfield to render combo to
		var subfield = $(elemToReplace).parents('.subfield');
		// remove current text of elemToReplace
		//$(elemToReplace).remove();
		var valid_values = $('valid_values value', entry);
		var storevalues = new Array();
		for( j = 0; j < valid_values.length; j++) {
			var value = valid_values.eq(j);
			var code = $('code', value).text();
			var desc = $('description', value).text();
			// store valid values in store
			storevalues.push([code, desc]);
		}
		if(debug) { console.info('Applying combobox to '+tagnumber+' '+subfield+' with current value of ' +currentValue + ' for special entry');}
		var store = new Ext.data.SimpleStore({
			fields: ['code', 'desc'],
			data: storevalues
		});
		var combo = new Ext.form.ComboBox({
			id: id,
			store: store,
			typeAhead: true,
			displayField: 'desc',
			valueField: 'code',
			grow: true,
			mode: 'local',
			selectOnFocus: true,
			value: currentValue,
			triggerAction: 'all',
			hideTrigger: true,
			applyTo: $(elemToReplace).get(0)
		});
		Ext.ComponentMgr.register(combo);
		if(debug) { console.info('Applying combobox to '+tagnumber+' '+subfield+' with current value of ' +currentValue + ' for special entry');}
		
	}
}

function setupReservedTags(loc, editor) {
	var reservedtags = Prefs.remoteILS[loc].instance.reserved_tags;
	for( var i = 0; i< reservedtags.length; i++) {
		var tagnumber = $(reservedtags).eq(i).text();
		// set readonly for tagnumber and indicators
		$('.tag[@id^='+tagnumber+']').children('input').attr('readonly', 'readonly').addClass('reserved_tag');
		// set readonly for subfields
		$('.tag[@id^='+tagnumber+']').children('.subfields').children('.subfield').children('input').attr('readonly', 'readonly').addClass('reserved_tag');
	}	
}

function setupMacros(ffeditor, vareditor) {
	return new MarcEditor(ffeditor, vareditor);
}


function setupEditorHotkeys(editorelem) {
	// focus prev tagnumber on shift-return
	var inputs = Ext.select('input', false, $(editorelem)[0]);
	inputs.addKeyMap({
		key: Ext.EventObject.ENTER,
		fn: function(key, e) {
			// if there's a combobox open in the marceditor, don't process so it can handle enter
			if( UI.editor.cbOpen == true ) {
				return;			
			}
			if(e.shiftKey ) {
				$('.focused').parents('.tag').prev().children('.tagnumber').eq(0).focus();
			}
			else {
				$('.focused').parents('.tag').next().children('.tagnumber').eq(0).focus();
			}
		},
		stopEvent: false
	});

	// add a new subfield
	$.hotkeys.add('Ctrl+m', function(e) {	
		var editorid = UI.editor.lastEditorId;
		UI.editor[editorid].record.addSubfield(editorid);
	});
	
	// add a new field
	$.hotkeys.add('Ctrl+n', function(e) {
		var editorid = UI.editor.lastEditorId;
		UI.editor[editorid].record.addField(editorid);
	});

	// remove a subfield
	$.hotkeys.add('Ctrl+d', function(e) {
		var editorid = UI.editor.lastEditorId;
		UI.editor[editorid].record.deleteSubfield(editorid);
	});
	// remove a field
	$.hotkeys.add('Ctrl+r', function(e) {
		var editorid = UI.editor.lastEditorId;
		UI.editor[editorid].record.deleteField(editorid);
	});

	// save record
	$.hotkeys.add('Ctrl+s', function(e) {
		var editorid = UI.editor.lastEditorId;
		if( editorid == '' || editorid == null) {
			Ext.MessageBox.alert('Error', 'Please click in the editor you wish to save before using the save hotkey');	
		}
		doSaveLocal(UI.currSaveFile, editorid);
	});
}

function createAuthComboBox(editorid, tagelem, xmlReader, displayField, queryIndex, recordSchema) {
	var subfield_text = $(tagelem);
	if( subfield_text.length == 0 ) {
		return;
	}
	if(debug) {console.info('applying combobox to '+ $(subfield_text).val() ); }
	var ds = new Ext.data.Store({
		proxy: new Ext.data.HttpProxy(
			{
				url: kohaauthurl,
				method: 'GET',
				disableCaching: false
			
			}),
		baseParams: {
								version: '1.1',
								operation: 'searchRetrieve',
								recordSchema: recordSchema,
								maximumRecords: '100'
		},
		reader: xmlReader 
	});

	var cb = new Ext.form.ComboBox({
		store: ds,
		typeAhead: true,
		typeAheadDelay: 500,
		allQuery: 'query',
		queryParam: 'query',
		queryIndex: queryIndex,
		editable: true,
		forceSelection: false,
		triggerAction: 'all',
		mode: 'remote',
		selectOnFocus: true,
		hideTrigger: true,
		displayField: displayField,
		loadingText: 'Searching...',
		cls: 'authority-field',
		lazyRender: false,
		applyTo: $(subfield_text).get(0).id
	});
	cb.on('beforequery', function(combo, query, forceAll, cancel, e) {
		combo.query = combo.combo.queryIndex + "=" + combo.query;
	});
	cb.on('select', function(combo, record, index) {
		var tagnumber = $(combo.el.dom).parents('.tag').children('.tagnumber').val();
		var tag = $(combo.el.dom).parents('.tag');
		var tagindex = UI.editor[editorid].record.getIndexOf( tag );
		// create/update subfields
		if( record.store.reader.meta.deleteSubfields == true ) {
			// delete any subfields following the first (subfield $a)
			var subfields = $(tag).find('.subfield');
			for( var i = 1; i< subfields.length; i++) {
				$( subfields[i] ).remove();
			}
		}
		// for each subfield in this record
		for( var i = 0; i < record.fields.length; i++) {
			var data = record.fields.itemAt(i);
			var subfieldcode = data.id;
			var fieldname = data.name;
			var value = record.data[fieldname];
			// update subfield a
			if( subfieldcode == 'a') {
				combo.setValue(value);	
			}
			// add new one if we have a value for it
			else if( value != '' || null ) {
				UI.editor[editorid].record.addSubfield(tagnumber, tagindex, subfieldcode, value);
			}
		}
		UI.editor[editorid].cbOpen = false;

	});
	cb.on('specialkey', function(cb, e) {
		e.stopEvent();
	});
	cb.on('expand', function(cb, e) {
		UI.editor[editorid].cbOpen = true;
	});
	cb.on('hide', function(cb, e) {
	});
	UI.editor[editorid].comboboxes.push(cb);
	return true;
}

function setupMarc21AuthorityLiveSearches(editorid) {
	var topicalTermXmlReader = new Ext.data.XmlReader({
		record: 'record',
		deleteSubfields: false, // don't remote following subfields
		id: 'controlfield[tag=001]'
		},
		[
			{name: 'topicalterm', id: 'a', mapping: 'datafield[tag=150] > subfield[code=a]'}
	]);
	var geoTermXmlReader = new Ext.data.XmlReader({
		record: 'record',
		deleteSubfields: false, // don't remote following subfields
		id: 'controlfield[tag=001]'
		},
		[
			{name: 'geoTerm', id: 'a', mapping: 'datafield[tag=151] > subfield[code=a]'}
	]);
	var genreTermXmlReader = new Ext.data.XmlReader({
		record: 'record',
		deleteSubfields: false, // don't remote following subfields
		id: 'controlfield[tag=001]'
		},
		[
			{name: 'genreTerm', id: 'a', mapping: 'datafield[tag=155] > subfield[code=a]'}
	]);
	var corpnameXmlReader = new Ext.data.XmlReader({
		record: 'record',
		deleteSubfields: false, // don't remote following subfields
		id: 'controlfield[tag=001]'
		},
		[
			{name: 'corpname', id: 'a', mapping: 'datafield[tag=110] > subfield[code=a]'}
	]);
	var confnameXmlReader = new Ext.data.XmlReader({
		record: 'record',
		deleteSubfields: false, // don't remote following subfields
		id: 'controlfield[tag=001]'
		},
		[
			{name: 'confname', id: 'a', mapping: 'datafield[tag=111] > subfield[code=a]'}
	]);
	var uniformtitleXmlReader = new Ext.data.XmlReader({
		record: 'record',
		deleteSubfields: false, // don't remote following subfields
		id: 'controlfield[tag=001]'
		},
		[
			{name: 'title', id: 'a', mapping: 'datafield[tag=130] > subfield[code=a]'}
	]);
	var pnameXmlReader = new Ext.data.XmlReader({
			record: 'record',
			deleteSubfields: true,
			id: 'controlfield[tag=001]'
			},
			[
				// field mapping
				{name: 'pname', id: 'a', mapping: 'datafield[tag=100] > subfield[code=a]'},
				{name: 'numeration', id: 'b', mapping: 'datafield[tag=100] > subfield[code=b]'},
				{name: 'titles', id: 'c', mapping: 'datafield[tag=100] > subfield[code=c]'},
				{name: 'dates', id: 'd', mapping: 'datafield[tag=100] > subfield[code=d]'},
				{name: 'relator', id: 'e', mapping: 'datafield[tag=100] > subfield[code=e]'},
				{name: 'dateofwork', id: 'f', mapping: 'datafield[tag=100] > subfield[code=f]'},
				{name: 'miscinfo', id: 'g', mapping: 'datafield[tag=100] > subfield[code=g]'},
				{name: 'attrqualifier', id: 'j', mapping: 'datafield[tag=100] > subfield[code=j]'},
				{name: 'formsubheading', id: 'k', mapping: 'datafield[tag=100] > subfield[code=k]'},
				{name: 'langofwork', id: 'l', mapping: 'datafield[tag=100] > subfield[code=l]'},
				{name: 'numofpart', id: 'n', mapping: 'datafield[tag=100] > subfield[code=n]'},
				{name: 'nameofpart', id: 'p', mapping: 'datafield[tag=100] > subfield[code=p]'},
				{name: 'fullerform', id: 'q', mapping: 'datafield[tag=100] > subfield[code=q]'},
				{name: 'titleofwork', id: 't', mapping: 'datafield[tag=100] > subfield[code=t]'},
				{name: 'affiliation', id: 'u', mapping: 'datafield[tag=100] > subfield[code=u]'},
				{name: 'relatorcode', id: '4', mapping: 'datafield[tag=100] > subfield[code=4]'},
				{name: 'linkage', id: '6', mapping: 'datafield[tag=100] > subfield[code=6]'},
				{name: 'fieldlinkseqnum', id: '8', mapping: 'datafield[tag=100] > subfield[code=8]'},
				{name: 'authcontrolnum', id: '9', mapping: 'datafield[tag=001]'} // KOHA specific
			]
	);
	// personal names
	Ext.select('div[id^=100] .a .subfield-text, div[id^=700] .a .subfield-text, div[id^=600] .a .subfield-text, div[id^=800] .a .subfield-text').each( function(item) {
		createAuthComboBox(editorid,  $(item.dom), pnameXmlReader, 'pname', 'bath.personalName', 'marcxml' );
		return true;
	});
	
	Ext.select('div[id^=110] .a .subfield-text, div[id^=710] .a .subfield-text, div[id^=610] .a .subfield-text, div[id^=810] .a .subfield-text').each( function(item) {
		createAuthComboBox(editorid,  $(item.dom), corpnameXmlReader, 'corpname', 'bath.corporateName', 'marcxml' );
		return true;
	});
	Ext.select('div[id^=111] .a .subfield-text, div[id^=711] .a .subfield-text, div[id^=611] .a .subfield-text, div[id^=811] .a .subfield-text').each( function(item) {
		createAuthComboBox(editorid,  $(item.dom), confnameXmlReader, 'confname', 'bath.conferenceName', 'marcxml' );
		return true;
	});
	Ext.select('div[id^=240] .a .subfield-text, div[id^=130] .a .subfield-text, div[id^=740] .a .subfield-text, div[id^=630] .a .subfield-text').each( function(item) {
		createAuthComboBox(editorid,  $(item.dom), uniformtitleXmlReader, 'title', 'bath.uniformTitle', 'marcxml' );
		return true;
	});
	// subject headings
	Ext.select('div[id^=650] .a .subfield-text').each( function(item) {
		createAuthComboBox(editorid,  $(item.dom), topicalTermXmlReader, 'topicalterm', 'bath.topicalSubject', 'marcxml' );
		return true;
	});
	Ext.select('div[id^=651] .a .subfield-text').each( function(item) {
		createAuthComboBox(editorid,  $(item.dom), geoTermXmlReader, 'geoterm', 'bath.geographicName', 'marcxml' );
		return true;
	});
	Ext.select('div[id^=655] .a .subfield-text').each( function(item) {
		createAuthComboBox(editorid,  $(item.dom), genreTermXmlReader, 'genreterm', 'bath.genreForm', 'marcxml' );
		return true;
	});
}

function setupFFEditorLangCombo(editorid) {
	var select = $('#Lang', $('#'+editorid));
	var val = $(select).val();

	var store = new Ext.data.Store({
		proxy: new Ext.data.MemoryProxy(),
		reader: new Ext.data.XmlReader({
			record: 'language',
			id: 'uri'
			}, [
				{name: 'name'},
				{name: 'code'}
			])
		});
	store.loadData(marc21langdefs);

	var cb = new Ext.form.ComboBox({
		id: 'Lang',
		store: store,
		forceSelection: true,
		hideTrigger: true,
		typeAhead: true,
		displayField: 'name',
		valueField: 'code',
		value: val,
		mode: 'local',
		applyTo: $(select).get(0).id
	});
	cb.render( );
}

function setupFFEditorCtryCombo(editorid) {
	var select = $('#Ctry', $('#'+editorid));
	var val = $(select).val();

	var store = new Ext.data.Store({
		proxy: new Ext.data.MemoryProxy(),
		reader: new Ext.data.XmlReader({
			record: 'country',
			id: 'uri'
			}, [
				{name: 'name'},
				{name: 'code'}
			])
		});
	store.loadData(marc21ctrydefs);

	var cb = new Ext.form.ComboBox({
		id: 'Ctry',
		store: store,
		forceSelection: true,
		hideTrigger: true,
		typeAhead: true,
		displayField: 'name',
		valueField: 'code',
		value: val,
		mode: 'local',
		applyTo: $(select).get(0).id
	});
	cb.render();
}





/* 
   Function: clearEditor

   Clear the editor divs currently open record.

   Parameters:
  
   None.

   Returns:

   None.
 
   See Also:
   <openRecord>
*/
function clear_editor(editorid) {
    // reset current open record to none
    UI.editor[editorid].id = '';
	UI.editor[editorid].location = '';
	UI.editor[editorid].record = '';
	UI.editor[editorid].comboboxes = new Array();
   // clear the marceditor divs
   $('#'+editorid).find("#fixedfields_editor").empty();
   $('#'+editorid).find("#varfields_editor").empty();
}

function getEditorForTag(tagnumber, marcxml) {

}

function checkEditorLimits(elem) {
	if( $(':checked').length == 3 ) {
		elem.checked = false;
		Ext.MessageBox.alert('Error', 'Please select only 2 records to edit at one time');
	}
}
