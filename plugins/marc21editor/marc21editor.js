	// global override to keep user's typed text in combo even when combo selection box is open, per this post: https://extjs.com/forum/showthread.php?t=27026
	(function(){
	    var old = Ext.form.ComboBox.prototype.initEvents;
	    Ext.form.ComboBox.prototype.initEvents = function(){
		old.apply(this, arguments);
		//delete this.keyNav.tab;
		this.keyNav.tab = function(e) {
		    this.collapse();
		    return true;
		}
	    };
	})();
// load in MarcRecord from plugins
$.getScript(libPath + 'plugins/marc21editor/marcrecord.js');
// load in marc21 config files (xml data)
showStatusMsg('Loading marc21 editor files');
Ext.getCmp('editingTreePanel').disable();
var showMarcXslPath = libPath + "plugins/marc21editor//marcxmlpreview.xsl";
var fixedFieldXslPath = libPath + "plugins/marc21editor/fixedfields_editor.xsl";
var varFieldsXslPath = libPath + "plugins/marc21editor/varfields_inputboxes.xsl";
var marc21varfieldsPath = libPath + 'plugins/marc21editor/marc21varfields.xml';
var marc21defsPath = libPath + "plugins/marc21editor/marc21.xml";
var marc21langdefsPath = libPath + 'plugins/marc21editor/languages.xml';
var marc21ctrydefsPath = libPath + 'plugins/marc21editor/countries.xml';
var marc21controlfieldsPath = libPath + 'plugins/marc21editor/marc21controlfields.xml';
var xslpath = $('plugin:contains(MARC21Editor)', configDoc).children('xslpath').text();
// load xsl docs for transforming marcxml
var marcxsl = xslTransform.loadFile(showMarcXslPath);
//var ffxsl = xslTransform.loadFile(fixedFieldXslPath);
var varfxsl = xslTransform.loadFile(varFieldsXslPath);
var marc21defs = xslTransform.loadFile(marc21defsPath);
var marc21langdefs = xslTransform.loadFile(marc21langdefsPath);
var marc21ctrydefs = xslTransform.loadFile(marc21ctrydefsPath);
var marc21varfields = xslTransform.loadFile(marc21varfieldsPath);
var marc21controlfields = xslTransform.loadFile(marc21controlfieldsPath);

showStatusMsg('Loading marc21 editor complete');
clearStatusMsg();
Ext.getCmp('editingTreePanel').enable();

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

var pnameSettings = {
		xmlReader: pnameXmlReader
		,displayField:'pname'
		,queryIndex:'bath.personalName'
		,recordSchema:'marcxml'
	};

var corpnameSettings = {
		xmlReader: corpnameXmlReader
		,displayField:'corpname'
		,queryIndex:'bath.corporateName'
		,recordSchema:'marcxml'
};
var confnameSettings = {
		xmlReader: confnameXmlReader
		,displayField:'confname'
		,queryIndex:'bath.conferenceName'
		,recordSchema:'marcxml'
};
var uniformTitleSettings = {
		xmlReader: uniformtitleXmlReader
		,displayField:'title'
		,queryIndex:'bath.uniformTitle'
		,recordSchema:'marcxml'
};
var topicalSettings = {
		xmlReader: topicalTermXmlReader
		,displayField:'topicalterm'
		,queryIndex:'bath.topicalSubject'
		,recordSchema:'marcxml'
};
var geoTermSettings = {
		xmlReader: geoTermXmlReader
		,displayField:'geoterm'
		,queryIndex:'bath.geographicName'
		,recordSchema:'marcxml'
};
var genreTermSettings = {
		xmlReader: genreTermXmlReader
		,displayField:'genreterm'
		,queryIndex:'bath.genreForm'
		,recordSchema:'marcxml'
};
var authMap = {
	100: pnameSettings
	,700: pnameSettings
	,600:pnameSettings
	,800:pnameSettings
	,110: corpnameSettings
	,710: corpnameSettings
	,610:corpnameSettings
	,810:corpnameSettings
	,111:confnameSettings
	,711:confnameSettings
	,611:confnameSettings
	,811:confnameSettings
	,240:uniformTitleSettings
	,130:uniformTitleSettings
	,740:uniformTitleSettings
	,630:uniformTitleSettings
	,650:topicalSettings
	,651:geoTermSettings
	,655:genreTermSettings
};

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
	var desc = $("#Desc", ff_ed ).val();
	var multi = $("#Multipart", ff_ed ).val();
	var entry = '4500'; // entry
   	leaderval = leaderval.concat( rlen, rstat, type, blvl, ctrl, encode, indc, subc, base, elvl, desc, multi, entry);	
	if( leaderval.length != 24 ) {
		throw {
			error: "InvalidLeader",
			msg: "Invalid length of Leader",
            length: leaderval.length,
            leaderval: leaderval
		};
	}
    return leaderval;
}


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

function get008FromEditor(ff_ed, rectype) {
		var tag008val = '';
		var mattype = get008MaterialName(rectype);
        if(bibliosdebug) {
            console.debug('get008FromEditor: ' + rectype + ' ' + mattype);
        }
        $('mattypes mattype[@value=008All00-17] position', marc21defs).each( function(i) {
				var type = $(this).text();
                type = type.replace(' ', '_');
                var length = $('field[@tag=008] value[@name='+type+']', marc21defs).attr('length');
				var value = '';
				if( type.substr(0, 5) == 'Undef') {
					var length = type.substr(5,1);
					for( var k = 0; k<length; k++) {
						value += ' ';
					}
				}
				else {
					value = $(ff_ed).find('#'+type).val() || ' ';
                    if( value.length < length ) {
                        if(bibliosdebug) {
                            console.debug('Padding ' + type + ' to length: ' + length);
                        }
                        for( var j = value.length; j < length; j++) {
                            value += ' ';
                        }
                    }
				}
                if(bibliosdebug) {
                    console.debug('get008fromEditor: type: ' + type + ' length: ' + length + ' value: \"' + value + '\"' + ' length: ' + value.length);
                }
				tag008val += value;
			});
			$('mattypes mattype[@value='+mattype+'] position', marc21defs).each( function(i) {
				var type = $(this).text();
                type = type.replace(' ', '_');
                var length = $('field[@tag=008] value[@name='+type+']', marc21defs).attr('length');
				var value = '';
				if( type.substr(0, 5) == 'Undef') {
					var length = type.substr(5,1);
					for( var k = 0; k<length; k++) {
						value += ' ';
					}
				}
				else {
					value = $(ff_ed).find('#'+type).val() || '';
                    if( value.length < length ) {
                        if(bibliosdebug) {
                            console.debug('Padding ' + type + ' to length: ' + length);
                        }
                        for( var j = value.length; j < length; j++) {
                            value += ' ';
                        }
                    }
				}
                if(bibliosdebug) {
                    console.debug('get008fromEditor: type: ' + type + ' value: \"' + value + '\"' + ' length: ' + value.length);
                }
				tag008val += value;
			});
            $('mattypes mattype[@value=008All35-39] position', marc21defs).each( function(i) {
                    var type = $(this).text();
                    type = type.replace(' ', '_');
                    var length = $('field[@tag=008] value[@name='+type+']', marc21defs).attr('length');
                    var value = '';
                    if( type.substr(0, 5) == 'Undef') {
                        var length = type.substr(5,1);
                        for( var k = 0; k<length; k++) {
                            value += ' ';
                        }
                    }
                    else {
                        value = $(ff_ed).find('#'+type).val() || '';
                        if( value.length < length ) {
                            if(bibliosdebug) {
                                console.debug('Padding ' + type + ' to length: ' + length);
                            }
                            for( var j = value.length; j < length; j++) {
                                value += ' ';
                            }
                        }
                    }
                    if(bibliosdebug) {
                        console.debug('get008fromEditor: type: ' + type + ' value: \"' + value + '\"' + ' length: ' + value.length);
                    }
                    tag008val += value;
                });
	if( tag008val.length != 40 ) {
		throw {
			error: "Invalid008",
			msg: "Invalid length of 008",
            tag008val: tag008val,
            length: tag008val.length
		};
	}
    return tag008val;
}

function get006FromEditor(tr, rectype) {
		var tag006val = rectype;
		var mattype = get008MaterialName(rectype);
        if(bibliosdebug) {
            console.debug('get006fromEditor: mattype: ' + mattype );
        }
		$('mattypes mattype[@value='+mattype+'] position', marc21defs).each( function(i) {
			var type = $(this).text();
            type = type.replace(' ', '_');
			if( type.substr(0, 5) == 'Undef') {
				var length = type.substr(5,1);
				for( var k = 0; k<length; k++) {
					tag006val += ' ';
				}
			}
            else {
                tag006val += $(tr).find('#'+type).val();
            }
            if(bibliosdebug) {
                console.debug('get006fromEditor: type: ' + type + ' value: \"' + tag006val + '\"' + ' length: ' + tag006val.length);
            }
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

function get007FromEditor(tr, cat, mattype) {
    if(bibliosdebug){'get007FromEditor: category: ' + cat}
	var tag007val = cat;
    if(bibliosdebug) {
        console.debug('get007FromEditor: ' + cat + ' ' + mattype);
    }
    $('field[@tag=007][@mattype='+mattype+']', marc21defs).each( function(i) {
        $('value', this).each( function(j) {
            var type = $(this).attr('name');
            type = type.replace(' ', '_');
            var value = '';
            if( type == 'Undefined') {
                var length = $(this).attr('length');
                for( var k = 0; k<length; k++) {
                    value += ' ';
                }
            }
            else {
                value = $(tr).find('#'+type).val() || '';
            }
            if(bibliosdebug) {
                console.debug('get007FromEditor: type: ' + type + ' value: ' + value);
            }
            tag007val += value;
        }); // loop through positions in 007
    });
			return tag007val;
}

function doRecordOptions() {

}

function doMerge() {

}








function onFocus(elem) {
    //console.info(elem);
	$(elem).addClass('focused');
    // is this a subfield delimiter?
    var nodeName = $(elem).get(0).nodeName;
	var editorid = Ext.getCmp('editorTabPanel').getActiveTab().editorid;
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
	if( $(elem).parents('.fixedfields_editor').length > 0 ) {
		var name = $(elem).get(0).id;
        // replace underscores in html id with blank spaces, as this is how fixed fields editor generates
        name = name.replace('_',' ');
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
		var rectype = $('div.000').children('.controlfield-text').val().substr(6,1);
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
            if(bibliosdebug){
                console.debug('showTagHelp 007: ' + mattype);
            }
		}
		else if( $(elem).hasClass('006') ) {
			tag = '008';
			mattype = get008MaterialName(rectype);
            if(bibliosdebug){
                console.debug('showTagHelp 006: ' + mattype);
            }
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
	var editorid = Ext.getCmp('editorTabPanel').getActiveTab().editorid;
	//UI.editor[editorid].record.update(elem);
	UI.editor.lastEditorId = editorid;
	UI.editor.lastFocusedEl = elem;
	UI.editor[editorid].lastFocusedEl = elem;
}








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


function MarcEditor(editorid) {
	// private
	var that = this;
    var editorid = editorid;
    this.editorid = editorid;
    var editorelem = $('#'+editorid);
    this.editorelem = editorelem;
    this.showffeditor = true;
	var htmled = '';	
	var lastFocusedEl;
	var currFocusedEl;
	var fieldlist = new Array();
	var fields = new Array();
	var marcrecord = null;

	// private methods

    this._getMarcRecord = function() {
	update();
        return marcrecord;
    }
function getFFTagFromPopup(tagnumber, rectype, ffid) {
    var html = $('#'+ffid);
    var value = '';
    if(bibliosdebug){
        console.debug('getFFTagFromPopup: ' + tagnumber + ' ' + rectype + ' ' + ffid);
    }
    if( tagnumber == '000' ) {
        try {
            var leaderval = getLeaderFromEditor(html);
        } catch(ex) {
            if(bibliosdebug){ console.debug('transferFF_EdToTags: exception ' + ex.error + ' ' + ex.msg + ' ' + ex.length) }
        }    
            if(bibliosdebug){console.info('Transferring leader value from fixed field editor into leader tag: ' + leaderval);}
            value = leaderval;
        
    }
    else if( tagnumber == '008' ) {
        var tag008val = '';
        try {
            tag008val += get008FromEditor( html, rectype );
        }
        catch(ex) {
            if(bibliosdebug){ console.debug('transferFF_EdToTags: exception ' + ex.error + ' ' + ex.msg + ' ' + ex.length) }
        }
            if(bibliosdebug){console.info('Transferring 008 value from fixed field editor into 008 tag: ' + tag008val);}
            value = tag008val;
    }
    else if( tagnumber == '006' ) {
        try {
            var tag006val = get006FromEditor(html, rectype);
        } catch(ex) {
            if(bibliosdebug){ console.debug(ex);}
        }
            if(bibliosdebug){console.info('Transferring 006 value from fixed field editor into 006 tag: ' + tag006val);}
        value = tag006val;
    }
    else if( tagnumber == '007' ) {
        try {
            var mattype = get007MaterialName(rectype);
            var tag007val = get007FromEditor(html, rectype, mattype);
        } catch(ex) {
            if(bibliosdebug){ console.debug('transferFF_EdToTags: exception ' + ex.error + ' ' + ex.msg + ' ' + ex.length) }
        }
            if( bibliosdebug ) { console.debug('getFFTagFromPopup: 007: ' + rectype + ' ' + mattype + ' ' + tag007val) }
            if(bibliosdebug){console.info('Transferring 007 value from fixed field editor into 007 tag: ' + tag007val);}
            value = tag007val;
	}
    if(bibliosdebug){ console.debug('getFFTagFromPopup: ' + value)}
    return value;
}

function setupSpecialEntries(loc) {
    if(bibliosdebug) {
	console.debug('setupSpecialEntries for location ' + loc);
    }
    if( Prefs.remoteILS[loc] && Prefs.remoteILS[loc].instance && Prefs.remoteILS[loc].instance.special_entries ) {
        var specialentries = Prefs.remoteILS[loc].instance.special_entries;
        for( var i = 0; i < specialentries.length; i++) {
            var entry = specialentries.eq(i);
            var tagnumber = $('field tag', entry).text();	
            var subfield = $('field/subfield', entry).text();	
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
            if(bibliosdebug) { console.info('Applying combobox to '+tagnumber+' '+subfield+' with current value of ' +currentValue + ' for special entry');}
            var store = new Ext.data.SimpleStore({
                fields: ['code', 'desc'],
                data: storevalues
            });
            var cb = new Ext.form.ComboBox({
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
                hideTrigger: !Ext.isIE7,
                applyTo: $(elemToReplace).get(0)
            });
            Ext.ComponentMgr.register(cb);
            if(bibliosdebug) { console.info('Applying combobox to '+tagnumber+' '+subfield+' with current value of ' +currentValue + ' for special entry');}
        }
    }
}

function setupReservedTags(loc) {
    if(bibliosdebug) {
	console.debug('setupReservedTags for location: ' + loc);
    }
    if( Prefs.remoteILS[loc] && Prefs.remoteILS[loc].instance && Prefs.remoteILS[loc].instance.reserved_tags ) {
        var reservedtags = Prefs.remoteILS[loc].instance.reserved_tags;
        for( var i = 0; i< reservedtags.length; i++) {
            var tagnumber = $(reservedtags).eq(i).text();
            // set readonly for tagnumber and indicators
            $('.'+tagnumber, editorelem).find('input').attr('readonly', 'readonly').addClass('reserved_tag');
            // set readonly for subfields
            $('.'+tagnumber, editorelem).find('.subfield').children('input').attr('readonly', 'readonly').addClass('reserved_tag');
        }	
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
		UI.editor[editorid].record.addSubfield();
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
		var editorid = Ext.getCmp('editorTabPanel').getActiveTab().editorid;
		if( editorid == '' || editorid == null) {
			Ext.MessageBox.alert('Error', 'Please click in the editor you wish to save before using the save hotkey');	
		}
		doSaveLocal(UI.currSaveFile, editorid);
	});
}

function createAuthComboBox(tagelem, xmlReader, displayField, queryIndex, recordSchema) {
	var subfield_text = $(tagelem);
	if( subfield_text.length == 0 ) {
		if(bibliosdebug) {
			console.debug('subfield length is 0...quitting');
		}
		return;
	}
	if(bibliosdebug) {console.info('applying combobox to '+ $(subfield_text).val() ); }
	var ds = new Ext.data.Store({
		proxy: new Ext.data.HttpProxy(
			{
				url: sruauthcgiurl,
				method: 'GET',
				disableCaching: false
			
			}),
		baseParams: {
                                sruurl: sruauthurl,
								version: '1.1',
								operation: 'searchRetrieve',
								recordSchema: recordSchema,
								maximumRecords: '100'
		},
		reader: xmlReader 
	});
	var cb = new Ext.form.ComboBox({
		store: ds,
		typeAhead: false,
		typeAheadDelay: 500,
		allQuery: 'a',
		queryParam: 'query',
		queryIndex: queryIndex,
		editable: true,
		forceSelection: false,
		triggerAction: 'all',
		mode: 'remote',
		selectOnFocus: true,
		hideTrigger: !Ext.isIE7,
		displayField: displayField,
		listWidth: 200,
		loadingText: 'Searching...',
		cls: 'authority-field',
		lazyRender: false,
		applyTo: $(subfield_text).get(0).id
	});
	cb.on('beforequery', function(combo, query, forceAll, cancel, e) {
		combo.query = combo.combo.queryIndex + "=" + combo.query + '*';
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
				combo.setRawValue(value);	
				combo.syncSize();
				combo.focus();
			}
			// add new one if we have a value for it
			else if( value != '' || null ) {
                var newid = Ext.id();
                $(tag).find('.subfield:last').after("<span id='subfield-"+newid+"' class='subfield'>&Dagger;<input onblur='onBlur(this)' onfocus='onFocus(this)' id='delimiter-"+newid+"' length='1' maxlength='1' class='subfield-delimiter' onblur='onBlur(this)' onfocus='onFocus(this)' value='"+subfieldcode+"'><input id='subfield-text-'"+newid+"' onfocus='onFocus(this)' onblur='onBlur(this)' class='subfield-text' value=\""+value+"\"></span>");
                if(bibliosdebug) {
                    console.debug('adding subfield to ' + $(tag) + ' with value ' + value);
                }
            }
            UI.editor[editorid].record.setupSubfieldDelimiterFocus();
		}
		UI.editor[editorid].cbOpen = false;
                try {
                  if(Ext.isIE7 || Ext.isIE6 ) {
                    var authrecxmlserialized = record.node.transformNode(marcxsl);
                  }
                  else {
		    var authrecxml = xslTransform.transform(marcxsl, record.node, {}).doc;
		    var authrecxmlserialized = xslTransform.serialize( authrecxml );

                  }
                }
                catch(ex) {
                  if(bibliosdebug) {
                    console.info(ex);
                  }
                }
		Ext.QuickTips.register({
			target: cb.initialConfig.applyTo,
			    title: 'Authority Record',
			    text: authrecxmlserialized,
			    width: 300
			    ,showDelay: 0
			    ,dismissDelay: 12000
	
			    });
	
		biblios.app.viewport.doLayout();
	    });
	cb.on('specialkey', function(cb, e) {
		if( e.getKey() == Ext.EventObject.ENTER ) {
		    e.stopEvent();
		}
		else if( e.getKey() == Ext.EventObject.TAB ) {
		    if(bibliosdebug) {
			console.debug('marc21editor: tabbing out of auth combo now');
		    }
		    cb.collapse();
		}
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
		hideTrigger: !Ext.isIE7,
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
			var editorsubfields = $(elem).children('.subfields').children('.subfield');
			var subfields = new Array();
			for(var j = 0; j < editorsubfields.length; j++) {
				var code = editorsubfields.eq(j).find('.subfield-delimiter').val().substr(0, 1);
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

    this._reformatFixedFieldsEditor = function _reformatFixedFieldsEditor() {
        var var_ed = $('#'+editorid).find(".vareditor");
        Ext.get(editorid).mask('Reformatting fixed fields editor for new record type');
        transferFF_EdToTags(ff_ed, var_ed, editorid);
        UI.editor[editorid].record.update();
        var xml = UI.editor[editorid].record.XMLString();
        $.ajax({
            url: cgiDir + 'xsltransform.pl',
            type: 'POST',
            editorid: editorid,
            dataType: 'html',
            data: {xml:xml, stylesheet: 'fixedfields_editor.xsl', xslpath: xslpath, editorid: editorid},
            success: function(html) {
                $('#'+this.editorid).find('.ffeditor').html(html);
                Ext.get(editorid).unmask();
                // set change event for Type fixed fields select dropdown
                $('#'+editorid).find('#Type').change(function() {
                    var editorid = Ext.getCmp('editorTabPanel').getActiveTab().editorid;
                    UI.editor[editorid].reformatFixedFieldsEditor();
                });
                $('#'+this.editorid).find('.ffeditor').show();
            },
            error: function(req, textStatus, errorThrown) {
                if(bibliosdebug){
                    console.debug(req + ' ' + textStatus + ' ' + errorThrown);
                }
            }
        });

    };

    this._toggleFixedFieldDisplay = function toggleFixedFieldDisplay() {
        UI.editor[editorid].record.showffeditor  = UI.editor[editorid].record.showffeditor ? false : true;
        var var_ed = $('#'+editorid).find(".vareditor");
        if( UI.editor[editorid].record.showffeditor == false ) {
            var items = Ext.getCmp( UI.editor[editorid].tabid ).items;
            for( var i = 0; i < items.length; i++) {
                items.itemAt(i).hide();
            }
                $('#'+editorid).find('.varfields_editor').find(".000, .001, .003, .005, .006, .007, .008", UI.editor[editorid].vared).show();
        }
        else {
            this._updateFixedFieldToolbars();
            var items = Ext.getCmp( UI.editor[editorid].tabid ).items;
            for( var i = 0; i < items.length; i++) {
                items.itemAt(i).show();
            }
            $('#'+editorid).find('.varfields_editor').find(".000, .001, .003, .005, .006, .007, .008", UI.editor[editorid].vared).hide();
        }
    }

    this.showFFPopup = function(tagnumber, tagvalue, tagel, itemid) {
        if(bibliosdebug){ 
            console.debug('showFFPopup: ' + tagnumber + ' ' + tagvalue + ' ' + itemid); 
        }
        if( tagnumber == '008' ) {
            var rectype = $('#'+editorid).find('div.000').children('.controlfield-text').val().substr(6,1);
        }
        else if( tagnumber == '006') {
            var rectype = $(tagel).val().substr(0,1);
        }
        else if( tagnumber == '007') {
            var rectype = $(tagel).val().substr(0,1);
        }
        $.ajax({
            url: cgiDir + 'xsltransform.pl',
            type: 'POST',
            editorid: editorid,
            ffdata: {
                tagnumber: tagnumber,
                tagel: tagel,
                itemid: itemid
            },
            rectype: rectype,
            dataType: 'html',
            data: {xml:this.getFFXML(tagnumber, tagvalue), stylesheet: 'fixedfields_editor.xsl', xslpath: xslpath, editorid: editorid, rectype:rectype},
            success: function(html) {
                var win = new Ext.Window({
                    html: html,
					autoHeight: true,
					autoScroll: true,
					border: false,
					constrain:true,
					shadow:false,
					shim:false,
                    id: (winid=Ext.id()),
                    tbar: [
                        {
                            text: 'Save',
                            editorid: this.editorid,
                            tagnumber: this.ffdata.tagnumber,
                            rectype: this.rectype,
                            itemid:this.ffdata.itemid,
                            winid: winid,
                            tagel: this.ffdata.tagel,
                            handler: function(btn) {
                                var newvalue = getFFTagFromPopup(btn.tagnumber, btn.rectype, btn.winid);
                                if(bibliosdebug){ console.debug('setting raw value for ' + $(btn.tagel).val()) }
                                $(btn.tagel).val(newvalue);
                                if( btn.tagnumber == '000') {
                                    tag = 'LDR';
                                }
                                else {
                                    tag = btn.tagnumber;
                                }
                                Ext.getCmp(btn.itemid).setText( '<span class="fftbarfield">'+tag+'</span>' + ' ' + newvalue );
                                Ext.getCmp(btn.itemid).tagvalue = newvalue;
                                Ext.WindowMgr.getActive().close();
                            }

                        },
                        {
                            text: 'Cancel',
                            i: this.i,
                            ffid: this.editorid+'-'+this.tagnumber+'-'+'ffpopup'+'-'+this.i,
                            handler: function(btn) {
                                Ext.WindowMgr.getActive().close();
                            }
                        },
                        {
                            text: 'Delete',
                            editorid: this.editorid,
                            tagnumber: this.ffdata.tagnumber,
                            rectype: this.rectype,
                            itemid:this.ffdata.itemid,
                            hidden: this.ffdata.tagnumber == '008' || this.ffdata.tagnumber == '000' ? true : false,
                            tagel: this.ffdata.tagel,
                            handler: function(btn) {
                                $(btn.tagel).parents('.tag').remove();
                                UI.editor[btn.editorid]['tbar'+btn.tagnumber].remove(Ext.getCmp(btn.itemid));
                                Ext.WindowMgr.getActive().close();
                            }
                        }
                    ]
                });
                if( tagnumber == '008' ) {
                    win.on('show', function(win) {
                        //setupFFEditorCtryCombo();
                        //setupFFEditorLangCombo();
                    });
                }
                win.on('show', function(win) {
                    formatFixedFieldsPopupWidth(9);
                    win.doLayout();
                    win.setPosition(200,200);
                });
                win.show();
            },
            error: function(req, textStatus, errorThrown) {
                if(bibliosdebug){
                    console.debug(req + ' ' + textStatus + ' ' + errorThrown);
                }
            }
        });
    }

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
		if( subfield != null ) {
			return $('.'+tag, editorelem).find('.subfield-text'+'.'+subfield).val(value)
		}
		else {
			return $('.'+tag, editorelem).find('.controlfield-text').val(value);
		}
		update();
	};

	this._getValue = function(tag, subfield) {
		if( subfield != null ) {
			return $('.'+tag, editorelem).find('.subfield-text'+'.'+subfield).val()
		}
		else {
			return $('.'+tag, editorelem).find('.controlfield-text').val();
		}
	};

	this._rawFields = function() {
		return $('.tag', editorelem);
	};

	this._rawField = function(tagnumber, i) {
		if( !Ext.isEmpty(i) ) {
			return $('.tag.'+tagnumber, editorelem).eq(i);
		}
		else {
			return $('.tag.'+tagnumber, editorelem).eq(0);
		}
	};

	this._rawSubfields = function(tagnumber, i) {
		if( !Ext.isEmpty(i) ) {
			return $('.tag.'+tagnumber, editorelem).find('.subfield').get(i);
		}
		else {
			return $('.tag.'+tagnumber, editorelem).find('.subfield').get(0);
		}
	};

    this._getNextField = function(tagnumber) {
        var fields = fieldlist;
        var lastseen = '';
        if(bibliosdebug){
            console.debug('_getNextField(): fields: ' + fields);
        }
        for( var i = 0; i < fields.length; i++) {
            if( tagnumber >= fields[i] ) {
                lastseen = fields[i];
            }
            else if( tagnumber < fields[i]) {
                var lasttagnumber = lastseen;
                if(bibliosdebug){
                    console.debug('_getNextField(): found tag greater than ' + tagnumber + 'at position ' + i + 'previous field was: ' + lasttagnumber);
                }
                var el = $('#'+editorid).find('div.'+lasttagnumber);
                return el;
            }
        }

    }

	this._addField = function(tagnumber, ind1, ind2, subfields) {
		if( tagnumber ) {
			return doAddField(tagnumber, ind1, ind2, subfields);
		}
		else {
			Ext.MessageBox.prompt('Add tag', 'Choose a tag number', function(btn, tagnumber) {
				return doAddField(tagnumber);
			});
		}
		function doAddField(tagnumber, ind1, ind2, subfields) {
            // get length of already exisitng tags -- for use when adding 006/007
            var lengthOfPrevious = $('#'+editorid).find('div.'+tagnumber).length;
			var firstind = ind1 || ' ';
			var secondind = ind2 || ' ';
			var sf = subfields || [ {'delimiter': 'a', 'text': ''} ];
			if(bibliosdebug) { console.info("Adding tag with tagnumber: " + tagnumber + 'ind1: ' + ind1 + 'ind2: ' +ind2 + 'subfields: ' + sf[0].delimiter + ' ' + sf[0].text);  }

			// insert the new field in numerical order among the existing tags
			var tags = $(".tag",editorelem  );
            var tagToInsertAfter = '';
            if( $(UI.editor[editorid].lastFocusedEl).parents('.tag').length == 0 ) {
                tagToInsertAfter = UI.editor[editorid].record.getNextField( tagnumber );
            }
            else {  
                tagToInsertAfter = $(UI.editor[editorid].lastFocusedEl).parents('.tag'); // the tag just before where we'll insert the new tag
            }
            if(bibliosdebug) {
                console.debug('addField: adding to ' + tagToInsertAfter);
            }
			var highestSuffix = 1; // highest number appended to tag id's with this tag number.  Add 1 to it to get suffix for new tag
			var newSuffix = tags.length +1;
			for( var i = 0; i<tags.length; i++) {
				var id = $(tags[i]).attr('id').substr(0,3);
			}
			var newId = tagnumber + "-" + Ext.id() + editorid;
			  var newtag = '<div class="tag '+tagnumber+'" id="'+newId+'">';
			  newtag += '<input size="3" onblur="onBlur(this)" onfocus="onFocus(this)" class="tagnumber" id="d'+tagnumber+editorid+'" value="'+tagnumber+'" />';
			  newtag += '<input size="1" onblur="onBlur(this)" onfocus="onFocus(this)" size="2" class="indicator" value="'+firstind+'" id="dind1'+newId+'"/>';
			  newtag += '<input size="1" onblur="onBlur(this)" onfocus="onFocus(this)" size="2" class="indicator" value="'+secondind+'" id="dind2'+newId+'"/>';
			if( tagnumber < '010' ) {
				newtag += '<input type="text" onblue="onBlur(this)" onfocus="onFocus(this)" class="controlfield-text '+tagnumber+'" value="'+sf[0].text+'">';
			} // insert controlfield
			else {
			  newtag += '<span class="subfields" id="dsubfields'+newId+'">';
			  for( var i = 0; i< sf.length; i++) {
				  newtag += '<span class="subfield" id="dsubfields'+tagnumber+newId+'">';
                  newtag += '&Dagger;';
				  newtag += '<input onblur="onBlur(this)" onfocus="onFocus(this)" class="subfield-delimiter" maxlength="1" size="1" value="'+sf[i]['delimiter']+'">';
				  var textlength = sf[i]['text'].length;
				  newtag += '<input id="dsubfields'+newId+i+'text" onfocus="onFocus(this)" onblur="onBlur(this)" class="subfield-text a" size="'+textlength+'" value="'+sf[i]['text']+'">';
				}
			} // insert datafield
			// insert out new tag after the tag we just found
			$(tagToInsertAfter, editorelem).after(newtag);
            Ext.getCmp('editorTabPanel').getActiveTab().doLayout();
            if( getPref('ShowFieldBordersInEditor') == "1") {
                addInputOutlines(); 
            }
			update();
            this._setupSubfieldDelimiterFocus();
            // if user is adding an 006 or 007, add a new tbar item to the appropriate fixed fields tbar
            if( tagnumber == '006' || tagnumber == '007' ) {
                if(bibliosdebug) {
                    console.debug('marc21editor addField: adding toolbar for ' + tagnumber);
                }
                Ext.getCmp(editorid+tagnumber+'tbar').add(
                    {
                        id: editorid+'-'+tagnumber+'-'+lengthOfPrevious,
                        text: '<span class="fftbarfield">'+tagnumber+'</span> ' + '                 ',
                        tagvalue: '                 ',
                        tagnumber: tagnumber,
                        tagel: $('#'+newId).children('.controlfield-text'),
                        itemid: editorid+'-'+tagnumber+'-'+lengthOfPrevious,
                        scope: UI.editor[editorid].record,
                        handler: function(btn ) {
                            this.showFFPopup( btn.tagnumber, $(btn.tagel).val(),btn.tagel, btn.itemid );
                        }
                    }
                );
                biblios.app.viewport.doLayout();
            }
		
	    //setupMarc21AuthorityLiveSearches();
		if( authMap[tagnumber] ) {
			if(bibliosdebug) {
				console.debug('adding combo to newly added tag: ' + tagnumber);
			}
			/*createAuthComboBox($('#'+newId).find('.subfield-text').get(0).id,
								authMap[tagnumber].xmlReader,
								authMap[tagnumber].displayField,
								authMap[tagnumber].queryIndex,
								authMap[tagnumber].recordSchema
								);*/
								
			var cb = new Ext.form.ComboBox({
				applyTo: $('#'+newId).find('.subfield-text').get(0).id
				,store: new Ext.data.Store({
					proxy: new Ext.data.HttpProxy({
						url: sruauthcgiurl
						,method:'GET'
						,disableCaching:false
					})
					,baseParams: {
						sruurl: sruauthurl,
						version: '1.1',
						operation: 'searchRetrieve',
						recordSchema: authMap[tagnumber].recordSchema,
						maximumRecords: '100'
					},
					reader: authMap[tagnumber].xmlReader
				}) // store
				,listWidth:200
				,mode:'remote'
				,hideTrigger:!Ext.isIE7
				,cls:'authority-field'
				,typeAhead: false
				,typeAheadDelay: 500
				,allQuery: 'a'
				,queryParam: 'query'
				,queryIndex: authMap[tagnumber].queryIndex
				,editable: true
				,forceSelection: false
				,triggerAction: 'all'
				,selectOnFocus: true
				,displayField: authMap[tagnumber].displayField
				,loadingText: 'Searching...'
			});
		}
	cb.on('beforequery', function(combo, query, forceAll, cancel, e) {
		combo.query = combo.combo.queryIndex + "=" + combo.query + '*';
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
				combo.setRawValue(value);	
				combo.syncSize();
				combo.focus();
			}
			// add new one if we have a value for it
			else if( value != '' || null ) {
                var newid = Ext.id();
                $(tag).find('.subfield:last').after("<span id='subfield-"+newid+"' class='subfield'><input onblur='onBlur(this)' onfocus='onFocus(this)' id='delimiter-"+newid+"' length='2' maxlength='2' class='subfield-delimiter' onblur='onBlur(this)' onfocus='onFocus(this)' value='&Dagger;"+subfieldcode+"'><input id='subfield-text-'"+newid+"' onfocus='onFocus(this)' onblur='onBlur(this)' class='subfield-text' value=\""+value+"\"></span>");
                if(bibliosdebug) {
                    console.debug('adding subfield to ' + $(tag) + ' with value ' + value);
                }
            }
		}
		UI.editor[editorid].cbOpen = false;
		var authrecxml = xslTransform.transform(marcxsl, record.node, {}).doc;
		var authrecxmlserialized = xslTransform.serialize( authrecxml );
		Ext.QuickTips.register({
			target: cb.initialConfig.applyTo,
			    title: 'Authority Record',
			    text: authrecxmlserialized,
			    width: 300
			    ,showDelay: 0
			    ,dismissDelay: 12000
	
			    });
	
		biblios.app.viewport.doLayout();
	    });
	cb.on('specialkey', function(cb, e) {
		if( e.getKey() == Ext.EventObject.ENTER ) {
		    e.stopEvent();
		}
		else if( e.getKey() == Ext.EventObject.TAB ) {
		    if(bibliosdebug) {
			console.debug('marc21editor: tabbing out of auth combo now');
		    }
		    cb.collapse();
		}
	});
	cb.on('expand', function(cb, e) {
		UI.editor[editorid].cbOpen = true;
	});
	cb.on('hide', function(cb, e) {
	});
	UI.editor[editorid].comboboxes.push(cb);
	    

			// set the focus to this new tag
			//$( newId ).get(0).focus();
            return newId;
		}
	};

	this._deleteField = function(editorid, tagnumber, i) {
		//if(bibliosdebug) { console.info('removing tag: ' + $(UI.editor.lastFocusedEl).parents('.tag').get(0).id)}
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
            if( $(UI.editor[editorid].lastFocusedEl).parents('.tag').children('.tagnumber').length == 0 ) {
                Ext.Msg.alert('Error', "Please click in the subfield you'd like to add a subfield after and then re-run this command");
                return false;
            }
            else {  
                tagToAddTo = $(UI.editor[editorid].lastFocusedEl).parents('.tag').children('.tagnumber').val();
            }
        }
        if(bibliosdebug) {
            console.debug('addSubfield: adding to ' + tagToAddTo);
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
        $(elToAddAfter).after("<span id='subfield-"+newid+"' class='subfield'>&Dagger;<input onblur='onBlur(this)' onfocus='onFocus(this)' id='delimiter-"+newid+"' length='1' maxlength='1' class='subfield-delimiter' onblur='onBlur(this)' onfocus='onFocus(this)' value=''><input id='subfield-text-'"+newid+"' onfocus='onFocus(this)' onblur='onBlur(this)' class='subfield-text' value=\""+newval+"\"></span>");
        this._setupSubfieldDelimiterFocus();
        Ext.getCmp('editorTabPanel').getActiveTab().doLayout();
	};

	this._deleteSubfield = function(editorid, tag, index, subfield) {
		if(bibliosdebug) { console.info('removing subfield with text: ' + $(UI.editor.lastFocusedEl).val());}
		// remove current subfield
		$(UI.editor[editorid].lastFocusedEl).parents('.subfield').remove();
		update();
	};

	this._deleteSubfields = function(tag) {
		$('.'+tag, editorelem).find('.subfield').remove();
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

    this._loadXmlXSL = function(marcXmlDoc, callback) {
        $.ajax({
            url: cgiDir + 'xsltransform.pl', 
            type: 'POST',
            callback: callback,
            editorid: editorid,
            dataType: 'html',
            data: {
                xml: xslTransform.serialize(marcXmlDoc), 
                stylesheet: 'marc21editor.xsl', 
                xslpath: xslpath,
                editorid: editorid
            }, 
            success: function(html) {
                this.callback.call(this, html, this.editorid); 
            },
            error: function(req, textStatus, errorThrown) {
                if(bibliosdebug){
                    console.debug(req + ' ' + textStatus + ' ' + errorThrown);
                }
            }
        });
    };

	this._loadXmlJS = function(marcXmlDoc, callback) {
		var html = '';
		html += '<div class="vareditor">';
		html += '<div class="varfields_editor">';
        html += generateVariableFieldsEditor(marcXmlDoc);
		//UI.editor.progress.updateProgress(.7, 'Datafields editor created');
		html += '</div>'; // end vareditor div
		html += '</div>'; // varfields_editor div
        html += '</div>'; // marceditor div
		marcrecord = new MarcRecord(fields);
		createFieldList();
		//UI.editor.progress.updateProgress(.8, 'MarcEditor created');
		htmled = html;
	    callback.call(this, html, editorid);
	};

    this._postProcessXsl = function() {

    }
    
    this._postProcess = function() {
        this._postProcessJs();
    }

    this.getFFXML = function(tagnumber, tagvalue) {
        if( tagnumber == '000' ) {
         return '<record xmlns="http://www.loc.gov/MARC21/slim"><leader>'+tagvalue+'</leader></record>';
        }
        else {
         return '<record xmlns="http://www.loc.gov/MARC21/slim"><controlfield tag="'+tagnumber+'">'+tagvalue+'</controlfield></record>';
        }
    }

    this._updateFixedFieldToolbars = function() {
        var tag001 = $('#'+editorid).find('.001').children('.controlfield-text').val();
        var tag003 = $('#'+editorid).find('.003').children('.controlfield-text').val();
        var tag005 = $('#'+editorid).find('.005').children('.controlfield-text').val();
        Ext.getCmp(editorid+'-003').setText('<span class="fftbarfield">001</span><span class="fftbarvalue">'+tag001+'</span><span class="fftbarfield">003</span><span class="fftbarvalue">'+tag003+'</span><span class="fftbarfield">005</span><span class="fftbarvalue">'+tag005+'</span>');

        var leader = $('#'+editorid).find('.000').children('.controlfield-text').val();
        Ext.getCmp(editorid+'-000-0').setText( '<span class="fftbarfield">LDR</span> ' + leader );

        var tag008 = $('#'+editorid).find('.008').children('.controlfield-text').val();
        Ext.getCmp(editorid+'-008-0').setText( '<span class="fftbarfield">008</span> ' +tag008 );

        var items006 = UI.editor[editorid].tbar006.items;
        for( var i = 1; i < items006.length; i++) {
            var newval = $(items006.itemAt(i).tagel).val();
            items006.itemAt(i).setText('<span class="fftbarfield">006</span> '+newval);
        }
        var items007 = UI.editor[editorid].tbar007.items;
        for( var i = 1; i < items007.length; i++) {
            var newval = $(items007.itemAt(i).tagel).val();
            items007.itemAt(i).setText('<span class="fftbarfield">007</span> '+newval);
        }
    };

    this._createNew006007 = function(tagnumber) {
        $.ajax({
            url: cgiDir + 'xsltransform.pl',
            type: 'POST',
            editorid: editorid,
            dataType: 'html',
            tagnumber: tagnumber,
            data: {tag:tagnumber, xml:this.getFFXML(tagnumber,''), stylesheet:'fixedfields_editor.xsl', xslpath: xslpath, editorid: editorid},
            success: function(html) {
                var win = new Ext.Window({
                    html: html,
					width: 100,
					autoHeight: true,
					autoScroll: true,
					border: false,
					constrain:true,
					shadow:false,
					shim:false,
                    bbar: [
                        {
                            text: 'OK',
                            tagnumber: this.tagnumber,
                            handler: function(btn) {
                                var id = Ext.WindowMgr.getActive().id;
                                var text = $('#'+id).find('select').val();
                                var l = $('#'+editorid).find('div.'+btn.tagnumber).length;
                                var newId = UI.editor[editorid].record.addField(btn.tagnumber, '#', '#', [{delimiter:'', text: text+'       '}]);
                                if(bibliosdebug) {
                                    console.debug('added new ' +btn.tagnumber+' with value '+text+' '+l+' already found ' + 'new tag id: ' +newId);
                                }
                                $('#'+editorid).find('.'+btn.tagnumber).hide();
                                Ext.getCmp(editorid+btn.tagnumber+'tbar').add(
                                    {
                                        id: editorid+'-'+btn.tagnumber+'-'+l,
                                        text: '<span class="fftbarfield">'+btn.tagnumber+'</span> ' + text+'                 ',
                                        tagvalue: text+'                 ',
                                        tagnumber: btn.tagnumber,
                                        tagel: $('#'+newId).children('.controlfield-text'),
                                        itemid: editorid+'-'+btn.tagnumber+'-'+l,
                                        scope: UI.editor[editorid].record,
                                        handler: function(btn ) {
                                            this.showFFPopup( btn.tagnumber, btn.tagvalue,btn.tagel, btn.itemid );
                                        }
                                    }
                                );
                                Ext.WindowMgr.getActive().close();
                                biblios.app.viewport.doLayout();
                                UI.editor[editorid].record.showFFPopup(btn.tagnumber, text+'            ', $('#'+newId).children('.controlfield-text'), editorid+'-'+btn.tagnumber+'-'+l);
                            }
                        },
                        {
                        text: 'Cancel',
                          handler: function(btn) {
                                Ext.WindowMgr.getActive().close();
                          }
                        }
                    ]
                });
                win.show();
            }// success
        });
    }

    this._addFixedFieldToolbars = function() {
        var tag001 = $('#'+editorid).find('.001').children('.controlfield-text').val();
        var tag003 = $('#'+editorid).find('.003').children('.controlfield-text').val();
        var tag005 = $('#'+editorid).find('.005').children('.controlfield-text').val();
        if( !UI.editor[editorid].tbar003 ) {
            UI.editor[editorid].tbar003 = new Ext.ux.ToolbarContainer({});
        }
        UI.editor[editorid].tbar003.add(
            {
                id: editorid+'-003',
                text: '<span class="fftbarfield">001</span><span class="fftbarvalue">'+tag001+'</span><span class="fftbarfield">003</span><span class="fftbarvalue">' + tag003 + '</span><span class="fftbarfield">005</span><span class="fftbarvalue">'+tag005+'</span>',
                handler: function(btn) {
                    Ext.Msg.alert('Control Fields Guided Editor', 'These fields are normally system-generated.  If you need to edit them, please turn off the guided control fields editor.');
                }
            }
        );
        Ext.getCmp('editorTabPanel').getItem(UI.editor[editorid].tabid).add( UI.editor[editorid].tbar003 );
        var leader = $('#'+editorid).find('div.000').children('.controlfield-text');
        var tag008 = $('#'+editorid).find('div.008').children('.controlfield-text');
        if( !UI.editor[editorid].tbarldr008 ) {
            UI.editor[editorid].tbarldr008 =
                new Ext.ux.ToolbarContainer({
                    id: this.editorid + 'ldr008tbar'
                });
            }
        UI.editor[editorid].tbarldr008.add(
            {
                id: this.editorid + '-000-0',
                text: '<span class="fftbarfield">LDR</span> ' + $(leader).val(),
                scope: this,
                tagvalue: $(leader).val(),
                tagnumber: '000',
                i:0,
                tagel: leader,
                itemid: this.editorid + '-000-0',
                handler: function(btn ) {
                    this.showFFPopup( btn.tagnumber, $(btn.tagel).val(),btn.tagel, btn.itemid );
                }
            }
        );
        UI.editor[editorid].tbarldr008.add(
            {
                id: this.editorid + '-008-0',
                text: '<span class="fftbarfield">008</span> ' + $(tag008).val(),
                scope: this,
                tagvalue: $(tag008).val(),
                tagnumber: '008',
                tagel: tag008,
                i:0,
                itemid: this.editorid + '-008-0',
                handler: function(btn ) {
                    this.showFFPopup( btn.tagnumber, $(btn.tagel).val(),btn.tagel,btn.itemid );
                }
            }
        );
        Ext.getCmp('editorTabPanel').getItem(UI.editor[editorid].tabid).add( UI.editor[editorid].tbarldr008);
        if( !UI.editor[editorid].tbar006 ) {
            UI.editor[editorid].tbar006 = new Ext.ux.ToolbarContainer({
                    id: this.editorid + '006tbar',
                    items: [
                        {
                            text: '<span class="fftbarfield">006</span>',
                            scope: UI.editor[editorid].record,
                            tagnumber: '006',
                            handler: function(btn) {
                                this.createNew006007(btn.tagnumber);
                            }
                        }
                    ]
                });
        }
        Ext.getCmp('editorTabPanel').getItem(UI.editor[editorid].tabid).add( UI.editor[editorid].tbar006);
        if( !UI.editor[editorid].tbar007) {
            UI.editor[editorid].tbar007 = new Ext.ux.ToolbarContainer({
                id: this.editorid + '007tbar',
                items: [
                    {
                        text: '<span class="fftbarfield">007</span>',
                        scope: UI.editor[editorid].record,
                        tagnumber: '007',
                        handler: function(btn) {
                            this.createNew006007(btn.tagnumber);
                        }
                    }
                ]
            });
        }
        Ext.getCmp('editorTabPanel').getItem(UI.editor[editorid].tabid).add( UI.editor[editorid].tbar007 );
        UI.editor[editorid].tbar006.on('render', function(tbar) {
            $('#'+editorid).find('.006').each( function(i) {
                var tag006 = $(this).children('.controlfield-text');
                var itemid = editorid+'-006-'+i;
                tbar.add(
                        {
                            id: itemid,
                            text: '<span class="fftbarfield">006</span> ' + $(tag006).val(),
                            scope: UI.editor[editorid].record,
                            tagel: tag006,
                            tagvalue: $(tag006).val(),
                            tagnumber: '006',
                            itemid: itemid,
                            handler: function(btn ) {
                                this.showFFPopup( btn.tagnumber, $(btn.tagel).val(),btn.tagel, btn.itemid );
                            }
                        }
                );
            });
        });
        UI.editor[editorid].tbar007.on('render', function(tbar) {
            $('#'+editorid).find('.007').each( function(i) {
                var tag007 = $(this).children('.controlfield-text');
                var itemid = editorid+'-007-'+i;
                tbar.add(
                    {
                        id: itemid,
                        text: '<span class="fftbarfield">007</span> ' + $(tag007).val(),
                        scope: UI.editor[editorid].record,
                        tagel: tag007,
                        tagvalue: $(tag007).val(),
                        tagnumber: '007',
                        itemid: itemid,
                        handler: function(btn ) {
                            this.showFFPopup( btn.tagnumber, $(btn.tagel).val(),btn.tagel, btn.itemid );
                        }
                    }
                );
            });
        });
        biblios.app.viewport.doLayout();
    }

    this._setupSubfieldDelimiterFocus = function() {
        // move focus to subfield-text when typing text in full preceding subfield-delimiter
        $('#'+editorid).find('.subfield-delimiter').keyup( function( e ) {
            /*if(bibliosdebug) {
                console.info(ev);
            }*/
            /* following code snippet borrowed from jquery.autotab.js jquery plugin http://www.lousyllama.com/sandbox/jquery-autotab */
		/**
		 * Do not auto tab when the following keys are pressed
		 * 8:	Backspace
		 * 9:	Tab
		 * 16:	Shift
		 * 17:	Ctrl
		 * 18:	Alt
		 * 19:	Pause Break
		 * 20:	Caps Lock
		 * 27:	Esc
		 * 33:	Page Up
		 * 34:	Page Down
		 * 35:	End
		 * 36:	Home
		 * 37:	Left Arrow
		 * 38:	Up Arrow
		 * 39:	Right Arrow
		 * 40:	Down Arroww
		 * 45:	Insert
		 * 46:	Delete
		 * 144:	Num Lock
		 * 145:	Scroll Lock
		 */
		var keys = [8, 9, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46, 144, 145];
		var string = keys.toString();

		if(string.indexOf(key(e)) == -1 && $(this).val().length == $(this).get(0).maxLength )
                $(this).siblings().eq(1).focus();
        });
    }

    this._postProcessJs = function() {
        update();
        Ext.get(editorid).mask();
        //UI.editor.progress.updateProgress(.9, 'Setting up editor hot keys');
        setupEditorHotkeys();
        //UI.editor.progress.updateProgress(.9, 'Setting up authority control');
        setupMarc21AuthorityLiveSearches();

        // setup comboboxes for ctry and lang fixed fields
        //setupFFEditorLangCombo();
        //setupFFEditorCtryCombo();
        // set up editor based on any preferences
        if( getPref('ShowFieldBordersInEditor') == "1") {
            addInputOutlines(); 
        }
        this._addFixedFieldToolbars();
        this._setupSubfieldDelimiterFocus();
        // hide fixed field controlfields
        $('#'+editorid).find('.varfields_editor').find(".000, .001, .003, .005, .008, .006, .007").hide();
        // set change event for Type fixed fields select dropdown
        $('#'+editorid).find('#Type').change(function() {
            var editorid = Ext.getCmp('editorTabPanel').getActiveTab().editorid;
            UI.editor[editorid].record.reformatFixedFieldsEditor();
        });
        UI.editor.lastFocusedEl = $('.001', editorelem).get(0);
        UI.editor[editorid].lastFocusedEl = $('#'+editorid).find('.001').get(0);
        Ext.getCmp('editorTabPanel').getItem(UI.editor[editorid].tabid).doLayout();
        Ext.getCmp('editorTabPanel').getItem(UI.editor[editorid].tabid).editorid = editorid;
        Ext.get(editorid).unmask();
    };

    this._processForLocation = function(loc) {
		setupReservedTags( loc);
		setupSpecialEntries( loc);
    }

	this._getEditorHtml = function() {
		return htmled;
	};

    this._getFormat = function() {
        var xmldoc = UI.editor[editorid].record.XML();
        return UI.editor[editorid].record.detectFormat(xmldoc);
    }

}
// Public methods 
MarcEditor.prototype.getMarcRecord = function() {
    return this._getMarcRecord();
}

MarcEditor.prototype.getNextField = function(tagnumber) {
    return this._getNextField(tagnumber);
}

MarcEditor.prototype.createNew006007 = function(tagnumber) {
    return this._createNew006007(tagnumber);
}

MarcEditor.prototype.reformatFixedFieldsEditor = function() {
    return this._reformatFixedFieldsEditor();
}
MarcEditor.prototype.showFFPopup = function() {
    return this.showFFPopup();
}
MarcEditor.prototype.toggleFixedFieldDisplay = function() {
    return this._toggleFixedFieldDisplay();
}
MarcEditor.prototype.setupSubfieldDelimiterFocus = function() {
    return this._setupSubfieldDelimiterFocus();
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
	return this._addField(tag, ind1, ind2, subfields);
};

MarcEditor.prototype.getFormat = function() {
    return this._getFormat();
}

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

MarcEditor.prototype.loadXml = function(xmldoc, callback) {
	return this._loadXmlXSL(xmldoc, callback);
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

MarcEditor.prototype.getTitle = function() {
    return this.getValue('245', 'a');
}

MarcEditor.prototype.getAuthor = function() {
    return this.getValue('100', 'a');
}

MarcEditor.prototype.getDate = function() {
    return this.getValue('260', 'c');
}

MarcEditor.prototype.getPublisher = function() {
    return this.getValue('260', 'b');
}

MarcEditor.prototype.getControlNumber = function() {
    return this.getValue('001');
}
MarcEditor.prototype.getToolsMenu = function getToolsMenu() {
    return [
            {
                id: this.editorid+'toggleFixedFieldGrid',
                editorid: this.editorid,
                text: 'Toggle Guided Control Fields Editor',
                mytoggled: false,
                listeners: {
                    click: function(btn, e) {
                        UI.editor[btn.editorid].record.toggleFixedFieldDisplay();
                    }
                }
            },
            {
                id: 'addField',
                editorid: this.editorid,
                text: 'Add Field Ctrl-n',
                handler: function(btn) {
                    UI.editor[btn.editorid].record.addField();
                }
            },
            {
                id: 'removeField',
                editorid: this.editorid,
                text: 'Remove Field Ctrl-r',
                handler: function(btn) {
                    UI.editor[btn.editorid].record.deleteField(btn.editorid);
                }
            },
            {
                id: 'addSubfield',
                editorid: this.editorid,
                text: 'Add Subfield Ctrl-m',
                handler: function(btn) {
                    UI.editor[btn.editorid].record.addSubfield();
                }
            },
            {	
                id: 'removeSubfield',
                editorid: this.editorid,
                text: 'Remove subfield Ctrl-d',
                handler: function(btn) {
                    UI.editor[btn.editorid].record.deleteSubfield(btn.editorid);
                }
            }
    ];
} // getToolsMenu

MarcEditor.prototype.detectFormat = function(xmldoc) {
    var leader = $('leader', xmldoc).text();
    var leader6 = leader.substr(6,1);
    var leader7 = leader.substr(7,1);
    var format = '';
    if( leader6 == 'a') {
        if(leader7 == 'a' || leader7 == 'c' || leader7 == 'd' || leader7 == 'm' ) {
            format = 'BKS';
        }
        else if(leader7 == 'b' || leader7 == 'i' || leader7 == 's') {
            format == 'CNR';
        }
    }
    else if(leader6 == 't') {
        format = 'BKS';
    }
    else if(leader6 == 'p') {
        format = 'MIX';
    }
    else if(leader6 == 'm') {
        format = 'COM';
    }
    else if(leader6 == 'c' || leader6 == 'd') {
        format = 'SCO';
    }
    else if(leader6 == 'e' || leader6 == 'f') {
        format = 'MAP';
    }
    else if(leader6 == 'i' || leader6 == 'j') {
        format = 'REC';
    }
    else if(leader6 == 'g' || leader6 == 'k' || leader6 == 'o' || leader6 == 'r') {
        format = 'VIS';
    }
    return format; 
}

MarcEditor.getToolbar = function(editorid) {

    return new Ext.Toolbar ({
        listeners: {
        },
        items: [
        {
            cls: 'x-btn-text-icon',
            icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/tools', configDoc).text(),
            id: editorid+'EditBtn',
            editorid: editorid,
            text: 'Commands',
            tooltip: {title: 'MarcEditor tools', text: 'Add field Ctrl-n<br/>Remove field Ctrl-r<br/>Add subfield Ctrl-m<br/>Remove subfield Ctrl-d'},
            menu: 
                {
                    id: editorid+'EditMenu',
                    editorid: editorid,
                    items: [],
                    listeners: {
                        beforeshow: function(menu, menuItem, e) {
                            menu.removeAll();
                            var items = UI.editor[editorid].record.getToolsMenu();
                            for( i in items) {
                                menu.add( items[i] );
                            }
                        }
                    }
                } 
        }, 
        {
            id: editorid+'ToolsBtn',
            cls: 'x-btn-text-icon bmenu',
            icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/tools', configDoc).text(),
            text: 'Tools',
            menu : {
                id: editorid+'toolsmenu',
                items: [
                    {
                        cls: 'x-btn-text-icon bmenu', // icon and text class
                        icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/save', configDoc).text(),
                        text: 'Save',
                        tooltip: {title: 'Save', text: 'Ctrl-s'},
                        menu: {
                            id: editorid+'OneSaveMenu',
                            items: getSaveFileMenuItems(editorid),
                            editorid: editorid,
                            listeners: {
                                beforeshow: function(menu, menuItem, e) {
                                    updateSaveMenu(menu, menu.editorid);
                                }
                            }
                        }
                    },
                    {   
                        cls: 'x-btn-text-icon bmenu', // icon and text class
                        icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/export', configDoc).text(),
                        text: 'Export',
                        tooltip: {text: 'Export record to marc21 or marcxml'},
                        menu: {
                            id: editorid+'OneExportMenu',
                            items: getExportMenuItems(editorid)
                        }
                    },
                    {
                        cls: 'x-btn-text-icon bmenu', // icon and text class
                        icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/send', configDoc).text(),
                        text: 'Send',
                        tooltip: {text: 'Send record to remote ILS'},
                        menu: {
                            id: editorid+'OneSendMenu',
                            editorid: editorid,
                            items: getSendFileMenuItems(editorid),
                            listeners: {
                                beforeshow: function(menu, menuItem, e) {
                                    updateSendMenu(menu, editorid);
                                }
                            }
                        }
                    },
                    {
                        cls: 'x-btn-text-icon',
                        icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/duplicate', configDoc).text(),
                        text: 'Duplicate',
                        tooltip: {text: 'Duplicate this record to Drafts folder'},
                        editorid: editorid,
                        id: editorid+'DuplicateBtn',
                        disabled: UI.editor[editorid].id == '' ? true: false,
                        handler: function(btn) {
                            // get record from db for this record
                            var r = DB.Records.select('Records.rowid=?', [ UI.editor[btn.editorid].id ]).getOne();
                          var savefilename = DB.Savefiles.select('Savefiles.rowid=?', [r.Savefiles_id]).getOne().name;
                            var newrec = new DB.Records({
                                xml : r.xml,
                                title : r.title,
                                author : r.author,
                                publisher : r.publisher,
                                date : r.date,
                                date_added : new Date().toString(),
                                date_modified : new Date().toString(),
                                status : 'duplicate',
                                medium : r.medium,
                                SearchTargets_id : r.SearchTargets_id,
                                Savefiles_id : '3', // Drafts folder ID
                                xmlformat : r.xmlformat,
                                marcflavour : r.marcflavour,
                                template : r.template,
                                marcformat : r.marcformat
                            }).save();
                            Ext.MessageBox.alert('Record duplication', 'Record was duplicated to ' + savefilename + ' folder');
                        }
                    },
                    {
                        id: 'editorOneMacrosBtn',
                        cls: 'x-btn-text-icon bmenu',
                        icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/macros', configDoc).text(),
                        text: 'Macros',
                        menu : {
                            id: editorid+'macrosmenu',
                            items: getMacroMenuItems(editorid),
                            listeners: {
                                beforeshow: function(menu, menuItem, e) {
                                    menu.removeAll();
                                    var items = getMacroMenuItems(editorid);
                                    for( i in items) {
                                        menu.add( items[i] );
                                    }
                                }
                            }
                        }
                    }
                ] //editor tools menu items
            }
        },
        {
            cls: 'x-btn-text-icon',
            icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/revert', configDoc).text(),
            id: editorid+'RevertBtn',
            editorid: editorid,
            disabled: UI.editor[editorid].savefileid ? false : true,
            text: 'Revert',
            tooltip: {text: 'Revert record to last saved state'},
            handler: function(btn) {
                showStatusMsg('Reverting record');
                var id = UI.editor[ btn.editorid].id;
                var xml = getLocalXml(id);
                UI.editor[btn.editorid].record.loadXml(xml,handle_html);
                clearStatusMsg();
            }
        },
        {
            cls: 'x-btn-icon',
            icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/trash', configDoc).text(),
            id: editorid+'TrashMenu',
            editorid: editorid,
            tooltip: {text: 'Move this record to trash (losing all changes since saving)'},
            handler: function(btn) {
                showStatusMsg('Moving record to Trash...');
                var editorid = Ext.getCmp('editorTabPanel').getActiveTab().editorid;
                // save to Trash (id=1)
                doSaveLocal(1, editorid);
                // remove this editor tab
                Ext.getCmp('editorTabPanel').remove( Ext.getCmp('editorTabPanel').getActiveTab() );
                // display current savefile or search grid
                biblios.app.displaySaveFile( UI.currSaveFile );
                if( UI.lastWindowOpen  == 'savegrid' ) {
                    biblios.app.displaySaveView();
                }
                else if( UI.lastWindowOpen  == 'searchgrid' ) {
                    biblios.app.displaySearchView();
                }
                clearStatusMsg();
            }
        } // editor trash button
    ] 
    });
}
function formatFixedFieldsPopupWidth(index) {
    var done = 0;
    var i = 0;
    while( done != 1 ) {
        var length = $('.fixedfields_editor').find('tr:last').find('td').length;
        if( length < index ) {
            done = 1;
        }
        else {
            // get td's greater than index
            var td = $('.fixedfields_editor').find('tr:last').find('td:gt('+index+')').remove();
            // create new tr to put them in
            var newrowid = 'newrow'+i;
            var tr = $('.fixedfields_editor').find('tr:last').after('<tr id="'+newrowid+'"></tr>');
            $('#'+newrowid).append(td);
            i++;
        }
    }
}


	var key = function(e) {
		if(!e)
			e = window.event;

		return e.keyCode;
	};
