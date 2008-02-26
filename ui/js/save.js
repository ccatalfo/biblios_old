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


function doSaveRemote(loc, xmldoc, editorid) {
	/*Ext.get('ffeditor').mask();
	Ext.get('vareditor').mask();*/
	UI.editor[editorid].location = loc;
	UI.editor.progress = Ext.MessageBox.progress('Saving record to remote server', '');
	if(debug) { console.info('Saving open record to ' + loc); }
	// set UI.editor.location to point to this record so we get special entries etc.
	Prefs.remoteILS[loc].instance.saveHandler = function(xmldoc, status) {
		if( status == 'failed' ) {
			UI.editor.progress.hide();
			Ext.MessageBox.alert('Remote Send Target failure', "Remote send target couldn't save record");
		} 
		else {
			var xml = xslTransform.serialize(xmldoc);
			UI.editor.progress.updateProgress(.7, 'Retrieved remote record');
			openRecord(xml, editorid);
			setupReservedTags(Prefs.remoteILS[UI.editor[editorid].location], editorid);
			/*Ext.get('ffeditor').unmask();
			Ext.get('vareditor').unmask();*/
			UI.editor.progress.hide();
		}
	}
	Prefs.remoteILS[loc].instance.save(xmldoc);
	UI.editor.progress.updateProgress(.5, 'Sending to remote server');
	UI.editor[editorid].savedRemote[loc] = true;
}


function addRecordFromSearch(id, offset, editorid, data, savefileid, newxml) {
	var xml = getPazRecord(id, 
		offset,
		// this function gets called when pazpar2 returns the xml for record with this id
		function(data, params) {
		// data param is this record's xml as returned by pazpar2
		// o is a json literal containing the record id, grid data and savefileid for this record
		if(debug == 1 ) {console.info('inserting into savefile: ' + savefileid + ' record with title: ' + params.title);}
		try {
			var target = DB.SearchTargets.select('name=?', [params.recData.location]).getOne();
			var savefile = DB.Savefiles.select('Savefiles.rowid=?', [params.savefileid]).getOne();
			var record = new DB.Records({
				title: UI.editor[editorid]? UI.editor[editorid].record.getValue('245', 'a') : params.recData.title || '',
				author: UI.editor[editorid]? UI.editor[editorid].record.getValue('100', 'a'):  params.recData.author || '',
				location: params.recData.location || '',
				publisher:UI.editor[editorid]?  UI.editor[editorid].record.getValue('260', 'b'): params.recData.publication || '',
				medium: params.recData.medium || '',
				date:UI.editor[editorid]?  UI.editor[editorid].record.getValue('260', 'c'): params.recData.date|| '',
				status: 'new',
				xml: params.newxml || data || '<record></record>',
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
	},
	// send these params along with preceding callback function so we can update the correct record in db by id
	{
		id: id,
		savefileid: savefileid,
		recData: data,
		newxml: newxml
	} 
	);
	return db.lastInsertRowId;
}

function getSaveFileNameFromId(savefileid) {
	// get savefilename for this savefileid
	var name = '';
	try {
		name = DB.Savefiles.select('Savefiles.rowid=?', [savefileid]).getOne().name;
	}
	catch(ex) {
		Ext.MessageBox.alert('DB Error', ex.message);
	}
	return name;
}

function updateSaveMenu() {
	// remove old Save menu items
	Ext.menu.MenuMgr.get('editorOneSaveMenu').removeAll();
	Ext.menu.MenuMgr.get('editorTwoSaveMenu').removeAll();
	var savefiles = getSaveFileMenuItems('editorone');
	for( sf in savefiles ) {
		Ext.menu.MenuMgr.get('editorOneSaveMenu').add( savefiles[sf] );
	}
	var savefiles = getSaveFileMenuItems('editortwo');
	for( sf in savefiles) {
		Ext.menu.MenuMgr.get('editorTwoSaveMenu').add( savefiles[sf] );
	}
}

function updateSendMenu() {
	// remove old send menu items
	Ext.menu.MenuMgr.get('editorOneSendMenu').removeAll();
	var sendfiles = getSendFileMenuItems('editorone');
	for( sf in sendfiles ) {
		Ext.menu.MenuMgr.get('editorOneSendMenu').add( sendfiles[sf] );
	}
	Ext.menu.MenuMgr.get('editorTwoSendMenu').removeAll();
	var sendfiles = getSendFileMenuItems('editortwo');
	for( sf in sendfiles ) {
		Ext.menu.MenuMgr.get('editorTwoSendMenu').add( sendfiles[sf] );
	}
}

function getSendFileMenuItems(editorid) {
	var list = new Array();
	for( ils in Prefs.remoteILS ) {
		var o = {
			text: ils,
			id: ils,
			editorid: editorid,
			handler: function(btn) {
				// if this record has already been saved to this location
				if( UI.editor[btn.editorid].savedRemote[btn.id] == true ) {
					if( validateRemote(btn.editorid, btn.id) ) {
						doSaveRemote(btn.id, UI.editor[btn.editorid].record.XML(), btn.editorid);
					}
				}
				// if the record has not already been saved remotely
				else {
						doSaveRemote(btn.id, UI.editor[editorid].record.XML(), btn.editorid);
				}
			}
		}
		list.push(o);
	}
	return list;
}

function getSaveFileMenuItems(editorid) {
	var list = new Array();
	getSaveFileNames();
	for ( sf in UI.save.savefile ) {
		var o = {
			text: UI.save.savefile[sf],
			id: sf,
			editorid: editorid,
			handler: function(btn) {
				var savefileid = btn.id;
				var editorid = btn.editorid;
				doSaveLocal(savefileid, editorid);
			}
		};
		list.push(o);
	}
	return list;
}

function validateRemote(editorid, loc) {
	var errormsg = '';
	// check for mandatory subfields
	var subfields = Prefs.remoteILS[loc].instance.mandatory_subfields;
	var subfieldsvalid = true;
	for( var i = 0; i < subfields.length; i++) {
		var tag = $(subfields).eq(i).children('tag').text();
		var subfield = $(subfields).eq(i).children('subfield_label').text();
		if( !UI.editor[editorid].record.hasFieldAndSubfield(tag, subfield)) {
			subfieldsvalid = false;
			errormsg += 'Record is missing tag ' + tag + ' with subfield ' + subfield + '<br/>';
		}
	}
	var tags = Prefs.remoteILS[loc].instance.mandatory_tags;
	var tagsvalid = true;
	for( var i = 0; i< tags.length; i++) {
		var tag = $(tags).eq(i).text();
		if( !UI.editor[editorid].record.hasField(tag)) {
			tagsvalid = false;
			errormsg += 'Record is missing tag ' + tag + '<br/>';
		}
	}
	if( errormsg != '' ) {
		Ext.MessageBox.alert('Remote validation from ' + loc, errormsg);
	}
	return subfieldsvalid && tagsvalid;
}

function doValidate(btn) {
	var editorid = btn.editorid;
	xml = UI.editor[editorid].record.XMLString();

}

