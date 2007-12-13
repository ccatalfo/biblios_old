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
    var rs, xml;
    // if we have a record open in the marceditor, get its xml and save to drafts
    if( Ext.get('marceditor').isVisible() ) {
		Ext.get('fixedfields_editor').mask();
		Ext.get('varfields_editor').mask();
		var progress = Ext.MessageBox.progress('Saving record');
        var ff_ed = $("#fixedfields_editor");
        var var_ed = UI.editor.editorDoc;
        // transform edited record back into marcxml
<<<<<<< HEAD:ui/js/save.js
		xml = UI.editor.record.XMLString();
		progress.updateProgress(.5, 'Extracing marcxml');
=======
        if( marcFlavor == 'marc21' ) {
			progress.updateProgress(.5, 'Extracting marcxml');
            xml = Edit2XmlMarc21(ff_ed, var_ed);
        } 
        else if( marcFlavor == 'unimarc' ) {
            Ext.MessageBox.alert("Unimarc support not yet implemented");
        }
>>>>>>> db_gearshift:ui/js/save.js
        var recid = UI.editor.id;
        // if we don't have a record id, add this record to the db first
        if( recid == '' ) {
            if(debug == 1 ) { console.info( "doSaveLocal: no recid so record must be from search results.  Retrieving data from searchgrid."); }
            var data = searchgrid.getSelections()[0].data;
			var id = searchgrid.getSelections()[0].id;
			progress.updateProgress(.6, 'Retrieving record from server');
            recid = addRecordFromSearch(id, data, savefileid);
			if(debug == 1 ) { console.info( "Saving record with id: " + recid + " and content: " + xml); }
        }
		else { // recid isn't empty so we've already saved this record, just update it
			try {
				var record = DB.Records.select('Records.rowid = ?', [recid]).getOne();
				record.xml = xml;
				record.Savefiles_id = savefileid;
				record.status = 'edited';
				record.date_modified = new Date();
				record.save();
				if(debug) { 
					console.info("saved record with id: " + recid + " to savefile: " + savefilename); 
			}
				progress.updateProgress(1, 'Saving record to local database');
			} catch(ex) {
					Ext.MessageBox.alert('Database error',ex.message);
			}
		}
		progress.hide();
		Ext.get('fixedfields_editor').unmask();
		Ext.get('varfields_editor').unmask();
        return true;
    } // save record from marc editor
    // if we're picking from the savefile grid 
    else if( (Ext.get('savegrid').isVisible() ) ) {
        var grid = Ext.ComponentMgr.get( 'save-file-grid' );
        var ds = grid.getDataSource();
        var sel = grid.getSelectionModel().getSelections();
		// update the record(s) based on current selection
		for( var i = 0; i < sel.length; i++) {
			var id = sel[i].data.Id;
			try {
				var record = DB.Records.select('Records.rowid=?',[id]).getOne();
				record.status = 'edited';
				record.date_modified = new Date().toString();
				record.Savefiles_id = savefileid;
				record.save();
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
			var data = sel[i].data;
            addRecordFromSearch(id, data, savefileid);
		}
    }
    showStatusMsg("Record(s) saved to "+savefilename);
    return true;
}

function doSaveRemote(loc, xmldoc) {
	Ext.get('ffeditor').mask();
	Ext.get('vareditor').mask();
	UI.editor.progress = Ext.MessageBox.progress('Saving record to remote server', '');
	if(debug) { console.info('Saving open record to ' + loc); }
	// set UI.editor.location to point to this record so we get special entries etc.
	UI.editor.location = Prefs.remoteILS[loc].location;
	Prefs.remoteILS[loc].instance.saveHandler = function(xml) {
		UI.editor.progress.updateProgress(.7, 'Retrieved remote record');
		Ext.get('fixedfields_editor').unmask();
		Ext.get('varfields_editor').unmask();
		UI.editor.progress.hide();
	}
	Prefs.remoteILS[loc].instance.save(xmldoc);
	UI.editor.progress.updateProgress(.5, 'Sending to remote server');
	UI.editor.savedRemote[loc] = true;
}


function addRecordFromSearch(id, data, savefileid) {
	var xml = getPazRecord(id);
	if(debug == 1 ) {console.info('inserting into savefile: ' + savefileid + ' record with title: ' + data.title);}
    try {
		var target = DB.SearchTargets.select('name=?', [data.location]).getOne();
		var savefile = DB.Savefiles.select('Savefiles.rowid=?', [savefileid]).getOne();
		var record = new DB.Records({
			title: data.title || '',
			author: data.author || '',
			location: data.location || '',
			publisher: data.publisher || '',
			medium: data.medium || '',
			date: data.date || '',
			status: 'new',
			xml: xml,
			date_added: new Date().toString(),
			date_modified: new Date().toString(),
			SearchTargets_id: target.rowid,
			Savefiles_id: savefile.rowid,
			xmlformat: 'marcxml',
			marcflavour: 'marc21',
			template: null,
			marcformat: null
		}).save();
    } catch(ex) {
        Ext.MessageBox.alert('Database Error', ex.message);
    }
	return db.lastInsertRowId;
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
						doSaveRemote(btn.id, UI.editor.record.XML());
					}
				}
				// if the record has not already been saved remotely
				else {
						doSaveRemote(btn.id, UI.editor.record.XML());
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

