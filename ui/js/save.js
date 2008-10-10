function doSaveLocal(savefileid, editorid, offset, dropped ) {
    if( !biblios.app.fireEvent('beforesaverecord', savefileid, editorid, offset, dropped) ) {
        return false;
    }
		var recoffset = offset || 0;
		if( !savefileid ) {
			if(bibliosdebug == 1 ) { console.info( "doSaveLocal: Setting savefile to Drafts on save" );}
				savefileid = 3; // Drafts
		}
		var savefilename = getSaveFileNameFromId(savefileid);
		showStatusMsg('Saving to '+ savefilename);
		var rs, xml;
		// if we have a record open in the marceditor, get its xml and save to drafts
		if( openState == 'editorPanel' ) {
			// make sure we have up to date record
			transferFF_EdToTags(UI.editor[editorid].ffed, UI.editor[editorid].vared, editorid);
			UI.editor[editorid].record.update();
			var progress = Ext.MessageBox.progress('Saving record');
			// transform edited record back into marcxml
			xml = UI.editor[editorid].record.XMLString();
			progress.updateProgress(.5, 'Extracing marcxml');
			var recid = UI.editor[editorid].id;
			// if we don't have a record id, add this record to the db first
			if( recid == '' ) {
				if(bibliosdebug == 1 ) { console.info( "doSaveLocal: no recid so record must be from search results.  Retrieving data from searchgrid."); }
                if( Ext.getCmp('searchgrid').getSelectionModel().getChecked().length > 0 ) {
                    var data = Ext.getCmp('searchgrid').getSelectionModel().getChecked()[0].data;
                    var id = Ext.getCmp('searchgrid').getSelectionModel().getChecked()[0].id;
                }
                else {
                    var data = Ext.getCmp('searchgrid').getSelectionModel().getSelections()[0].data;
                    var id = Ext.getCmp('searchgrid').getSelectionModel().getSelections()[0].id;
                }
                var searchtargetname = data.location[0].name;
                var searchtargetsid = DB.SearchTargets.select('name=?', [searchtargetname]).getOne().rowid;
				progress.updateProgress(.6, 'Retrieving record from server');
                var record = new DB.Records({
                    title: UI.editor[editorid].record.getTitle() || '',
                    author: UI.editor[editorid].record.getAuthor() || '',
                    location: data.location[0].name || '',
                    publisher:UI.editor[editorid].record.getPublisher() || '',
                    medium: data.medium || '',
                    date:UI.editor[editorid].record.getDate() || '',
                    status: 'new',
                    xml: xml,
                    date_added: new Date().toString(),
                    date_modified: new Date().toString(),
                    SearchTargets_id: searchtargetsid,
                    Savefiles_id: savefileid,
                    xmlformat: 'marcxml',
                    marcflavour: 'marc21',
                    template: null,
                    marcformat: null
                }).save();
                UI.editor[editorid].id = db.lastInsertRowId;
				if(bibliosdebug == 1 ) { console.info( "Saving record with id: " + recid + " and content: " + xml); }
                biblios.app.fireEvent('saverecordcomplete', savefileid, record.xml);
                // enable Revert, Duplicate buttons now that record is saved
                Ext.getCmp(editorid + 'DuplicateBtn').enable();
                Ext.getCmp(editorid + 'RevertBtn').enable();
			}
			else { // recid isn't empty so we've already saved this record, just update it
				try {
					var record = DB.Records.select('Records.rowid = ?', [recid]).getOne();
					if( record.marcflavour == 'marc21' ) {
						record.title = UI.editor[editorid].record.getTitle() || '';
						record.author = UI.editor[editorid].record.getAuthor() || '';
						record.publisher = UI.editor[editorid].record.getPublisher() || '';
						record.dateofpub = UI.editor[editorid].record.getDate() || '';
					}
					record.xml = xml;
					record.Savefiles_id = savefileid;
					record.status = 'edited';
					record.date_modified = new Date().toString();
					record.save();
					if(bibliosdebug) { 
						console.info("saved record with id: " + recid + " to savefile: " + savefilename); 
				}
					progress.updateProgress(1, 'Saving record to local database');
                    biblios.app.fireEvent('saverecordcomplete', savefileid, record.xml);
                    
				} catch(ex) {
						Ext.MessageBox.alert('Database error',ex.message);
				}
			}
            showStatusMsg("Record(s) saved to "+savefilename);
            clearStatusMsg();
			progress.hide();
			return true;
		} // save record from marc editor
		// if we're picking from the savefile grid 
		else if( openState == 'savegrid' ) {
			if( dropped == true) {
				var grid = Ext.getCmp( 'savegrid' );
				var ds = grid.store;
				var sel = grid.getSelectionModel().getChecked();
				// update the record(s) based on current selection
				for( var i = 0; i < sel.length; i++) {
					var id = sel[i].data.Id;
					try {
						var record = DB.Records.select('Records.rowid=?',[id]).getOne();
						record.status = 'edited';
						record.date_modified = new Date().toString();
						record.Savefiles_id = savefileid;
						record.save();
						if(bibliosdebug) { console.info("saved record with id: " + id + " to savefile: " + savefileid); }
					}
					catch(ex) {
						Ext.MessageBox.alert("Database error", ex.message);
					}
				}
			}
			else {
				var records = Ext.getCmp('savegrid').getSelectionModel().getChecked();
                if( records.length == 0) {
                    records = Ext.getCmp('searchgrid').getSelectionModel().getSelections();
                }
				for( var i = 0 ; i < records.length; i++) {
					var id = parseInt(records[i].data.Id);
					try {
						var r = DB.Records.select('Records.rowid=?', [id]).getOne();
						r.Savefiles_id = savefileid;
						r.save();
                        biblios.app.fireEvent('saverecordcomplete', savefileid, r.xml);
					}
					catch(ex) {
						showStatusMsg('Unable to move record ' + records[i].title);
					}
				}
				// reload savegrid store to moved records don't appear in currently open folder
				Ext.getCmp('savegrid').store.reload();
			}
		}
		// if we're picking from the search grid
		else if( openState == 'searchgrid' ) {
			
				var records = Ext.getCmp('searchgrid').getSelectionModel().getChecked();
				
				
				showStatusMsg('Saving selected records');
				
					
					for( var i = 0; i < records.length; i++) {
						
						addRecordFromSearch(records[i], savefileid, editorid);
					}
				
		}
		showStatusMsg('Records saved');
		Ext.getCmp('savegrid').el.unmask();
		setTimeout( function(){ clearStatusMsg() }, 2000);
		return true;
	}

function doSaveRemote(loc, xmldoc, editorid) {
	/*Ext.get('ffeditor').mask();
	Ext.get('vareditor').mask();*/
	// make sure we have up to date record
	transferFF_EdToTags(UI.editor[editorid].ffed, UI.editor[editorid].vared, editorid);
	UI.editor[editorid].record.update();
	xmldoc = UI.editor[editorid].record.XML();
	UI.editor[editorid].location = loc;
	UI.editor.progress = Ext.MessageBox.progress('Saving record to remote server', '');
	if(bibliosdebug) { console.info('Saving open record to ' + loc); }
	// set UI.editor.location to point to this record so we get special entries etc.
	Prefs.remoteILS[loc].instance.saveHandler = function(xmldoc, status) {
		if( status == 'failed' ) {
			UI.editor.progress.hide();
			Ext.MessageBox.alert('Remote Send Target failure', "Remote send target couldn't save record");
            biblios.app.fireEvent('sendrecordcomplete', loc, xmldoc, status);
		} 
		else {
            if( !biblios.app.fireEvent('sendrecordcomplete', loc, xmldoc, status)) {
                return false;
            }
			var xml = xslTransform.serialize(xmldoc);
			UI.editor.progress.updateProgress(.7, 'Retrieved remote record');
			openRecord(xml, editorid, 'marcxml');
			/*Ext.get('ffeditor').unmask();
			Ext.get('vareditor').unmask();*/
			UI.editor.progress.hide();
		}
	};
    var xml = UI.editor[editorid].record.XMLString();
    if( !biblios.app.fireEvent('beforesendrecord', loc, xml, editorid) ) {
        return false;
    }
    try {
        Prefs.remoteILS[loc].instance.save(xmldoc);
    }
    catch(ex) {
        Ext.MessageBox.alert('Error', ex.msg);
    }
	UI.editor.progress.updateProgress(.5, 'Sending to remote server');
	UI.editor[editorid].savedRemote[loc] = true;
}


function addRecordFromSearch(srchRecord, savefileid, editorid) {
	
        biblios.app.fireEvent('remoterecordretrieve', srchRecord.data.fullrecord);
		// data param is this record's xml as returned by pazpar2
		// o is a json literal containing the record id, grid data and savefileid for this record
		if(bibliosdebug == 1 ) {console.info('inserting into savefile: ' + savefileid + ' record with title: ' + srchRecord.data.title);}
		try {
			var target = DB.SearchTargets.select('name=?', [srchRecord.data.location[0].name]).getOne();
			var savefile = DB.Savefiles.select('Savefiles.rowid=?', [savefileid]).getOne();
			var record = new DB.Records({
				title: UI.editor[editorid]? UI.editor[editorid].record.getTitle() : srchRecord.data.title || '',
				author: UI.editor[editorid]? UI.editor[editorid].record.getAuthor():  srchRecord.data.author || '',
				location: srchRecord.data.location[0].name || '',
				publisher:UI.editor[editorid]?  UI.editor[editorid].record.getPublisher(): srchRecord.data.publication || '',
				medium: srchRecord.data.medium || '',
				date:UI.editor[editorid]?  UI.editor[editorid].record.getDate(): srchRecord.data.date|| '',
				status: 'new',
				xml: srchRecord.data.fullrecord,
				date_added: new Date().toString(),
				date_modified: new Date().toString(),
				SearchTargets_id: target.rowid,
				Savefiles_id: savefile.rowid,
				xmlformat: 'marcxml',
				marcflavour: 'marc21',
				template: null,
				marcformat: null
			}).save();
            biblios.app.fireEvent('saverecordcomplete', savefile.rowid, record.xml);
			if (biblios.app.selectedRecords.loading = true) {
				showStatusMsg('Saved ' + srchRecord.data.title);
			}
		} catch(ex) {
			Ext.MessageBox.alert('Database Error', ex.message);
		}
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
	Ext.menu.MenuMgr.get('searchgridSaveMenu').removeAll();
	Ext.menu.MenuMgr.get('savegridSaveMenu').removeAll();
	var savefiles = getSaveFileMenuItems('editorone');
	for( sf in savefiles ) {
		Ext.menu.MenuMgr.get('editorOneSaveMenu').add( savefiles[sf] );
	}
	var savefiles = getSaveFileMenuItems('editortwo');
	for( sf in savefiles) {
		Ext.menu.MenuMgr.get('editorTwoSaveMenu').add( savefiles[sf] );
	}
	var savefiles = getSaveFileMenuItems('searchgrid');
	for( sf in savefiles) {
		Ext.menu.MenuMgr.get('searchgridSaveMenu').add( savefiles[sf] );
	}
	var savefiles = getSaveFileMenuItems('savegrid');
	for( sf in savefiles) {
		Ext.menu.MenuMgr.get('savegridSaveMenu').add( savefiles[sf] );
	}
}



function updateSaveMenu(menu, component) {
    menu.removeAll();
    var items = getSaveFileMenuItems(component);
    for( i in items ) {
        menu.add( items[i]);
    }
    biblios.app.fireEvent('updatesavemenu', menu);
}

function updateSendMenu(menu, component) {
    menu.removeAll();
    var items = getSendFileMenuItems(component);
    for( i in items ) {
        menu.add( items[i]);
    }
    biblios.app.fireEvent('updatesendmenu', menu);
}

function sendSelectedFromSearchGrid(locsendto) {
    Prefs.remoteILS[locsendto].instance.saveHandler = function(xmldoc, status) {
        biblios.app.fireEvent('sendrecordcomplete', locsendto, xmldoc, status);
        if( status == 'ok' ) {
            var title = $('datafield[@tag=245] subfield[@code=a]', xmldoc).text();
            showStatusMsg('Saved ' + title + ' to ' + locsendto);
            clearStatusMsg();
        }
        else {
            showStatusMsg('Saving failed ' + status);
            clearStatusMsg();
        }
    };
   	var records = Ext.getCmp('searchgrid').getSelectionModel().getChecked();
    for(var i= 0; i < records.length; i++) {
        var id= records[i].id;
        var loc= records[i].data.location;
        
        var title= records[i].data.title;
		var xml = records[i].data.fullrecord;
        
            if( !biblios.app.fireEvent('beforesendrecord', loc, xml, '') ) {
                return false;
            }
            showStatusMsg('Sending ' + title + ' to ' + locsendto);
            Prefs.remoteILS[locsendto].instance.save(xml);
       
        }
}

function sendSelectedFromSaveGrid(locsendto) {
    Prefs.remoteILS[locsendto].instance.saveHandler = function(xmldoc, status) {
        if( !biblios.app.fireEvent('sendrecordcomplete', locsendto, xmldoc, status) ) {
            return false;
        }
        if( status == 'ok') {
            var title = $('datafield[@tag=245] subfield[@code=a]', xmldoc).text();
            showStatusMsg('Saved ' + title + ' to ' + locsendto);
            biblios.app.send.numToSend--;
            if( biblios.app.send.numToSend == 0) {
                biblios.app.send.records.length = 0;
                clearStatusMsg();
            }
        }
        else {
            showStatusMsg('Saving failed: ' + status);
            setTimeout( function() {clearStatusMsg();}, 2000)
        }
    };
    var records = Ext.getCmp('savegrid').getSelectionModel().getChecked();
    for( var i = 0; i < records.length; i++) {
            var xml = records[i].data.xml;
            var xmldoc = '';
            if( Ext.isIE ) {
                xmldoc = new ActiveXObject("Microsoft.XMLDOM"); 
                xmldoc.async = false; 
                xmldoc.loadXML(xml);
            }
            else {
                xmldoc = (new DOMParser()).parseFromString(xml, "text/xml");  
            }
            if( !biblios.app.fireEvent('beforesendrecord', locsendto, xml, '') ) {
                return false;
            }
            showStatusMsg('Sending ' + records[i].data.title + ' to ' + locsendto);
            Prefs.remoteILS[locsendto].instance.save(xmldoc);
    }
}

function sendFromEditor(locsendto, editorid) {
    if( validateRemote(editorid, locsendto) ) {
        if( !biblios.app.fireEvent('beforesendrecord', '', UI.editor[editorid].record.XML(), locsendto)){
            return false;
        }
        doSaveRemote(locsendto, UI.editor[editorid].record.XML(), editorid);
    }
}

function getSendFileMenuItems(recordSource) {
	var list = new Array();
	var sendtargets = DB.SendTargets.select('enabled=1').toArray();
	var handler;
	if( recordSource == 'searchgrid') {
		handler = function(btn) {
		    sendSelectedFromSearchGrid(btn.id);	
		}
	}
	else if (recordSource == 'savegrid') {
		handler = function(btn) {
            sendSelectedFromSaveGrid(btn.id);
		}
	}
	// if we're in a marceditor
	else {
		handler = function(btn) {
            sendFromEditor(btn.id, btn.recordSource);
		}
	}
	for( var i = 0; i < sendtargets.length; i++) {
		var o = {
			text: sendtargets[i].name,
			id: sendtargets[i].name,
			recordSource: recordSource,
			handler: handler
		};
		list.push(o);
	}
	return list;
}

function getSaveFileMenuItems(recordSource) {
	var list = new Array();
	getSaveFileNames();
	var savefiles = DB.Savefiles.select().toArray();
	for ( var i = 0; i < savefiles.length; i++) {
		var o = {
			text: savefiles[i].name,
			id: savefiles[i].rowid,
			recordSource: recordSource,
			handler: function(btn) {
				var savefileid = btn.id;
				var editorid = btn.recordSource;
				doSaveLocal(savefileid, recordSource);
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
