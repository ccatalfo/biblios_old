var UI = {};
UI.search = {};
UI.search.remoteILS = {};
UI.searchpreview = {};
UI.searchpreview.id = '';
UI.searchpreview.xml = '';
UI.searchLimits = {};
UI.savepreview = {};
UI.savepreview.id = '';
UI.savepreview.xml = '';
UI.editor = {};
UI.editor.lastElemHelpShown = '';
UI.editor.id = '';
UI.editor.lastEditorId = '';
UI.editor.lastFocusedEl = '';
// marc editor one metadata
UI.editor.editorone = {};
UI.editor.editorone.id = '';
UI.editor.editorone.ffed = '';
UI.editor.editorone.vared = '';
UI.editor.editorone.location = '';
UI.editor.editorone.savedRemote  = {};
UI.editor.editorone.savefileid  = '';
UI.editor.editorone.record = new MarcEditor('', '');
UI.editor.editorone.comboboxes = new Array();
// marc editor two metadata
UI.editor.editortwo = {};
UI.editor.editortwo.id = '';
UI.editor.editortwo.ffed = '';
UI.editor.editortwo.vared = '';
UI.editor.editortwo.location = '';
UI.editor.editortwo.savedRemote  = {};
UI.editor.editortwo.savefileid  = '';
UI.editor.editortwo.record = new MarcEditor('', '');
UI.editor.editortwo.comboboxes = new Array();
// search state
UI.search = {};
UI.search.currQuery = '';
UI.search.limitby = {};
// save state
UI.save = {};
UI.save.savefile = {};
UI.savefilesql = 'SELECT Records.rowid as Id, Records.title as Title, Records.author as Author, Records.date as DateOfPub, Records.location as Location, Records.publisher as Publisher, Records.medium as Medium, Records.xml as xml, Records.status as Status, Records.date_added as DateAdded, Records.date_modified as DateModified, Records.xmlformat as xmlformat, Records.marcflavour as marcflavour, Records.template as template, Records.marcformat as marcformat, Records.Savefiles_id as Savefiles_id, Records.SearchTargets_id as SearchTargets_id FROM Records';
UI.currSaveFile = '';
UI.currSaveFileName = '';
// window state
UI.lastWindowOpen = '';
UI.lastSearchPreviewed = '';
UI.lastSavePreview = '';
// keymaps
UI.keymaps = {};
// layouts
UI.optionsLayout = {};
// templates
UI.templates = {
	tagHelp: new Ext.Template(
		'<div class="taghelp" id="taghelp">',
			'<p class="tagname">Tag: {tagname}</p>',
			'<p class="tagdesc">Description: {tagdesc}</p>',
			'<div id="indicatorshelp">',
				'<p class="indicatorstitle">Indicators</p>',
			'</div>',
			'<div class="subfieldshelp" id="subfieldshelp">',
				'<p class="subfieldstitle">Subfields</p>',
			'</div>',
		'</div>'
	),
	indicatorsHelp: new Ext.Template(
		'<div id="indicatorhelp-{indicatornumber}" class="indicatorhelp">',
			'<p class="indicatornumber">Indicator {indicatornumber}</p>',
			'<p class="indicatordesc">Description: {indicatordesc}</p>',
			'<div class="indicatorvalues" id="indicatorvalues-{indicatornumber}"></div>',
		'</div>'
	),
	indicatorValue: new Ext.Template(
		'<p class="optionname">Option name: {optionname}</p>',
		'<p class="optiondesc">Option description: {optiondesc}</p>',
		'<p class="optioncode">Option code: {optioncode}</p>'
	),
	subfieldsHelp: new Ext.Template(
		'<div id="subfieldhelp-{subfieldcode}" class="subfieldhelp">',
			'<p class="subfieldname">Subfield: {subfieldname}</p><p class="subfieldcode">Code: {subfieldcode}</p>',
			'<p class="subfielddesc">Description: {subfielddesc}</p>',
		'</div>'
	),
	fixedfieldHelp: new Ext.Template(
		'<div id="ffhelp" class="ffhelp">',
			'<p class="ffname">{ffname}</p>',
			'<p class="ffdesc">{ffdesc}</p>',
			'<div id="ffoptions"></div>',
		'</div>'
	),
	ffOption: new Ext.Template(
		'<div class="ffoption"></div>',
			'<p class="ffoptioncode">{code}</p>',
			'<p class="ffoptiondesc">{desc}</p>',
			'<br/>',
		'</div>'
	)
};
// msgs
UI.messages = {
	help: {
		en: {
			'welcome': '<p class="helpTitle">Welcome to Biblios!</p><p class="helpText">version 0.9 beta</p><p class="helpText">Supports searching Z39.50 servers (Search Targets) defined under Options->Search Targets.</p><p class="helpText">Edit monograph records using integrated marc editors (see Editors in sidepanel at left).</p>',
			'searchview': '<p class="helpTitle">Searching</p><br/><p class="helpText">Click on a row in the grid to display a preview.</p><p class="helpText">Create a new record with New button.</p><p class="helpText">Drag 1 or more records to a save folder to save records to that folder.</p><p class="helpText">Select Export to export selected records to MARC21 or MARCXML formats.</p><p class="helpText">Once you have performed a search, click on the Facets folder at left to view search facets.  Checking a facet will re-run the search and limit the results to those matching that facet.</p>',
			'saveview': '<p class="helpTitle">Save Folders</p><br/><p class="helpText">Click on a row in the grid to display a preview.</p><p class="helpText">Create a new record with New button.</p><p class="helpText">Drag 1 or more records to a save folder to save records to that folder.</p><p class="helpText">Select Export to export selected records to MARC21 or MARCXML formats.</p><p class="helpText">Right-click on a save folder item to add, remove, or rename folders.</p>',
			'recordview': '<p class="helpTitle">Record Editing</p><br/><p class="helpText">Save a record to local save files with Save button.</p><p class="helpText">Save a record to a remote ILT with Send button.</p><p class="helpText">Add or remove fields or subfields with Tools button.</p><p class="helpText">Export a record to MARC21 or MARCXML with Export button.</p><p class="helpText">Editing an authority controlled field (in blue with underline) will perform a query of the authority server defined for this instance of Biblios for valid headings to enter.</p>'
		}

	},
	menu: {
		en: {

		}

	},
	error: {
		en: {

		}

	}
};

/*
   Function: openRecord

   Display the record whose id is passed in in the marc editor for editing.

   Parameters:

   id: id of the record to edit.

   Returns:

   None.

*/
function openRecord(xml, editorelem) {
	UI.editor.progress = Ext.MessageBox.progress('Loading record', '');
	// we need to display record view first since editors are lazily rendered
	UI.lastWindowOpen = openState;
	openState = 'editorPanel';
	biblios.app.displayRecordView();
	if( editorelem == 'editortwo') {
		Ext.getCmp('editortwo').expand();
	}
	var ffed =	$('#'+editorelem).find(".ffeditor");
	$(ffed).empty();
	var vared = $('#'+editorelem).find(".vareditor");
	$(vared).empty();

	UI.editor[editorelem].record = new MarcEditor();
	var xmldoc;
	if( Ext.isIE ) {
		xmldoc = new ActiveXObject("Microsoft.XMLDOM"); 
		xmldoc.async = false; 
		xmldoc.loadXML(xml);
	}
	else {
		xmldoc = (new DOMParser()).parseFromString(xml, "text/xml");  
	}
	html = UI.editor[editorelem].record.loadXml( xmldoc );
	Ext.get('marc'+editorelem).update(html);
	var ffed =	$('#'+editorelem).find(".ffeditor");
	var vared = $('#'+editorelem).find(".vareditor");

	UI.editor[editorelem].ffed = ffed;
	UI.editor[editorelem].vared = vared;

	UI.editor.progress.updateProgress(.9, 'Setting up editor hot keys');
	setupEditorHotkeys(editorelem);
	UI.editor.progress.updateProgress(.9, 'Setting up authority control');
	setupMarc21AuthorityLiveSearches(editorelem);

	// setup comboboxes for ctry and lang fixed fields
	setupFFEditorLangCombo(editorelem);
	setupFFEditorCtryCombo(editorelem);

	// setup remote ils-controlled fields
	if( Prefs.remoteILS[ UI.editor[editorelem].location ] ) {
		setupReservedTags( UI.editor[editorelem].location, editorelem);
		setupSpecialEntries( UI.editor[editorelem].location, editorelem);
	}
	// show fixed field editor, hide ldr and 008 divs
	$(ffed).show();
	// hide fixed field controlfields
	$('#'+editorelem).find("#000, #008, #006, #007").css('display', 'none');
	UI.editor.lastFocusedEl = $('#'+editorelem).find('#000').get(0);
	UI.editor[editorelem].lastFocusedEl = $('#'+editorelem).find('#000').get(0);
	UI.editor.progress.updateProgress(1, 'MarcEditor loaded');
	UI.editor.progress.hide();
	clearStatusMsg();
}

function previewRemoteRecord(id, offset) {
	getPazRecord(
		id,
		offset,
		// callback function for when pazpar2 returns record data
		function(data, o) {  
			if( $('error', data).length > 0 ) {
				Ext.getCmp('searchpreview').el.mask();
				$('#searchprevrecord').html('Error retrieving remote record.  Attempting to reset connection...');
				resetPazPar2({currRecId: o.id, currRecOffset: o.offset});
			}
			else {
				var xml = xslTransform.serialize(data); 
				recordCache[o.id] = xml; 
				Ext.getCmp('searchpreview').el.mask();
				$('#searchprevrecord').getTransform(marcxsl, xml);
				Ext.getCmp('searchpreview').el.unmask();
				clearStatusMsg();
			}
		},
		// json literal containing hash of desired params in callback
		{
			id: id,
			offset: offset
		}
	);

}

function makeSubfieldsDraggable() {
	 // add jquery draggable and droppable to subfields
	$('.subfield').Draggable();
	$('.subfield-text').Droppable(
	    {accept: 'subfield',
	      ondrop: function(drag) {
		  		var tagToAddTo = $(this).parents('.tag').find('.tagnumber').val();
				var subfieldCodeToAdd = $(drag).find('.subfield-delimiter').val().substr(1);
				var subfieldValueToAdd = $(drag).find('.subfield-text').val();
				UI.editor.record.addSubfield(tagToAddTo, subfieldCodeToAdd, subfieldValueToAdd);
				// make sure new subfield is draggable
				makeSubfieldsDraggable();
				$(drag).remove();
	       },
	      hoverclass: 'droppable'
	});
}

/*
   Function: doDownloadRecords

   Retrieve currently selected/open records, prompt user for record type (marc21, marcxml) and initiate download. 

   Parameters:

   None.

   Returns:

   None.

   See Also:
   <handleDownload>
*/
function doDownloadRecords(format, editorid) {
	biblios.app.download.records = new Array();
	biblios.app.download.numToExport = 0;
	biblios.app.download.recordsString = '';
	var recsep = "<!-- end of record -->";
	showStatusMsg("Downloading record(s)");
	// if we're exporting a record from the marc editor
	if( openState == 'editorPanel' ) {
			// transform edited record back into marcxml
			xml = UI.editor[editorid].record.XMLString();
			var encoding = 'utf-8';
			handleDownload(format, encoding, xml);
	}
	// if we're exporting from a grid
	else {
        if( openState == 'savegrid' ) {
			biblios.app.download.records = getSelectedSaveGridRecords();
			biblios.app.download.numToExport = biblios.app.download.records.length;
			for( var i = 0; i < biblios.app.download.records.length; i++) {
				biblios.app.download.recordsString += biblios.app.download.records[i].xmldoc;
				biblios.app.download.recordsString += recsep;
			}
			var encoding = 'utf-8';
			handleDownload(format, encoding, biblios.app.download.recordsString);
		}
		if( openState == 'searchgrid') {
			getSelectedSearchGridRecords(function() {
				var records = biblios.app.selectedRecords.records;
				biblios.app.download.recordsString = '';
				biblios.app.download.numToExport = biblios.app.selectedRecords.records.length;
				for( var i = 0; i < records.length; i++) {
					var id = records[i].id
					getPazRecord(id, 0, function(data, o) {
						xml = xslTransform.serialize(data);
						biblios.app.download.recordsString += xml;
						biblios.app.download.recordsString += recsep;
						biblios.app.download.numToExport--;
						var encoding = 'utf-8';
						if( biblios.app.download.numToExport == 0 ) {
							handleDownload(format, encoding, biblios.app.download.recordsString);
						}
					}, 
					{});
				}
			});
		}
    } // if we have a grid open 
}

function getExportMenuItems(editorid) {
	var list = new Array();
	var formats = new Array('MARC21', 'MARCXML');
	for( var i = 0; i < formats.length; i++) {
		var o = {
			text: formats[i],
			id: formats[i],
			editorid: editorid,
			handler: function(btn) {
				doDownloadRecords(btn.text, btn.editorid);
			}
		};
	list.push(o);
	}
	return list;

}


/*
   Function: handleDownload

   Handler (callback) for downloading records in MARC21 or MARCXML formats.

   Parameters:

   format: format of the record(s)
   encoding: encoding of the record(s)
   xml: xml data of the record(s)

   Returns:

   None.

   See Also:
   <doDownloadRecords>
*/
function handleDownload(format, encoding, xml) {
      $.post(
        cgiDir + "downloadMarc.pl", 
        {format: format, encoding: encoding, xml: xml}, 
          function(data) {
            //if(debug){ alert(data);}
            //$("<iframe id='dl' src="+cgiDir+"'download.pl?filename="+data+"'/>").appendTo("#downloads");
            //$("#dl").remove();
			var MIF = new Ext.ux.ManagedIFrame({ autoCreate:{src:cgiDir+'download.pl?filename='+data,height:350,width:'100%'}

                     ,loadMask :false 

                   });
			clearStatusMsg();
          }
        );
}

/*
   Function: doUploadMarc

   Prompt the user for a marc file to upload, process it to retrieve records within (in perl script), then return those marcxml records to the web application for display in a grid.

   Parameters:

   None.

   Returns:

   None.

   Note:

   *Not yet functional*

*/
function doUploadMarc() {
        var uploadDlg = new Ext.BasicDialog("upload-dlg", {
        height: 300,
        width: 500,
        modal: true   
        });
        uploadDlg.addKeyListener(26, uploadDlg.hide, uploadDlg);
        uploadDlg.addKeyListener(13, uploadDlg.hide, uploadDlg);
        uploadDlg.addButton('Cancel', uploadDlg.hide, uploadDlg);
        uploadDlg.body.dom.innerHTML = "<div id='uploadFormDiv'/>";
        $("#uploadFormDiv").append("<form id='uploadForm' target='upload_frame' method='POST' action="+cgiDir+"'uploadMarc.pl' enctype='multipart/form-data'>Choose a file to upload:<input type='file' id='fileToUpload' name='fileToUpload'/></form>");
        // add iframe to set as post target
        $("<iframe id='upload_frame' src='blank.html' style='display: none;' name='upload_frame'/>").appendTo("body");
        // add iframe target to upload form
        uploadDlg.addButton("Upload", function(){ 
                // post to the upload perl script w/ iframe as target
                 // submit the form!
                $("#uploadForm").submit();
                }, 
        uploadDlg);
        uploadDlg.show();
}

function getRecordTemplates() {
    var list = new Array();
    $("template", configDoc).each( function() {
		var template = {name: $("name", $(this)).text(), file: $("file", $(this)).text() };
		list.push(template);
    });
	return list;
}

function getNewRecordMenu() {
	var list = new Array();
	var templates = getRecordTemplates();
	for( var i = 0; i < templates.length; i++) {
		o = {
			text: templates[i].name,
			file: templates[i].file,
			id: templates[i].name,
			handler: function(btn) {
				Ext.Ajax.request({
							url: libPath + btn.file,
							method: 'GET',
							callback: function(options, isSuccess, resp) { 
								var xml = resp.responseText; 
								srchResults = (new DOMParser()).parseFromString(xml, "text/xml");
								var record = srchResults.getElementsByTagName('record')[0];
								var xml = (new XMLSerializer().serializeToString(record));
								openRecord(xml, 'editorone');
						} // ajax callback
				}); // ajax request
			} // do new record handler
		}; // new record menu item
		list.push(o);
	}
	return list;
}

/*
   Function: doCreateNewRecord

   Retrieve the marc record template, process its marcxml to create marceditor, then display the marceditor so the user may edit the template.

   Parameters:

   None.

   Returns:

   None.

*/
function doCreateNewRecord() {
        Ext.Ajax.request({
			url: filename,
			method: 'GET',
			callback: function(options, isSuccess, resp) { 
			   var xml = resp.responseText; 
			   srchResults = (new DOMParser()).parseFromString(xml, "text/xml");
				var currRecord = srchResults.getElementsByTagName('record')[0];
				var recordAsString = (new XMLSerializer().serializeToString(currRecord));
				if(debug){ console.info('newrecord: got xml: ' + recordAsString);}
				try {
				db.execute('insert into Records (id, xml, status, date_added, date_modified, server, savefile) values (null, ?, ?, date("now", "localtime"), date("now", "localtime"), ?, null)', [recordAsString, '', 'none']);
				if(debug == 1 ) {
					var title = $('[@tag="245"]/subfield[@code="a"]', srchResults).text();
					if(debug){console.info('inserting record with title: ' + title);}
				}
				} catch(ex) {
				Ext.Msg.alert('Error', 'db error: ' + ex.message);
				}
				var lastId = getLastRecId();
				showStatusMsg('Opening record...');
				var xml = getLocalXml(lastId);
				openRecord(xml);
				clearStatusMsg();
				currOpenRecord = lastId;
        }
        });
}



/*
   Function: doDeleteFromSaveFile

   Delete currently selected record(s) from the savefile their associated with.

   Parameters:

   None.

   Returns:

   None.

*/
function doDeleteFromSaveFile(sel) {
  // if we have an open record in the editor
  if (Ext.get('marceditor').isVisible() ){
      try {
        var id = currOpenRecord;
        db.execute("update Records set savefile = null where id = ?", [id]);
      }
      catch(ex) {
        Ext.Msg.alert('Error', 'db error: ' + ex.message);
      }
        displaySaveView();
  }
    // if records have been dropped onto the trash icon
  else if( sel ) {
      for( var i = 0; i < sel.length; i++) {
          var id = sel[i].data.Id;
          try {
            db.execute("update Records set savefile = null where id = ?", [id]);
          }
          catch(ex) {
            console.error('db error: ' + ex.message);
          }
      }
    showStatusMsg("Deleted "+ sel.length + " record(s).");
	clearStatusMsg();
    // redisplay current savefile (to show moved record)
    var currentNode = folderTree.getSelectionModel().getSelectedNode();
    displaySaveFile(currentNode.attributes.savefileid, currentNode.text); 
    displaySaveView();
  }
}

/*
  Function: showStatusMsg

  Parameters: 

    msg: String containing message to show

  Returns:

    None.
*/
function showStatusMsg(msg) {
	Ext.get('status-msg').update(msg);
	//Ext.get('status-msg').slideIn();
}

function clearStatusMsg() {
	//Ext.get('status-msg').slideOut();
	Ext.get('status-msg').update('');
}

/* Function: filterSearchResultsByServer
  Filter Search results by Server name based on checkbox status of server targets in folder list.

  Parameters: 

  None.

  Returns:

  None.

*/
function filterSearchResultsByServer() {
  // loop through search nodes, filtering out targets which aren't checked
  var checkednodes = new Array();
  var targetnodes = folderRoot.findChild('searchRoot').childNodes;
  for( var i = 0; i < targetnodes.length; i++ ) {
    if( targetnodes[i].attributes.checked == true ) {
      checkednodes.push( targetnodes[i].attributes.servername );
	  changePazPar2TargetStatus( {db: targetnodes[i].attributes.hostname + ":" + targetnodes[i].attributes.port + "/" + targetnodes[i].attributes.dbname, allow: '1'} );
    }
	else {
	  changePazPar2TargetStatus( {db: targetnodes[i].attributes.hostname + ":" + targetnodes[i].attributes.port + "/" + targetnodes[i].attributes.dbname, allow: '0' });
	}
  }
  searchds.filterBy( function(record, id) {
    // if this records Server name matches one of the checkednodes, return true for this record
    for( var i = 0; i < checkednodes.length; i++) {
      if( record.data.location == checkednodes[i] ) {
        return true;
      }
    }
  });
	// rerun search using updated targets
	disableFacets();
	biblios.app.paz.search( biblios.app.paz.currQuery );
}

function getLocalXml(id) {
	var xml = DB.Records.select('Records.rowid=?',[id]).getOne().xml;
	return xml;
}

function selectAllInObject() {
	if(openState == 'searchgrid') {
		biblios.app.selectedRecords.allSelected = true;
		biblios.app.selectedRecords.selectedSource = 'searchgrid';
		$('.searchgridtotalcount').html( Ext.getCmp('searchgrid').store.getTotalCount() );
		$('#searchgridallSelectedStatus').show();
	}
	else if (openState == 'savegrid') {
		var n = Ext.getCmp('FoldersTreePanel').getSelectionModel().getSelectedNode();
		var savefileid = n.attributes.savefileid;
		biblios.app.selectedRecords.allSelected = true;
		biblios.app.selectedRecords.selectedSource = 'savegrid';
		biblios.app.selectedRecords.savefileid = savefileid;
		$('.savegridtotalcount').html( Ext.getCmp('savegrid').store.getTotalCount() );
		$('#savegridallSelectedStatus').show();
	}
}

function selectAll() {
	if(openState == 'searchgrid') {
		$('#searchgrid :checkbox').attr('checked', 'checked');
		$('.searchgridtotalcount').html( Ext.getCmp('searchgrid').store.getTotalCount() );
		$('#searchgridtbarSelectAll').show();
		biblios.app.selectedRecords.allSelected = false;
		biblios.app.selectedRecords.retrieved = false;
		biblios.app.selectedRecords.selectedSource = 'searchgrid';
		Ext.getCmp('searchgridExportBtn').enable();
		Ext.getCmp('searchgridSendBtn').enable();
		Ext.getCmp('searchgridSaveBtn').enable();
	}
	else if( openState == 'savegrid') {
		$('#savegrid :checkbox').attr('checked', 'checked');
		$('.savegridtotalcount').html( Ext.getCmp('savegrid').store.getCount() );
		$('#savegridtbarSelectAll').show();
		biblios.app.selectedRecords.allSelected = false;
		biblios.app.selectedRecords.selectedSource = 'savegrid';
		Ext.getCmp('savegridExportBtn').enable();
		Ext.getCmp('savegridSendBtn').enable();
	}
}

function selectNone() {
	if(openState == 'searchgrid') {
		$('#searchgrid :checkbox').attr('checked', '');
		$('#searchgridtbarSelectAll').hide();
		$('#searchgridallSelectedStatus').hide();
		Ext.getCmp('searchgridExportBtn').disable();
		Ext.getCmp('searchgridSendBtn').disable();
		Ext.getCmp('searchgridSaveBtn').disable();
		biblios.app.selectedRecords.allSelected = false;
		biblios.app.selectedRecords.retrieved = false;
	}
	else if( openState == 'savegrid') {
		$('#savegrid :checkbox').attr('checked', '');
		$('#savegridtbarSelectAll').hide();
		$('#savegridallSelectedStatus').hide();
		Ext.getCmp('savegridExportBtn').disable();
		Ext.getCmp('savegridSendBtn').disable();
		biblios.app.selectedRecords.allSelected = false;
	}
}

function getMacroMenuItems(recordSource) {
	var handler = function(btn) {};
	if( recordSource == 'searchgrid') {
		var handler = function(btn) {
            // not implemented
		}
	}
	else if( recordSource == 'savegrid' ) {
		handler = function(btn) {
			var records = getSelectedSaveGridRecords();
			for( var i = 0; i < records.length; i++) {
				var xmldoc = xslTransform.loadString( records[i].xmldoc  );
				var dbrecord = DB.Records.select('Records.rowid=?', [ records[i].rowid ]).getOne();
				var title = records[i].title;
				var record = new MarcRecord();
				record.loadMarcXml( xmldoc );
				var macro = DB.Macros.select('Macros.rowid=?',[btn.id]).getOne();
				showStatusMsg('Running ' + macro.name + ' on ' + title);
				try {
					eval( macro.code );
					dbrecord.xml = record.XMLString();
                    dbrecord.title = record.field('245').subfield('a').getValue();
                    dbrecord.author = record.field('245').subfield('c').getValue();
                    dbrecord.publisher = record.field('260').subfield('b').getValue();
                    dbrecord.date = record.field('260').subfield('c').getValue();
                    dbrecord.date_modified = new Date().toString();
					dbrecord.save();
				}
				catch(ex) {
					Ext.MessageBox.alert('Macro error', ex);
				}
				clearStatusMsg();
			}
            Ext.getCmp('savegrid').store.reload();
		}
	}
	else {
		handler = function(btn) {
			var editorid = btn.recordSource;
			var xmldoc = UI.editor[editorid].record.XML();
			var record = new MarcRecord();
			record.loadMarcXml( xmldoc );
			var macro = DB.Macros.select('Macros.rowid=?',[btn.id]).getOne();
			showStatusMsg('Running macro ' + macro.name );
			try {
				eval( macro.code );
				openRecord(record.XMLString(), editorid);
			}
			catch(ex) {
				Ext.MessageBox.alert('Macro error', ex);
			}
			clearStatusMsg();
		}
	}
	var items = new Array();
	DB.Macros.select('enabled=1').each( function(macro) {
		var i = {
			text: macro.name,
			id: macro.rowid,
			recordSource:  recordSource,
			code: macro.code,
			handler: handler
		}
		items.push(i);
	});
	return items;
}

function runMacro() {

}

