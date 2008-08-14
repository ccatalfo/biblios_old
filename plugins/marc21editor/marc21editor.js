// load in MarcRecord from plugins
$.getScript(libPath + 'plugins/marcrecord.js');
// load in marc21 config files (xml data)

var showMarcXslPath = libPath + "ui/xsl/marcxmlpreview.xsl";
var fixedFieldXslPath = libPath + "ui/xsl/fixedfields_editor.xsl";
var varFieldsXslPath = libPath + "ui/xsl/varfields_inputboxes.xsl";
var marc21varfieldsPath = libPath + 'tools/marc21varfields.xml';
var marc21defsPath = libPath + "ui/xsl/marc21.xml";
var marc21langdefsPath = libPath + 'tools/marcdata/languages.xml';
var marc21ctrydefsPath = libPath + 'tools/marcdata/countries.xml';
var marc21controlfieldsPath = libPath + 'tools/marc21controlfields.xml';
// load xsl docs for transforming marcxml
var marcxsl = xslTransform.loadFile(showMarcXslPath);
//var ffxsl = xslTransform.loadFile(fixedFieldXslPath);
var varfxsl = xslTransform.loadFile(varFieldsXslPath);
var marc21defs = xslTransform.loadFile(marc21defsPath);
var marc21langdefs = xslTransform.loadFile(marc21langdefsPath);
var marc21ctrydefs = xslTransform.loadFile(marc21ctrydefsPath);
var marc21varfields = xslTransform.loadFile(marc21varfieldsPath);
var marc21controlfields = xslTransform.loadFile(marc21controlfieldsPath);

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





function doRecordOptions() {

}

function doMerge() {

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
        $('#'+editorid).find("#000", var_ed).children('.controlfield-text').val(leaderval);
        if(debug){console.info('Transferring leader value from fixed field editor into leader tag: ' + leaderval);}
    }
    catch(ex) {
        Ext.MessageBox.alert('Error', ex.message);
    }
    try {
        var tag008val = get008FromEditor(ff_ed);
        $('#'+editorid).find("#008", var_ed).children('.controlfield-text').val(tag008val);
        if(debug){console.info('Transferring 008 value from fixed field editor into 008 tag: ' + tag008val);}
    }
    catch(ex) {
        Ext.MessageBox.alert('Error', ex.message);
    }
	if( $('#'+editorid).find('#006').length > 0 ) {
        try {
            var tag006val = get006FromEditor(ff_ed);
            $('#'+editorid).find("#006", var_ed).children('.controlfield-text').val(tag006val);
            if(debug){console.info('Transferring 006 value from fixed field editor into 006 tag: ' + tag006val);}
        }
        catch(ex) {
            Ext.MessageBox.alert('Error', ex.message);
        }
	}
	if( $('#'+editorid).find('#007').length > 0 ) {
        try {
            var tag007val = get007FromEditor(ff_ed);
            $('#'+editorid).find("#007", var_ed).children('.controlfield-text').val(tag007val);
            if(debug){console.info('Transferring 007 value from fixed field editor into 007 tag: ' + tag007val);}
        }
        catch(ex) {
            Ext.MessageBox.alert('Error', ex.message);
        }
	}
}



function onFocus(elem) {
    //console.info(elem);
	$(elem).addClass('focused');
    // is this element an input or a textarea?
    var nodeName = $(elem).get(0).nodeName;
	var editorid = $(elem).parents('.marceditor').get(0).id;
    var elemid = $(elem).get(0).id;
    //console.info(elemid);
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

function addInputOutlines() {
    $('.subfield-text,.controlfield-text').css('border', '1px solid');
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


// Object -> marc editor wrapper


function MarcEditor(editorelem, editorid) {
	// private
	var that = this;
    var editorelem = editorelem;
    var editorid = editorid;
	var htmled = '';	
	var lastFocusedEl;
	var currFocusedEl;
	var fieldlist = new Array();
	var fields = new Array();
	var marcrecord = null;

	// private methods


/*

*/
function updateFFEditor() {
	if(debug) { console.info("updating fixed field editor from leader and 008 tags"); }
    var oDomDoc = Sarissa.getDomDocument();
    var leaderval = $('#'+editorid).find("#000", editorelem).children('.controlfield-text').val();
	if( leaderval.length != 24 ) {
		throw {
			error: "InvalidLeader",
			msg: "Invalid length of Leader"
		};
	}
    var tag008val = $('#'+editorid).find("#008", editorelem).children('.controlfield-text').val();
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
	if( $('#'+editorid).find("#006", editorelem).length > 0 ) {
		var tag006val = $('#'+editorid).find("#006", editorelem).children('.controlfield-text').val();
		newff += "<controlfield tag='006'>" + tag006val + "</controlfield>";
	}
	if( $('#'+editorid).find("#007", editorelem).length > 0 ) {
		var tag007val = $('#'+editorid).find("#007", editorelem).children('.controlfield-text').val();
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
	setupFFEditorCtryCombo();
	setupFFEditorLangCombo();
}
function setupSpecialEntries(loc) {
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

function setupReservedTags(loc) {
	var reservedtags = Prefs.remoteILS[loc].instance.reserved_tags;
	for( var i = 0; i< reservedtags.length; i++) {
		var tagnumber = $(reservedtags).eq(i).text();
		// set readonly for tagnumber and indicators
		$('.tag[@id^='+tagnumber+']', editorelem).children('input').attr('readonly', 'readonly').addClass('reserved_tag');
		// set readonly for subfields
		$('.tag[@id^='+tagnumber+']', editorelem).children('.subfields').children('.subfield').children('input').attr('readonly', 'readonly').addClass('reserved_tag');
	}	
}

function setupEditorHotkeys() {
	// focus prev tagnumber on shift-return
	var inputs = Ext.select('input', false, $(editorid)[0]);
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
		UI.editor[editorid].record.addField();
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

function createAuthComboBox(tagelem, xmlReader, displayField, queryIndex, recordSchema) {
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

function setupMarc21AuthorityLiveSearches() {
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
	Ext.select('div[id^=100] .a.subfield-text, div[id^=700] .a.subfield-text, div[id^=600] .a.subfield-text, div[id^=800] .a.subfield-text').each( function(item) {
		createAuthComboBox($(item.dom), pnameXmlReader, 'pname', 'bath.personalName', 'marcxml' );
		return true;
	});
	
	Ext.select('div[id^=110] .a.subfield-text, div[id^=710] .a.subfield-text, div[id^=610] .a.subfield-text, div[id^=810] .a.subfield-text').each( function(item) {
		createAuthComboBox($(item.dom), corpnameXmlReader, 'corpname', 'bath.corporateName', 'marcxml' );
		return true;
	});
	Ext.select('div[id^=111] .a.subfield-text, div[id^=711] .a.subfield-text, div[id^=611] .a.subfield-text, div[id^=811] .a.subfield-text').each( function(item) {
		createAuthComboBox($(item.dom), confnameXmlReader, 'confname', 'bath.conferenceName', 'marcxml' );
		return true;
	});
	Ext.select('div[id^=240] .a.subfield-text, div[id^=130] .a.subfield-text, div[id^=740] .a.subfield-text, div[id^=630] .a.subfield-text').each( function(item) {
		createAuthComboBox($(item.dom), uniformtitleXmlReader, 'title', 'bath.uniformTitle', 'marcxml' );
		return true;
	});
	// subject headings
	Ext.select('div[id^=650] .a.subfield-text').each( function(item) {
		createAuthComboBox( $(item.dom), topicalTermXmlReader, 'topicalterm', 'bath.topicalSubject', 'marcxml' );
		return true;
	});
	Ext.select('div[id^=651] .a .subfield-text').each( function(item) {
		createAuthComboBox($(item.dom), geoTermXmlReader, 'geoterm', 'bath.geographicName', 'marcxml' );
		return true;
	});
	Ext.select('div[id^=655] .a .subfield-text').each( function(item) {
		createAuthComboBox($(item.dom), genreTermXmlReader, 'genreterm', 'bath.genreForm', 'marcxml' );
		return true;
	});
}

function setupFFEditorLangCombo() {
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

function setupFFEditorCtryCombo() {
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
	function createFieldList() {
		for( var i = 0; i<fields.length; i++) {
			fieldlist.push( fields[i].tagnumber() );
		}
	}

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

    function generateVariableFieldsEditor(marcXmlDoc) {
        var html = '';
        var leader = $('leader', marcXmlDoc).text();
        html += '<div class="tag controlfield 000" id="000"><input onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="tagnumber" value="000"><input onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="indicator" value="#"><input onblur="onBlur(this)" onfocus="onFocus(this)" type="text" class="indicator" value="#"><input class="controlfield-text" type="text" size="24" maxlength="24" value="'+leader+'"></div>';
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
            html += 'class="controlfield-text ';
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
        return html;
    }// generateVariableFieldsEditor

	function createFields() {
		// make sure we start w/ empty arrays
		fields.length = 0;
		fieldlist.length = 0;
		var editorfields = $('.tag', editorelem);
		for( var i = 0; i < editorfields.length; i++) {
				var newfield = createField( $(editorfields).eq(i) );
				fields.push(newfield);
				fieldlist.push( $(editorfields).get(i).id.substring(0,3));
		}
		marcrecord = new MarcRecord(fields);
	}
	
	function createField(elem) {
		var newfield;
		var tagnumber = $(elem).children('.tagnumber', UI.editor[editorid].editorelem).eq(0).val();
		var id = $(elem).get(0).id;
		var ind1 = $(elem).children('.indicator', UI.editor[editorid].editorelem).eq(0).val();
		var ind2 = $(elem).children('.indicator', UI.editor[editorid].editorelem).eq(1).val();
		if( tagnumber < '010' ) {
			var value = $(elem).children('.controlfield-text', UI.editor[editorid].editorelem).val();	
			newfield = new Field(tagnumber, ind1, ind2, [{code: '', value: value}]);
		}
		else {
			var editorsubfields = $('[@id='+id+']', UI.editor[editorid].editorelem).children('.subfields').children('.subfield');
			var subfields = new Array();
			for(var j = 0; j < editorsubfields.length; j++) {
				var code = editorsubfields.eq(j).find('.subfield-delimiter').val().substr(1, 1);
				var value = editorsubfields.eq(j).find('.subfield-text').val();
				var newsf = new Subfield(code, value);
				subfields.push(newsf);
			}
            newfield = new Field(tagnumber, ind1, ind2, subfields);
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
    this._toggleFixedFieldDisplay = function toggleFixedFieldDisplay(btn, toggled) {
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
        updateFFEditor();
		$('#'+editorid).find(".ffeditor").show();
		// hide leader and fixed fields
		$('#'+editorid).find("#000", UI.editor[editorid].vared).hide();
		$('#'+editorid).find("#008", UI.editor[editorid].vared).hide();
		$('#'+editorid).find("#006", UI.editor[editorid].vared).hide();
		$('#'+editorid).find("#007", UI.editor[editorid].vared).hide();
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
		$('[@id^='+tag+'] .'+subfield+' .subfield-text', editorelem).val(value);
		update();
	};

	this._getValue = function(tag, subfield) {
		if( subfield != null ) {
			return $('[@id^='+tag+'] .'+subfield+'.subfield-text', editorelem).val();
		}
		else {
			return $('[@id^='+tag+']').children('.controlfield-text', editorelem).val();
		}
	};

	this._rawFields = function() {
		return $('.tag', editorelem);
	};

	this._rawField = function(tagnumber, i) {
		if( !Ext.isEmpty(i) ) {
			return $('.tag', editorelem).filter('[@id*='+tagnumber+']').eq(i);
		}
		else {
			return $('.tag', editorelem).filter('[@id*='+tagnumber+']');
		}
	};

	this._rawSubfields = function(tagnumber, i) {
		if( !Ext.isEmpty(i) ) {
			return $('.tag', editorelem).filter('[@id*='+tagnumber+']').eq(i).children('.subfields').children('.subfield');
		}
		else {
			return $('.tag', editorelem).filter('[@id*='+tagnumber+']').children('.subfields').children('.subfield');
		}
	};

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
			var firstind = ind1 || ' ';
			var secondind = ind2 || ' ';
			var sf = subfields || [ {'delimiter': 'a', 'text': ''} ];
			if(debug) { console.info("Adding tag with tagnumber: " + tagnumber);  }

			// insert the new field in numerical order among the existing tags
			var tags = $(".tag",editorelem  );
			var tagToInsertAfter = $(UI.editor[editorid].lastFocusedEl).parents('.tag'); // the tag just before where we'll insert the new tag
			var highestSuffix = 1; // highest number appended to tag id's with this tag number.  Add 1 to it to get suffix for new tag
			var newSuffix = tags.length +1;
			for( var i = 0; i<tags.length; i++) {
				var id = $(tags[i]).attr('id').substr(0,3);
			}
			var newId = tagnumber + "-" + newSuffix;
			  var newtag = '<div class="tag" id="'+newId+'">';
			  newtag += '<input size="3" onblur="onBlur(this)" onfocus="onFocus(this)" class="tagnumber" id="d'+tagnumber+'" value="'+tagnumber+'" />';
			  newtag += '<input size="1" onblur="onBlur(this)" onfocus="onFocus(this)" size="2" class="indicator" value="'+firstind+'" id="dind1'+newId+'"/>';
			  newtag += '<input size="1" onblur="onBlur(this)" onfocus="onFocus(this)" size="2" class="indicator" value="'+secondind+'" id="dind2'+newId+'"/>';
			if( tagnumber < '010' ) {
				newtag += '<input type="text" onblue="onBlur(this)" onfocus="onFocus(this)" class="controlfield-text '+tagnumber+'" value="">';
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
			$(tagToInsertAfter, editorelem).after(newtag);
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
		var tags = $("div[@id^="+tagnumber+"]", editorelem);
		for( var i = 0; i < tags.length; i++ ) {
			if( tags.get(i).id == id ) {
				return i;
			}
		}
	};

	this._addSubfield = function(tag, index, subfield, value) {
		// get last subfield in this tag
        var tagToAddTo = '';
        var indexOfTag = index ? index : 0;
        if( tag ) {
            tagToAddTo = tag; 
        }
        else {
            tagToAddTo = $(UI.editor[editorid].lastFocusedEl).parents('.tag').children('.tagnumber').val();
        }
		var numsf = $('div[@id^='+tagToAddTo+']', editorelem).eq(indexOfTag).find('.subfield-text').length;
		var lastsf = $('div[@id^='+tagToAddTo+']',editorelem ).eq(indexOfTag).find('.subfield-text').eq(numsf-1);
		var lastFocused = UI.editor[editorid].lastFocusedEl;
        var newid = Ext.id();
        var elToAddAfter = '';
        var newval = value ? value : '';
        // if there are no subfields in this tag
        if( numsf == 0 ) {
            $('div[@id^='+tagToAddTo+']', editorelem).eq(indexOfTag).find('.subfields').append('<span style="display:none"></span>');
            elToAddAfter = $('div[@id^='+tagToAddTo+']', editorelem).eq(indexOfTag).find('.subfields').children('span');
        }
        else {
            elToAddAfter = $(lastFocused).parents('.subfield');
        }
        $(elToAddAfter).after("<span id='subfield-"+newid+"' class='subfield'><input onblur='onBlur(this)' onfocus='onFocus(this)' id='delimiter-"+newid+"' length='2' maxlength='2' class='subfield-delimiter' onblur='onBlur(this)' onfocus='onFocus(this)' value='&Dagger;'><input id='subfield-text-'"+newid+"' onfocus='onFocus(this)' onblur='onBlur(this)' class='subfield-text' value=\""+newval+"\"></span>");
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
		$('[@id^='+tag+']', editorelem).children('.subfields').find('.subfield').remove();
		update();
	};

	this._focusTag = function(tag) {
		$('[@id^='+tag+']', editorelem).children('.tagnumber').focus();
	};

	this._focusSubfield = function(tag, subfield) {
		$('[@id^='+tag+']', editorelem).children('.subfields').children('[@id*='+subfield+']').children('.subfield-text').focus();
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
        html += generateVariableFieldsEditor(marcXmlDoc);
		//UI.editor.progress.updateProgress(.7, 'Datafields editor created');
		html += '</div>'; // end vareditor div
		html += '</div>'; // varfields_editor div
		marcrecord = new MarcRecord(fields);
		createFieldList();
		//UI.editor.progress.updateProgress(.8, 'MarcEditor created');
		htmled = html;
		return html;
	};

    this._postProcess = function() {
        //UI.editor.progress.updateProgress(.9, 'Setting up editor hot keys');
        setupEditorHotkeys();
        //UI.editor.progress.updateProgress(.9, 'Setting up authority control');
        setupMarc21AuthorityLiveSearches();

        // setup comboboxes for ctry and lang fixed fields
        setupFFEditorLangCombo();
        setupFFEditorCtryCombo();
        // set up editor based on any preferences
        if( getPref('ShowFieldBordersInEditor') == "1") {
            addInputOutlines(); 
        }
            
        // show fixed field editor, hide ldr and 008 divs
        $('#'+editorid).find('.ffeditor').show();
        // hide fixed field controlfields
        $('#'+editorid).find("#000, #008, #006, #007").css('display', 'none');
        UI.editor.lastFocusedEl = $('#'+editorid).find('#000').get(0);
        UI.editor[editorid].lastFocusedEl = $('#'+editorid).find('#000').get(0);
    };

    this._processForLocation = function(loc) {
		setupReservedTags( loc);
		setupSpecialEntries( loc);
    }

	this._getEditorHtml = function() {
		return htmled;
	};

}
// Public methods 
MarcEditor.prototype.toggleFixedFieldDisplay = function(btn, toggled) {
    return this._toggleFixedFieldDisplay(btn, toggled);
}
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

MarcEditor.prototype.addSubfield = function(tag, index, subfield, value) {
	this._addSubfield(tag, index, subfield, value);
};

MarcEditor.prototype.focusTag = function(tag) {
	this._focusTag(tag);
};

MarcEditor.prototype.focusSubfield = function(tag, subfield) {
	this._focusSubfield(tag, subfield);
};

MarcEditor.prototype.addField = function(tag, ind1, ind2, subfields) {
	this._addField(tag, ind1, ind2, subfields);
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

MarcEditor.prototype.postProcess = function() {
    return this._postProcess();
}
MarcEditor.prototype.processForLocation = function(loc) {
    return this._processForLocation(loc);
}

MarcEditor.prototype.getToolsMenu = function getToolsMenu() {
    return [
            {
                id: 'toggleFixedFieldGrid',
                editorid: 'editorone',
                text: 'Toggle Fixed Field Editor',
                enableToggle: true,
                pressed: true,
                listeners: {
                    click: function(btn, pressed) {
                        btn.pressed = btn.pressed ? false : true;
                        UI.editor[btn.editorid].record.toggleFixedFieldDisplay(btn, pressed);
                    }
                }
            },
            {
                id: 'addField',
                editorid: 'editorone',
                text: 'Add Field Ctrl-n',
                handler: function(btn) {
                    UI.editor.editorone.record.addField();
                }
            },
            {
                id: 'removeField',
                editorid: 'editorone',
                text: 'Remove Field Ctrl-r',
                handler: function(btn) {
                    UI.editor[btn.editorid].record.deleteField('editorone');
                }
            },
            {
                id: 'addSubfield',
                editorid: 'editorone',
                text: 'Add Subfield Ctrl-m',
                handler: function(btn) {
                    UI.editor[btn.editorid].record.addSubfield();
                }
            },
            {	
                id: 'removeSubfield',
                editorid: 'editorone',
                text: 'Remove subfield Ctrl-d',
                handler: function(btn) {
                    UI.editor[btn.editorid].record.deleteSubfield(btn.editorid);
                }
            }
    ];
} // getToolsMenu

