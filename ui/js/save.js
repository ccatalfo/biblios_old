function doSaveLocal(savefileid, editorid, offset, dropped ) {
		var recoffset = offset || 0;
		if( !savefileid ) {
			if(debug == 1 ) { console.info( "doSaveLocal: Setting savefile to Drafts on save" );}
				savefileid = 2; // Drafts
		}
		var savefilename = getSaveFileNameFromId(savefileid);
		showStatusMsg('Saving to '+ savefilename);
		var rs, xml;
		// if we have a record open in the marceditor, get its xml and save to drafts
		if( openState == 'editorPanel' ) {
			// make sure we have up to date record
			transferFF_EdToTags(UI.editor[editorid].ffed, UI.editor[editorid].vared, editorid);
			UI.editor[editorid].record.update();
			Ext.get('fixedfields_editor').mask();
			Ext.get('varfields_editor').mask();
			var progress = Ext.MessageBox.progress('Saving record');
			// transform edited record back into marcxml
			xml = UI.editor[editorid].record.XMLString();
			progress.updateProgress(.5, 'Extracing marcxml');
			var recid = UI.editor[editorid].id;
			// if we don't have a record id, add this record to the db first
			if( recid == '' ) {
				if(debug == 1 ) { console.info( "doSaveLocal: no recid so record must be from search results.  Retrieving data from searchgrid."); }
				var data = Ext.getCmp('searchgrid').getSelections()[0].data;
				var id = Ext.getCmp('searchgrid').getSelections()[0].id;
				progress.updateProgress(.6, 'Retrieving record from server');
				recid = addRecordFromSearch(id, 0, editorid, data, savefileid, xml);
				if(debug == 1 ) { console.info( "Saving record with id: " + recid + " and content: " + xml); }
			}
			else { // recid isn't empty so we've already saved this record, just update it
				try {
					var record = DB.Records.select('Records.rowid = ?', [recid]).getOne();
					if( record.marcflavour == 'marc21' ) {
						record.title = UI.editor[editorid].record.getValue('245', 'a');
						record.author = UI.editor[editorid].record.getValue('100', 'a');
						record.publisher = UI.editor[editorid].record.getValue('260', 'b');
						record.dateofpub = UI.editor[editorid].record.getValue('260', 'c');
					}
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
		else if( openState == 'savegrid' ) {
			var grid = Ext.getCmp( 'savegrid' );
			var ds = grid.store;
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
		// if we're picking from the search grid
		else if( openState == 'searchgrid' ) {
			if( dropped == true ) {
				var sel = Ext.getCmp('searchgrid').getSelections();
				for( var i = 0; i < sel.length; i++) {
					var id = sel[i].id;
					var data = sel[i].data;
					addRecordFromSearch(id, recoffset, editorid, data, savefileid);		
				}
			}
			else {
				biblios.app.selectedRecords.savefileid = savefileid;
				biblios.app.selectedRecords.loading = true;
				showStatusMsg('Saving selected records');
				getSelectedSearchGridRecords( function() {
					var records = biblios.app.selectedRecords.records;
					biblios.app.selectedRecords.numToGet = records.length;
					for( var i = 0; i < records.length; i++) {
						var id = records[i].id;
						var data = records[i].data;
						var title = records[i].title;
						var offset =records[i].offset;
						addRecordFromSearch(id, offset, editorid, data, savefileid);
					}
				});
			}
		}
		showStatusMsg("Record(s) saved to "+savefilename);
		clearStatusMsg();
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
			setupReservedTags(loc, editorid);
			setupSpecialEntries(loc, editorid);
			/*Ext.get('ffeditor').unmask();
			Ext.get('vareditor').unmask();*/
			UI.editor.progress.hide();
		}
	};
    try {
        Prefs.remoteILS[loc].instance.save(xmldoc);
    }
    catch(ex) {
        Ext.MessageBox.alert('Error', ex.msg);
    }
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
				location: params.recData.location[0].name || '',
				publisher:UI.editor[editorid]?  UI.editor[editorid].record.getValue('260', 'b'): params.recData.publication || '',
				medium: params.recData.medium || '',
				date:UI.editor[editorid]?  UI.editor[editorid].record.getValue('260', 'c'): params.recData.date|| '',
				status: 'new',
				xml: params.newxml || xslTransform.serialize(data) || '<record></record>',
				date_added: new Date().toString(),
				date_modified: new Date().toString(),
				SearchTargets_id: target.rowid,
				Savefiles_id: savefile.rowid,
				xmlformat: 'marcxml',
				marcflavour: 'marc21',
				template: null,
				marcformat: null
			}).save();
			if (biblios.app.selectedRecords.loading = true) {
				showStatusMsg('Saved ' + params.recData.title);
				biblios.app.selectedRecords.numToGet--;
				if( biblios.app.selectedRecords.numToGet == 0 ) {
					showStatusMsg('Records saved');
					biblios.app.selectedRecords.loading = false;
					biblios.app.selectedRecords.savefileid = '';
					Ext.getCmp('savegrid').el.unmask();
					setTimeout( function(){ clearStatusMsg() }, 2000);
				}
			}
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
	Ext.menu.MenuMgr.get('searchgridSaveMenu').removeAll();
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

function getSelectedSearchGridRecords(callback) {
	showStatusMsg('Retrieving remote records...');
	biblios.app.selectedRecords.loading = true;
	biblios.app.selectedRecords.records = new Array;
	if( biblios.app.selectedRecords.allSelected == true ) {
		var totalcount = Ext.getCmp('searchgrid').store.getTotalCount();
		biblios.app.selectedRecords.numToGet = totalcount;
		Ext.getCmp('searchgrid').store.on('load', function(store, records, option) {
			if( biblios.app.selectedRecords.loading == true ) {
				for( var i = 0 ;i <records.length; i++) {
					var id = records[i].id;
					var title = records[i].data.title;
					var loc = records[i].data.location[0].id;
					var offset = 0;
					var data = records[i].data;
					biblios.app.selectedRecords.records.push( { id: id, title: title, data: data, loc: loc, offset: offset });
				}
				callback.call(this);
			}
			biblios.app.selectedRecords.retrieved = true;
			biblios.app.selectedRecords.loading = false;
			selectAll();
		});
		Ext.getCmp('searchgrid').store.load({params:{start:0, num:totalcount}});
	}
	else {
		var checked = $(':checked.searchgridcheckbox');
		biblios.app.selectedRecords.numToGet = checked.length;
		for( var i = 0; i < checked.length; i++) {
			var id = checked[i].id.substr(6);
			var title = Ext.getCmp('searchgrid').store.getById(id).data.title;
			var data = Ext.getCmp('searchgrid').store.getById(id).data;
			var offset = checked[i].id.substr(5,1);
			var loc = ''
			if( $(':checked').eq(0).parents('.locationitem').length > 0 ) {
				
				loc = $(checked).eq(i).parents('.locationitem').text();

			}
			else {
				loc = Ext.getCmp('searchgrid').store.getById(id).data.location[0].name;
			}
			biblios.app.selectedRecords.records.push( { id: id, title: title, data: data, loc: loc, offset: offset });
		}
		biblios.app.selectedRecords.retrieved = true;
		callback.call(this);
	}
}

function getSelectedSaveGridRecords() {
	var records = new Array();
	if( biblios.app.selectedRecords.allSelected == true ) {
					Ext.getCmp('savegrid').store.each( function(record) {
						var id = record.data.Id;
						var title = record.data.Title;
						var xmldoc = getLocalXml(id);
						records.push( {id: id, title: title, xmldoc: xmldoc });
					});
				}
	else {
		var checked = $(':checked.savegridcheckbox');
		biblios.app.send.numToSend = checked.length;
		for( var i = 0; i < checked.length; i++) {
			var rowid = $(checked).get(i).id;
			var id = Ext.getCmp('savegrid').store.find('Id', rowid);
			var title = Ext.getCmp('savegrid').store.getAt(id).data.Title;
			var xmldoc = getLocalXml(rowid);
			records.push( {rowid: rowid, id: id, title: title, xmldoc: xmldoc });
		}
	}
	return records;
}

function getSendFileMenuItems(recordSource) {
	var list = new Array();
	var sendtargets = DB.SendTargets.select('enabled=1').toArray();
	var handler;
	if( recordSource == 'searchgrid') {
		handler = function(btn) {
			biblios.app.send.numToSend = 0;
			biblios.app.send.records.length = 0;
			Prefs.remoteILS[btn.id].instance.saveHandler = function(xmldoc, status) {
                if( status == 'ok' ) {
                    var title = $('datafield[@tag=245] subfield[@code=a]', xmldoc).text();
                    showStatusMsg('Saved ' + title + ' to ' + btn.id);
                    biblios.app.send.numToSend--;
                    if( biblios.app.send.numToSend == 0) {
                        biblios.app.send.records.length = 0;
                        setTimeout( function() {clearStatusMsg();}, 2000)
                    }
                }
                else {
                    showStatusMsg('Saving failed ' + status);
                    setTimeout( function() {clearStatusMsg();}, 2000)
                }
			};
			getSelectedSearchGridRecords( function() { 
                biblios.app.send.numToSend = biblios.app.selectedRecords.records.length;
                var records = biblios.app.selectedRecords.records;
                for(var i= 0; i < records.length; i++) {
                    var id= records[i].id;
                    var loc= records[i].loc;
                    var offset= records[i].offset;
                    var title= records[i].title;
                    showStatusMsg('Sending ' + title + ' to ' + btn.id);
                    getRemoteRecord(id, loc, offset, function(data) { 
                        Prefs.remoteILS[btn.id].instance.save(data);
                    });
                }
            });
		}
	}
	else if (recordSource == 'savegrid') {
		handler = function(btn) {
			Prefs.remoteILS[btn.id].instance.saveHandler = function(xmldoc, status) {
                if( status == 'success') {
                    var title = $('datafield[@tag=245] subfield[@code=a]', xmldoc).text();
                    showStatusMsg('Saved ' + title + ' to ' + btn.id);
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
			biblios.app.send.numToSend = 0;
			biblios.app.send.records.length = 0;
			biblios.app.send.records = getSelectedSaveGridRecords();
			for( var i = 0; i < biblios.app.send.records.length; i++) {
					showStatusMsg('Sending ' + biblios.app.send.records[i].title + ' to ' + btn.id);
					var xml = biblios.app.send.records[i].xmldoc;
					var xmldoc = '';
					if( Ext.isIE ) {
						xmldoc = new ActiveXObject("Microsoft.XMLDOM"); 
						xmldoc.async = false; 
						xmldoc.loadXML(xml);
					}
					else {
						xmldoc = (new DOMParser()).parseFromString(xml, "text/xml");  
					}
					Prefs.remoteILS[btn.id].instance.save(xmldoc);
			}
		}
	}
	// if we're in a marceditor
	else {
		handler = function(btn) {
			// if this record has already been saved to this location
			if( UI.editor[btn.recordSource].savedRemote[btn.id] == true ) {
				if( validateRemote(btn.recordSource, btn.id) ) {
					doSaveRemote(btn.id, UI.editor[btn.recordSource].record.XML(), btn.recordSource);
				}
			}
			// if the record has not already been saved remotely
			else {
					doSaveRemote(btn.id, UI.editor[recordSource].record.XML(), btn.recordSource);
			}
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

