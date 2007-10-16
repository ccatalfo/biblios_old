
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
function doSaveLocal(savefileid, savefilename, sel, dd) {
	if( !savefilename ) {
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
	}
	showStatusMsg('Saving to '+ savefilename);
    var rs;
    // if we have a record open in the marceditor, get its xml and save to drafts
    if( Ext.get('marceditor').isVisible() ) {
        var ff_ed = $("#fixedfields_editor");
        var var_ed = rte_editor._getDoc();
        // transform edited record back into marcxml
        if( marcFlavor == 'marc21' ) {
            xml = Edit2XmlMarc21(ff_ed, var_ed);
        } 
        else if( marcFlavor == 'unimarc' ) {
            Ext.MessageBox.alert("Unimarc support not yet implemented");
        }
        var recid = currOpenRecord;
        if(debug == 1 ) { console.info( "Saving record with id: " + recid + " and content: " + xml); }
        try {
            rs = db.execute('update Records set xml=? where id=?', [xml, recid]);	
            rs = db.execute('select savefile from Records where id=?', [recid]);	
            // get the savefile this record is in
            savefileid = rs.fieldByName('savefile');
            rs = db.execute('select name from SaveFiles where id=?', [savefileid]);
            savefilename = rs.fieldByName('name');
            // if null, we haven't saved this record anywhere yet so set to Drafts
            if(savefilename == null) {
                savefileid = 2;
                savefilename = 'Drafts';
                rs = db.execute('update Records set savefile=? where id=?', [savefileid, recid]);	
            } 
            rs = db.execute('update Records set status=? where id=?', ['edited', recid]);	
            rs = db.execute('update Records set date_modified=datetime("now", "localtime") where id=?', [recid]);	
            if(debug) { console.info("saved record with id: " + recid + " to savefile: " + savefilename); }
                rs.close();
            } catch(ex) {
                Ext.MessageBox.alert('Database error',ex.message);
            }
        return true;
    }
    // if a savefile has been dropped on by a record from a search or save grid
    else if(dd) {
	// grid data source: e.data.selections[0].id
	// we've got the sel passed into this func
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
		for( var i = 0; i < sel.length; i++) {
			var id = sel[i].id;
			paz.recordCallback = function(data) { addRecord( data ) }
			paz.record(id, 0);
		}
    }
    showStatusMsg("Record(s) saved to "+savefilename);
    return true;
}

// FIXME need to get server from selection
function addRecord(data) {
	var savefileid = 2;
	var xml = xslTransform.serialize( data.xmlDoc );
	try {
		db.execute('insert into Records (id, xml, status, date_added, date_modified, server, savefile) values (null, ?, ?, date("now", "localtime"), date("now", "localtime"), ?, ?)', [xml, 'new', server, savefileid]);
		if(debug == 1 ) {console.info('inserting into savefile: ' + savefileid + ' record with title: ' + title);}
	} catch(ex) {
		Ext.Msg.alert('Error', 'db error: ' + ex.message);
	}
	var lastId = getLastRecId();	
	return lastId;
}



