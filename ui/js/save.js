
/*
   Function: doSaveZ3950

   Save record(s) to Z39.50 server.

   Parameters:

   None.

   Returns:

   None.

   Note:
   *Not yet functional*
*/
function doSaveZ3950() {
	var tab = tabs.getActiveTab();
	var id = tab.recid;
	try {
		var rs = db.execute('select xml from Records where id=?', [id]);
	} catch(ex) {
		//console.error('db error: ' + ex.message);
	}
	var xml = rs.field(0);	
	//console.info("saving record id: " + id + " with xml: " + xml);

    Ext.Ajax.on('beforerequest', function() {
      $("#south").empty();
      $("#south").append("Saving to " + z3950serversSave);
    });
    Ext.Ajax.on('requestexception', function(conn, resp, options) {
      $("#south").empty();
      $("#south").append("Error saving " + resp.responseText);
    });
	Ext.Ajax.request({
		method: 'POST',
		params: {
			'record': xml,
			'host': z3950serversSave,
			'marcflavour': marcFlavor,
			'encoding': encoding
			}, 
		url: saveScript,
		callback: function(option, success, response) {
            $("#south").empty();
		    $("#south").append('Save results: ', response.responseText);
		}
	});
}

/*
   Function: doSaveLocal

   Save record(s) to Google Gears sqlite database.

   Parameters:

   savefileid: id of the savefile to save to (if records have been dropped onto savefile tree)
   savefilename: name of the savefile to save to
   sel: Ext selection for records which have been dropped
   dd: Ext drag and drop object for records which have been dropped and Ext drop target (folder list)

   Returns:

   None.

*/
function doSaveLocal(savefileid) {
    if( !savefileid ) {
		if(debug == 1 ) { console.info( "doSaveLocal: Setting savefile to Drafts on save" )}
			savefileid = 2; // Drafts
    }
	var savefilename = UI.save.savefile[savefileid];
	showStatusMsg('Saving to '+ savefilename);
    var rs;
    // if we have a record open in the marceditor, get its xml and save to drafts
    if( Ext.get('marceditor').isVisible() ) {
        var ff_ed = $("#fixedfields_editor");
        var var_ed = UI.editor.editorDoc;
        // transform edited record back into marcxml
        if( marcFlavor == 'marc21' ) {
            xml = Edit2XmlMarc21(ff_ed, var_ed);
        } 
        else if( marcFlavor == 'unimarc' ) {
            Ext.MessageBox.alert("Unimarc support not yet implemented");
        }
        var recid = UI.editor.id;
        // if we don't have a record id, add this record to the db first
        if( recid == '' ) {
            if(debug == 1 ) { console.info( "doSaveLocal: no recid so record must be from search results.  Retrieving data from searchgrid."); }
            var sel = searchgrid.getSelections()[0];
			var id = sel.id;
            var server = sel.data.location;
            var title = sel.data.title;
            recid = addRecordFromSearch(id, server, title, savefileid);
        }
        if(debug == 1 ) { console.info( "Saving record with id: " + recid + " and content: " + xml); }
        try {
            rs = db.execute('update Records set xml=? where id=?', [xml, recid]);	
            rs = db.execute('update Records set savefile=? where id=?', [savefileid, recid]);	
            rs = db.execute('update Records set status=? where id=?', ['edited', recid]);	
            rs = db.execute('update Records set date_modified=datetime("now", "localtime") where id=?', [recid]);	
            if(debug) { console.info("saved record with id: " + recid + " to savefile: " + savefilename); }
                rs.close();
            } catch(ex) {
                Ext.MessageBox.alert('Database error',ex.message);
            }
        return true;
    }
    // if we're picking from the savefile grid 
    else if( (Ext.get('savegrid').isVisible() ) ) {
        var grid = Ext.ComponentMgr.get( 'save-file-grid' );
        var ds = grid.getDataSource();
        var sel = grid.getSelectionModel().getSelections();
		// update the record(s) based on current selection
		for( var i = 0; i < sel.length; i++) {
			var id = sel[i].data.Id;
			try {
				rs = db.execute('update Records set status=? where id=?', ['edited', id]);	
				rs = db.execute('update Records set date_modified=datetime("now", "localtime") where id=?', [id]);	
				rs = db.execute('update Records set savefile=? where id=?', [savefileid, id]);	
				rs.close();
				if(debug) { console.info("saved record with id: " + id + " to savefile: " + savefileid); }
			}
			catch(ex) {
				Ext.MessageBox.alert("Database error", ex.message);
			}
		}
	}
    else if( Ext.get('searchgrid').isVisible() ) {
        var grid = Ext.ComponentMgr.get( 'searchgrid' );
        var ds = searchgrid.getDataSource();
        var sel = searchgrid.getSelectionModel().getSelections();
		for( var i = 0; i < sel.length; i++) {
			var id = sel[i].id;
            var server = sel[i].data.location;
            var title = sel[i].data.title;
            addRecordFromSearch(id, server, title, savefileid);
		}
    }
    showStatusMsg("Record(s) saved to "+savefilename);
    return true;
}

function doSaveRemote(loc, xmldoc) {
	if(debug) { console.info('Saving open record to ' + loc); }
	// set UI.editor.location to point to this record so we get special entries etc.
	UI.editor.location = Prefs.remoteILS[loc].location;
	Prefs.remoteILS[loc].instance.saveHandler = openRecord;
	Prefs.remoteILS[loc].instance.save(xmldoc);
	UI.editor.savedRemote[loc] = true;
}


function addRecordFromSearch(id, server, title, savefileid) {
    try {
        db.execute('insert into Records (id, status, date_added, date_modified, server, savefile) values (null, ?, date("now", "localtime"), date("now", "localtime"), ?, ?)', ['new', server, savefileid]);
        if(debug == 1 ) {console.info('inserting into savefile: ' + savefileid + ' record with title: ' + title);}
    } catch(ex) {
        Ext.Msg.alert('Error', 'db error: ' + ex.message);
    }
    paz.recordCallback = function(data) { addRecord( xslTransform.serialize(data.xmlDoc) ) }
    var xml = getPazRecord(id);
    if(xml) {
      addRecord(xml);
    }
    var id = getLastRecId();
    return id;
}

function addRecord(xml) {
    if(debug){ console.info('addRecord called with data: ' + xml.substr(0, 10)) }
    var id = getLastRecId();
	try {
		db.execute('update Records set xml = ? where id = ?', [xml, id]);
		if(debug == 1 ) {console.info('addRecord: updating xml of record with id: ' + id);}
	} catch(ex) {
		Ext.Msg.alert('Error', 'db error: ' + ex.message);
	}
}

function getSaveFileNameFromId(savefileid) {
	// get savefilename for this savefileid
	var rs;
	try {
		rs = db.execute('select name from Savefiles where id=?', [savefileid]);
	}
	catch(ex) {
		Ext.MessageBox.alert('DB Error', ex.message);
	}
	while(rs.isValidRow() ) {
		savefilename = rs.fieldByName('name');
		rs.next();
	}
	return savefilename;
}

function updateSaveMenu() {
	// remove old Save menu items
	Ext.menu.MenuMgr.get('saveMenu').removeAll();
	var savefiles = getSaveFileMenuItems();
	for( sf in savefiles ) {
		Ext.menu.MenuMgr.get('saveMenu').add( savefiles[sf] );
	}
}

function updateSendMenu() {
	// remove old send menu items
	Ext.menu.MenuMgr.get('sendMenu').removeAll();
	var sendfiles = getSendFileMenuItems();
	for( sf in sendfiles ) {
		Ext.menu.MenuMgr.get('sendMenu').add( sendfiles[sf] );
	}
}

function getSendFileMenuItems() {
	var list = new Array();
	for( ils in Prefs.remoteILS ) {
		var o = {
			text: ils,
			id: ils,
			handler: function(btn) {
				// if this record has already been saved to this location
				if( UI.editor.savedRemote[btn.id] == true ) {
					if( validateRemote(btn.id) ) {
						var xmldoc = xslTransform.loadString( Edit2XmlMarc21( $('#fixedfields_editor'), UI.editor.doc) );
						doSaveRemote(btn.id, xmldoc);
					}
				}
				// if the record has not already been saved remotely
				else {
						var xmldoc = xslTransform.loadString( Edit2XmlMarc21( $('#fixedfields_editor'), UI.editor.doc) );
						doSaveRemote(btn.id, xmldoc);
				}
			}
		}
		list.push(o);
	}
	return list;
}

function getSaveFileMenuItems() {
	var list = new Array();
	getSaveFileNames();
	for ( sf in UI.save.savefile ) {
		var o = {
			text: UI.save.savefile[sf],
			id: sf,
			handler: function(btn) {
				var savefileid = btn.id;
				doSaveLocal(savefileid);
			}
		};
		list.push(o);
	}
	return list;
}

function validateRemote(loc) {
	var errormsg = '';
	// check for mandatory subfields
	var subfields = Prefs.remoteILS[loc].instance.mandatory_subfields;
	var subfieldsvalid = true;
	for( var i = 0; i < subfields.length; i++) {
		var tag = $(subfields).eq(i).children('tag').text();
		var subfield = $(subfields).eq(i).children('subfield_label').text();
		if( !UI.editor.record.hasFieldAndSubfield(tag, subfield)) {
			subfieldsvalid = false;
			errormsg += 'Record is missing tag ' + tag + ' with subfield ' + subfield + '<br/>';
		}
	}
	var tags = Prefs.remoteILS[loc].instance.mandatory_tags;
	var tagsvalid = true;
	for( var i = 0; i< tags.length; i++) {
		var tag = $(tags).eq(i).text();
		if( !UI.editor.record.hasField(tag)) {
			tagsvalid = false;
			errormsg += 'Record is missing tag ' + tag + '<br/>';
		}
	}
	if( errormsg != '' ) {
		Ext.MessageBox.alert('Remote validation from ' + loc, errormsg);
	}
	return subfieldsvalid && tagsvalid;
}

