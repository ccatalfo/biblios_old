/**
  * Application Layout
  * by Jozef Sakalos, aka Saki
  * http://extjs.com/learn/Tutorial:Application_Layout_for_Beginners
  */
 
// reference local blank image
Ext.BLANK_IMAGE_URL = 'lib/extjs2/resources/images/default/s.gif';
// create namespace
Ext.namespace('biblios');
 
// create application
biblios.app = function() {
    // do NOT access DOM from here; elements don't exist yet
 
    // private variables
	var debug = 1;
	var viewport; 
	var viewState = '';
	var paz = initializePazPar2(pazpar2url, {
		initCallback: function(data) {
			paz.sessionID = this.sessionID;
			// set pazpar2 search results grid url
			setPazPar2Targets();
		}
		});
	// save file vars
	var currSaveFile, currSaveFileName;
	var savefiles = {}; // hash mapping save file id -> names
	// editor
	var editor = {};
	editor.record = {};
	
	var savefileSelectSql = 'SELECT Records.rowid as Id, Records.title as Title, Records.author as Author, Records.date as DateOfPub, Records.location as Location, Records.publisher as Publisher, Records.medium as Medium, Records.xml as xml, Records.status as Status, Records.date_added as DateAdded, Records.date_modified as DateModified, Records.xmlformat as xmlformat, Records.marcflavour as marcflavour, Records.template as template, Records.marcformat as marcformat, Records.Savefiles_id as Savefiles_id, Records.SearchTargets_id as SearchTargets_id FROM Records';
	// facets vars


    // private functions
	doSaveLocal = function doSaveLocal(savefileid, editorid, offset ) {
		var recoffset = offset || 0;
		if( !savefileid ) {
			if(debug == 1 ) { console.info( "doSaveLocal: Setting savefile to Drafts on save" )}
				savefileid = 2; // Drafts
		}
		var savefilename = savefiles[savefileid];
		showStatusMsg('Saving to '+ savefilename);
		var rs, xml;
		// if we have a record open in the marceditor, get its xml and save to drafts
		if( openState == 'editorPanel' ) {
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
			var grid = Ext.getCmp( 'searchgrid' );
			var ds = grid.store;
			var sel = grid.getSelectionModel().getSelections();
			for( var i = 0; i < sel.length; i++) {
				var id = sel[i].id;
				var data = sel[i].data;
				addRecordFromSearch(id, recoffset, editorid, data, savefileid);
			}
		}
		showStatusMsg("Record(s) saved to "+savefilename);
		return true;
	}
	getSaveFileNames : function getSaveFileNames() {
	var savefilenames = new Array();
	DB.Savefiles.select().each( function(savefile) {
		var o = {id: savefile.rowid, name: savefile.name};
		savefilenames.push( o );
		savefiles[ savefile.rowid ] = savefile.name;
	});
	return savefilenames;
}
	displaySearchView : function displaySearchView() {
		Ext.getCmp('bibliocenter').layout.setActiveItem(0);
		openState = 'searchgrid';
	}

	displaySaveFile : function displaySaveFile(id) {
		Ext.getCmp('savegrid').store.load({db: db, selectSql: savefileSelectSql + ' where Savefiles_id = '+id});
		biblios.app.displaySaveView();
		openState = 'savegrid';
	}

	displayRecordView : function displayRecordView() {
		Ext.getCmp('bibliocenter').layout.setActiveItem(1);

	}

	displaySaveView: function displaySaveView() {
		Ext.getCmp('bibliocenter').layout.setActiveItem(2);
	}
	
	showStatusMsg : function showStatusMsg(msg) {
	$('#status').css('display', 'block');
	$('#status').empty();
	if( $("#status").length == 0 ) {
		$("#folder-list").append("<div id='status'></div>");
	}
	if( $("#status").text() == msg) {
		// don't show this same status message twice
		return false;
	}
	else {
		$("#status").append(msg);
		//$("#status").SlideInLeft(1000);
		//$("#status").SlideOutLeft(2000);
	}
}
	updateSearchTargetFolders: function updateSearchTargetFolders() {
	var searchRoot = Ext.ComponentMgr.get('searchRoot');

	// remove old nodes
	for( var i = searchRoot.childNodes.length-1; i >= 0; i--) {
		searchRoot.removeChild( searchRoot.childNodes[i] );
	}
	// re-create targets and add them
    var searchTreeChildren = new Array();
    var targets = getTargets();
    for( var i = 0; i < targets.length; i++) {
        var data = targets[i];
        var targetnode = new Ext.tree.TreeNode(
          {
            text: data.name, 
            servername: data.name,
            id: data.rowid, 
			hostname: data.hostname,
			port: data.port,
			dbname: data.dbname,
            checked: data.enabled?true:false,
            qtip: data.description, 
            leaf: false, 
            allowDelete:false, 
            allowAdd: false,
            allowDrag: false, 
            allowDrop:true, 
            ddGroup:'RecordDrop', 
            icon: libPath + 'ui/images/network-server.png'
          });
        var serverleaf = new Ext.tree.TreeNode(
          {
            text: '<span class="database-details">Server:</span> ' + data.hostname,
            leaf: true
          });
        var portleaf = new Ext.tree.TreeNode( 
          {
            text: '<span class="database-details">Port:</span> ' + data.port,
            leaf: true
          });
        var dbnameleaf = new Ext.tree.TreeNode(
          { 
            text: '<span class="database-details">Database:</span> ' + data.dbname,
            leaf: true
          });
        var userleaf = new Ext.tree.TreeNode (
          {
            text: '<span class="database-details">User:</span> ' + data.userid,
            leaf: true
          });
        targetnode.on('checkchange', function(node, checked) {
          filterSearchResultsByServer();
          //setEnableTargets();
        });
        targetnode.appendChild([serverleaf, portleaf, dbnameleaf, userleaf]);
        searchTreeChildren.push(targetnode);
    }
	if( searchTreeChildren.length > 0 ) {
		searchRoot.appendChild(searchTreeChildren);
	}
	searchRoot.on('click', function(n) {
		displaySearchView();
        //folderTree.getSelectionModel().select(n); // displaySaveView selects root save so select the node user clicked
	});
	// expand searchRoot if it's been rendered
	if( searchRoot.rendered == true ) {
		searchRoot.expand();
	}
}
	getNodeBySaveFileId : function getNodeBySaveFileId(savefileid) {
    var wanted_node;
    // visit each node under savefiles root and find one w/ savefileid
    saveFilesRoot.cascade( function(n){
    if(n.attributes.savefileid == savefileid ) {
        wanted_node = n;
    }
    });
    return wanted_node;
}
	createFacetFolder : function createFacetFolder() {
	facetsRoot = new Ext.tree.TreeNode({
		text: 'Facets',
		leaf: false,
		disabled: true,
		id: 'facetsRoot'
	});
	Ext.ComponentMgr.register(facetsRoot);
	var subjectRoot =  new Ext.tree.TreeNode({
		name: 'subjectRoot',
		text: "<b>Subjects</b>",
		leaf: false
	});
	var authorRoot =  new Ext.tree.TreeNode({
		name: 'authorRoot',
		text: "<b>Authors</b>",
		leaf: false
	});
	var dateRoot =  new Ext.tree.TreeNode({
		name: 'dateRoot',
		text: "<b>Dates</b>",
		leaf: false
	});
	var pubRoot =  new Ext.tree.TreeNode({
		name: 'publication-nameRoot',
		text: "<b>Publisher</b>",
		leaf: false
	});
	facetsRoot.appendChild(subjectRoot, authorRoot, dateRoot, pubRoot);
	facetsRoot.eachChild(function(n) {
		n.on('afterchildrenrendered', hideDisabledFacets);
	});
	return facetsRoot;
}
	createSaveFileFolders : function createSaveFileFolders(parentid) {
	if( ! Ext.ComponentMgr.get('saveFileRoot') ) {
		saveFilesRoot = new Ext.tree.TreeNode({
			allowDrag:false,
			allowDrop:false,
			allowDelete: false,
			allowAdd: true,
			allowRename: false,
			id:'saveFileRoot',
			parentid: 'null',
			savefileid: 'null',
			leaf:false,
			text: 'Folders',
			icon: libPath + 'ui/images/folder.png',
			cls: 'rootFolders'
		});
		Ext.ComponentMgr.register(saveFilesRoot);
		saveFilesRoot.on('click', function() {
			displaySaveView();
		});
	}
    // get all savefiles at the root level, then for each append its children
    var current_root;
	var savefiles = new Array();
    if( parentid == 'null' ) {
		savefiles = DB.Savefiles.select('parentid is null');
        current_root = saveFilesRoot;
    }
    else {
		savefiles = DB.Savefiles.select('parentid = ?', [parentid]);
        current_root = getNodeBySaveFileId(parentid);
    }
	savefiles.each( function(savefile) {
        // create a treenode for this save file
        var newnode = new Ext.tree.TreeNode({
            id: savefile.name,
            text: savefile.name, 
            savefileid: savefile.rowid, 
            parentid: savefile.parentid,
            qtip: savefile.description, 
            icon: savefile.icon,
            leaf: false, 
            allowDelete: savefile.allowDelete, 
            allowAdd: savefile.allowAdd,
            allowDrag: savefile.allowDrag, 
            allowDrop: savefile.allowDrop, 
            ddGroup: savefile.ddGroup
        }); 
        current_root.appendChild(newnode);
        newnode.on('click', function(n) {
			showStatusMsg('Displaying ' + n.attributes.id);
			currSaveFile = n.attributes.savefileid;
			currSaveFileName = n.text;
            displaySaveView();
            Ext.getCmp('resourcesTree').getSelectionModel().select(n); // displaySaveView selects root save so select the node user clicked
            displaySaveFile(n.attributes.savefileid); 
			//clearStatusMsg();
        });
        // setup dropnode for Trash
        if( name == 'Trash' ) {

        }
        createSaveFileFolders(savefile.rowid);
    }); 
	return saveFilesRoot;
}

	createFolderList: function createFolderList() {
    folderRoot = new Ext.tree.TreeNode({
        allowDrag:false,
        allowDrop:false,
        id:'folderRoot',
    });

    var savefilesRoot = createSaveFileFolders('null'); 
	var searchRoot = createTargetFolders();
	var facetsRoot = createFacetFolder();

	folderRoot.appendChild([searchRoot, facetsRoot, saveFilesRoot]);
    //saveFilesRoot.expand();
    //searchRoot.expand();

	return folderRoot;
	} 
	createTargetFolders: function createTargetFolders() {
	// remove old searchRoot if it exists to clear out any old entries
	var folderRoot = Ext.ComponentMgr.get('folderRoot');
	var searchRoot = new Ext.tree.TreeNode({
		allowDrag:false,
		allowDrop:false,
		id:'searchRoot',
		leaf: false,
		text: 'Resources',
		icon: libPath + 'ui/images/folder-remote.png'
	});
	Ext.ComponentMgr.register(searchRoot);

	updateSearchTargetFolders();
	return searchRoot;
}
    // public space
    return {
        // public properties, e.g. strings to translate
		viewport : this.viewport,
		currQuery : this.currQuery,
		savefiles : this.savefiles,
		db : {
			selectSqlSendTargets : 'select SendTargets.rowid as rowid, name, location, url, user, password, pluginlocation, plugininit, enabled from SendTargets',
			selectSqlSearchTargets: 'select SearchTargets.rowid as rowid, name, hostname, port, dbname, description, userid, password, syntax, enabled from SearchTargets'

			
		},
		
        // public methods
		displaySearchView : function() {
			displaySearchView();
		},
		displaySaveView : function() {
			displaySaveView();
		},
		displaySaveFile: function(id) {
			displaySaveFile(id);
		},
		displayRecordView : function() {
			displayRecordView();
		},

        init: function() {
            this.viewport = new Ext.Viewport({
				layout: 'border',
				items: [
					{
						region: 'north',
						height: 60,
						layout: 'border',
						items: [
							{
								region: 'center',
								id: 'searchformpanel',
								contentEl: 'searchform'
							},
							{
								region: 'west',
								html: '<img src="ui/images/biblios-logo.gif"/>'
							},
							{
								region: 'east',
								html: '<div id="status"></div>'
							}
						] // north region items
					}, // viewport north region
					new Ext.TabPanel({
						region: 'center',
						items: [
							{
								title: 'Home',
								closable: false,
								autoScroll: true,
								id: 'hometab'
							}, // home tab
							{
								title: 'Biblio',
								closable: false,
								autoScroll: true,
								layout: 'border',
								id: 'bibliotab',
								listeners: {
									activate: function(p) {
										biblios.app.viewport.doLayout();
									}
								}, //biblio tab listeners
								items: [
									{
										region: 'center',
										layout: 'card',
										activeItem: 0,
										id: 'bibliocenter',
										items: [
											{
												region: 'center',
												layout: 'border',
												id: 'searchpanel',
												height: 500,
												width: 500,
												items: [
													new Ext.grid.GridPanel({
														enableDragDrop: true,
														ddGroup: 'RecordDrop',
														region: 'center',
														height: 300,
														width: 300,
														id: 'searchgrid',
														store : (ds = new Ext.data.Store({
															proxy: new Ext.data.HttpProxy({url: pazpar2url+'?session='+paz.sessionID+'&command=show'}),
															reader: 
																new Ext.ux.NestedXmlReader({
																	totalRecords: 'merged',
																	record: 'hit',
																	id: 'recid'
																}, Ext.data.Record.create([
																	{name: 'title', mapping: 'md-title'},
																	{name: 'title-remainder', mapping: 'md-title-remainder'},
																	{name: 'author', mapping:'md-author'},
																	{name: 'title-responsibility', mapping:'md-title-responsibility'},
																	{name: 'publication', mapping:'md-publication-name'},
																	{name: 'date', mapping: 'md-date'},
																	{name: 'medium', mapping:'md-medium'},
																	{name: 'location', mapping: function(rec) {
																		var locations = Ext.DomQuery.select('location', rec);
																		var result = new Array();
																		for( var i = 0; i < locations.length; i++) {
																			var name = Ext.DomQuery.select('@name', locations[i])[0].firstChild.nodeValue;
																			var id = Ext.DomQuery.select('@id', locations[i])[0].firstChild.nodeValue;
																			result.push({name: name, id: id});
																		}
																		return result;
																		} // location mapping function
																	}, // end location mapping
																	{name: 'count', mapping: 'count'},
																	// extra data column to hold display of multiple locs
																	{name: 'locationinfo', mapping: 
																		function(rec) {
																			var locations = Ext.DomQuery.select('location', rec);
																			var html = '<ul class="locationlist"';
																			for( var i = 0; i < locations.length; i++) {
																				var name = Ext.DomQuery.select('@name', locations[i])[0].firstChild.nodeValue;
																				var id = Ext.DomQuery.select('@id', locations[i])[0].firstChild.nodeValue;
																				html += '<li id="locitem-'+i+'" class="locationitem" onclick="previewRecordOffset('+i+')">'+name+'</li>';
																			}
																			html += '</ul>';
																			return html;
																		} // locationinfo mapping function
																	} // locationinfo mapping
																	]) // search grid record
																),//search grid reader
																	remoteSort: false
														})), // data store search grid aka ds
														sm: new Ext.grid.RowSelectionModel({
															listeners: {
																rowselect: function(selmodel, rowindex, record) {
																	var id = record.id;
																	if( record.data.count > 1 ) {
																		

																	}
																	else {
																		// get the marcxml for this record and send to preview()
																		getPazRecord(
																			id,
																			0,
																			// callback function for when pazpar2 returns record data
																			function(data, o) {  
																				var xml = xslTransform.serialize(data); 
																				recordCache[o.id] = xml; 
																				Ext.getCmp('searchpreview').el.mask();
																				$('#searchprevrecord').getTransform(marcxsl, xml);
																				Ext.getCmp('searchpreview').el.unmask();
																			},
																			// json literal containing hash of desired params in callback
																			{
																				id: id
																			}
																		);
																	}
																} // search grid row select handler
															} // selection listeners
														}), // search grid selecion model
														cm : new Ext.grid.ColumnModel([
															(expander = new Ext.grid.RowExpander({
																remoteDataMethod: function(record, index) {
																	var locations = record.data.location;
																	var html = '';
																	for( var i = 0; i < locations.length; i++) {
																		var id = 'loc'+i;
																		html += '<p id="'+id+'">' + locations[i].name + '</p>';

																	}
																	$('#remData'+index).html(html);
																	// set up drag source and preview for each of these items
																	for( var i = 0; i < locations.length; i++) {
																		Ext.get('loc'+i).dd = new Ext.dd.DragSource('loc'+i, {ddGroup: 'RecordDrop'});
																		Ext.get('loc'+i).on('click', function(e) {
																			var record = Ext.getCmp('searchgrid').getSelections()[0];
																			var id = record.id;
																			var offset = e.getTarget().id.substr(3);
																			getPazRecord(
																				id,
																				offset,
																				// callback function for when pazpar2 returns record data
																				function(data, o) {  
																					var xml = xslTransform.serialize(data); 
																					recordCache[o.id] = xml; 
																					Ext.getCmp('searchpreview').el.mask();
																					$('#searchprevrecord').getTransform(marcxsl, xml);
																					Ext.getCmp('searchpreview').el.unmask();
																				},
																			// json literal containing hash of desired params in callback
																			{
																				id: id
																			}
																		);


																		});
																	}
																}
															})),
															{header: "Medium", width: 50, dataIndex: 'medium'},
															{header: "Title", width: 180, dataIndex: 'title'},
															{header: "Author", width: 120, dataIndex: 'title-responsibility'},
															{header: "Publisher", width: 120, dataIndex: 'publication'},
															{header: "Date", width: 50, dataIndex: 'date'},
															{header: "Location", width: 100, dataIndex: 'location',
																renderer: function(data, meta, record, row, col, store) {
																			if( record.data.location.length == 1 ) {
																				return record.data.location[0].name;
																			}
																			else {
																				return 'Found in ' + record.data.location.length + ' targets';
																			}
																} // renderer function for Location
															} // Location column
														]), // column model for search grid
														plugins: expander, // search grid plugins
														listeners: {
															rowdblclick: function(grid, rowindex, e) {
																var id = grid.getSelections()[0].id;
																UI.editor['editorone'].id = id;
																var loc = grid.getSelections()[0].data.location;
																getRemoteRecord(id, loc, 0, function(data) { openRecord( xslTransform.serialize(data), 'editorone' ) }
														);

															},
															keypress: function(e) {
															  if( e.getKey() == Ext.EventObject.ENTER ) {
																var id = Ext.getCmp('searchgrid').getSelections()[0].id;
																UI.editor['editorone'].id = id;
																var loc = Ext.getCmp('searchgrid').getSelections()[0].data.location;
																  getRemoteRecord(id, loc, 0, function(data) { openRecord( xslTransform.serialize( data), 'editorone' ) });
																}	
															} // on ENTER keypress
														}, // search grid listeners
														tbar: new Ext.PagingToolbar({
															pageSize: 15,
															store: ds,
															displayInfo: true,
															displayMsg: 'Displaying records {0} - {1} of {2}',
															emptyMsg: 'No records to display',
															items: [
																{
																	id: 'newrecordbutton',
																	icon: libPath + 'ui/images/document-new.png',
																	cls: 'x-btn-text-icon bmenu',
																	text: 'New',
																	menu: {
																		id: 'newRecordMenu',
																		items: getNewRecordMenu()
																	}
																},
																{
																		cls: 'x-btn-text-icon',
																		icon: libPath + 'ui/images/document-open.png',
																		text: 'Edit',
																		disabled: false, // start disabled.  enable if there are records in the datastore (searchsaveds)
																		handler: function() {
																			var id = Ext.getCmp('searchgrid').getSelections()[0].id;
																			UI.editor['editorone'].id = id;
																			var loc = Ext.getCmp('searchgrid').getSelections()[0].data.location;
																			getRemoteRecord(id, loc, 0, function(data) { 
																				openRecord( xslTransform.serialize(data), 'editorone' ) 
																			});
																		}
																	},
																	{   
																		cls: 'x-btn-text-icon bmenu', // icon and text class
																		icon: libPath + 'ui/images/network-receive.png',
																		text: 'Export',
																		menu: {
																			id: 'exportMenu',
																			items: getExportMenuItems()
																		}
																	}
																] // grid toolbar items
														}) // search grid paging toolbar
													}), // search results grid panel
													{
														region: 'south',
														id: 'searchpreview',
														title: 'Preview',
														split: true,
														collapsible: true,
														autoScroll: true,
														html: '<div id="searchselect"></div><div id="searchprevrecord"></div>',
														height: 150
													} // search preview 
												] // search results items
											}, // search results region
											{
												region: 'center',
												id: 'editorpanel',
												layout: 'border',
												items: [
													{
														region: 'center',
														id: 'editorone',
														cls: 'marceditor',
														autoScroll: true,
														split: true,
														height: 300,
														html: '<div class="ffeditor"></div><div class="vareditor"></div>',
														tbar: (editorToolbar = [
															{
																cls: 'x-btn-text-icon bmenu', // icon and text class
																icon: libPath + 'ui/images/document-save.png',
																text: 'Save',
																menu: {
																	id: 'editorOneSaveMenu',
																	items: getSaveFileMenuItems('editorone')
																}
															},
															{
																cls: 'x-btn-text-icon bmenu', // icon and text class
																icon: libPath + 'ui/images/document-save.png',
																text: 'Send',
																menu: {
																	id: 'editorOneSendMenu',
																	items: getSendFileMenuItems('editorone')
																}
															},
															{   
																cls: 'x-btn-text-icon bmenu', // icon and text class
																icon: libPath + 'ui/images/network-receive.png',
																text: 'Export',
																menu: {
																	id: 'editorOneExportMenu',
																	items: getExportMenuItems('editorone')
																}
															},
															{
																cls: 'x-btn-text-icon', // icon and text class
																icon: libPath + 'ui/images/process-stop.png',
																id: 'editorOneCancelMenu',
																editorid: 'editorone',
																text: 'Cancel',
																handler: function(btn) {
																	showStatusMsg('Cancelling record...');
																	if( UI.lastWindowOpen  == 'savegrid' ) {
																		biblios.app.displaySaveView();
																	}
																	else if( UI.lastWindowOpen  == 'searchgrid' ) {
																		biblios.app.displaySearchView();
																	}
																	clear_editor(btn.editorid);
																	clearStatusMsg();
																}
															},
															{
																cls: 'x-btn-text-icon', // icon and text class
																icon: libPath + 'ui/images/edit-copy.png',
																text: 'Merge',
																handler: doMerge,
																disabled: true
															},
															{
																cls: 'x-btn-text-icon', // icon and text class
																icon: libPath + 'ui/images/preferences-system.png',
																text: 'Options',
																handler: doRecordOptions,
																disabled: true
															}
														]) // editorone toolbar
													},
													// editor two
													{
														region: 'south',
														id: 'editortwo',
														cls: 'marceditor',
														autoScroll: true,
														split: true,
														collapsible: true,
														collapsed: true,
														title: 'Editor 2',
														height: 300,
														html: '<div class="ffeditor"></div><div class="vareditor"></div>',
														tbar: [
															{
																cls: 'x-btn-text-icon bmenu', // icon and text class
																icon: libPath + 'ui/images/document-save.png',
																text: 'Save',
																menu: {
																	id: 'editorTwoSaveMenu',
																	items: getSaveFileMenuItems('editortwo')
																}
															},
															{
																cls: 'x-btn-text-icon bmenu', // icon and text class
																icon: libPath + 'ui/images/document-save.png',
																text: 'Send',
																menu: {
																	id: 'editorTwoSendMenu',
																	items: getSendFileMenuItems('editortwo')
																}
															},
															{   
																cls: 'x-btn-text-icon bmenu', // icon and text class
																icon: libPath + 'ui/images/network-receive.png',
																text: 'Export',
																menu: {
																	id: 'editorTwoExportMenu',
																	items: getExportMenuItems('editortwo')
																}
															},
															{
																cls: 'x-btn-text-icon', // icon and text class
																icon: libPath + 'ui/images/process-stop.png',
																id: 'editorTwoCancelMenu',
																editorid: 'editortwo',
																text: 'Cancel',
																handler: function() {
																	showStatusMsg('Cancelling record...');
																	if( UI.lastWindowOpen  == 'savegrid' ) {
																		biblios.app.displaySaveView();
																	}
																	else if( UI.lastWindowOpen  == 'searchgrid' ) {
																		biblios.app.displaySearchView();
																	}
																	clear_editor('editortwo');
																	clearStatusMsg();
																}
															},
															{
																cls: 'x-btn-text-icon', // icon and text class
																icon: libPath + 'ui/images/edit-copy.png',
																text: 'Merge',
																handler: doMerge,
																disabled: true
															},
															{
																cls: 'x-btn-text-icon', // icon and text class
																icon: libPath + 'ui/images/preferences-system.png',
																text: 'Options',
																handler: doRecordOptions,
																disabled: true
															}
														] // editortwo toolbar
													} // editor south
												] // editor items
											}, // editor region
											{
												region: 'center',
												id: 'savefilepanel',
												layout: 'border',
												items: [
														new Ext.grid.GridPanel({
															region: 'center',
															id: 'savegrid',
															enableDragDrop: true,
															ddGroup: 'RecordDrop',
															height: 300,
															store: (ds = new Ext.data.Store({
																proxy: new Ext.data.GoogleGearsProxy(),
																reader: new Ext.data.ArrayReader({}, [
																	   {name: 'Id'},
																	   {name: 'Title'},
																	   {name: 'Author'},
																	   {name: 'DateOfPub'},
																	   {name: 'Location'},
																	   {name: 'Publisher'},
																	   {name: 'Medium'},
																	   {name: 'xml'},
																	   {name: 'Status'},
																	   {name: 'Date Added'},
																	   {name: 'Last Modified'},
																	   {name: 'xmlformat'},
																	   {name: 'marcflavour'},
																	   {name: 'template'},
																	   {name: 'marcformat'},
																	   {name: 'Savefiles_id'},
																	   {name: 'SearchTargets_id'}
																  ])
															})), // save grid store aka ds
															sm: new Ext.grid.RowSelectionModel({
																listeners: {
																	rowselect: function(selmodel, rowindex, record) {
																		var id = record.data.Id;
																		var xml = getLocalXml(id);
																		Ext.getCmp('savepreview').el.mask();
																		$('#saveprevrecord').getTransform(marcxsl, xml);
																		Ext.getCmp('savepreview').el.unmask();
																	}
																} // selection listeners
															}), // save grid selecion model
															cm: new Ext.grid.ColumnModel([
																{header: "Medium", dataIndex: 'Medium', sortable: true},
																{header: "Title", width: 200, dataIndex: 'Title', sortable: true},
																{header: "Author", width: 160, dataIndex: 'Author', sortable: true},
																{header: "Publisher", width: 130, dataIndex: 'Publisher', sortable: true},
																{header: "DateOfPub", width: 80, dataIndex: 'DateOfPub', sortable: true},
																{header: "Status", width: 100, dataIndex: 'Status', sortable: true},
																{header: "Date Added", width: 120, dataIndex: 'Date Added', sortable: true},
																{header: "Last Modified", width: 120, dataIndex: 'Last Modified', sortable: true},
															]),
															listeners: {
																rowdblclick: function(grid, rowIndex, e) {
																	var id = grid.store.data.get(rowIndex).data.Id;
																	showStatusMsg('Opening record...');
																	var xml = getLocalXml(id);
																	UI.editor.id = id;
																	openRecord( xml, 'editorone');
																},// save grid row dbl click handler
																keypress: function(e) {
																	if( e.getKey() == Ext.EventObject.ENTER ) {
																		var sel = Ext.getCmp('savegrid').getSelectionModel().getSelected();
																		var id = sel.data.Id;
																		UI.editor['editorone'].id = id;
																		var xml = getLocalXml(id);
																		openRecord( xml, 'editorone' );
																		showStatusMsg('Opening record...');
																		//clearStatusMsg();
																	} // ENTER
																} // savegrid keypress
															}, // save grid listeners
															tbar: new Ext.PagingToolbar({
																pageSize: 15,
																store: ds,
																displayInfo: true,
																displayMsg: 'Displaying records {0} - {1} of {2}',
																emptyMsg: 'No records to display',
																items: [
																{
																	id: 'newrecordbutton',
																	icon: libPath + 'ui/images/document-new.png',
																	cls: 'x-btn-text-icon bmenu',
																	text: 'New',
																	menu: {
																		id: 'newRecordMenuSaveGrid',
																		items: getNewRecordMenu()
																	}
																},
																{
																		cls: 'x-btn-text-icon',
																		icon: libPath + 'ui/images/document-open.png',
																		text: 'Edit',
																		disabled: false, // start disabled.  enable if there are records in the datastore (searchsaveds)
																		handler: function() {
																			var id = Ext.getCmp('savegrid').getSelections()[0].data.Id;
																			UI.editor['editorone'].id = id;
																			showStatusMsg('Opening record...');
																			var xml = getLocalXml(id);
																			openRecord( xml, 'editorone');
																		}
																	},
																	{   
																		cls: 'x-btn-text-icon bmenu', // icon and text class
																		icon: libPath + 'ui/images/network-receive.png',
																		text: 'Export',
																		menu: {
																			id: 'exportMenu',
																			items: getExportMenuItems()
																		}
																	}
																]
															}) // save grid paging toolbar
													}), // savepanel center
													{ 													
														region: 'south',
														id: 'savepreview',
														title: 'Preview',
														split: true,
														collapsible: true,
														height: 150,
														autoScroll: true,
														html: '<div id="select"></div><div id="saveprevrecord"></div>',
													} // savepanel south
												] // savepanel items
											} // savefilegrid region 
										] // biblio tab center items
									}, // biblio tab center
									{
										region: 'west',
										split: true,
										collapsible: true,
										collapsed: false,
										width: 200,
										maxSize: 200,
										title: 'Resources',
										layout: 'border',
										items: [
											{
												region: 'center',
												items: 
												[
													new Ext.tree.TreePanel({
														id: 'TargetsTreePanel',
														animate: true,
														leaf: false,
														lines: false,
														listeners: {
															click: function(node, e) {
																biblios.app.displaySearchView();
															}
														}, // save folder listeners
														root: new Ext.tree.AsyncTreeNode({
															text: 'Search Targets',
															id: 'targetsTreeRoot',
															loader: new Ext.ux.GearsTreeLoader({
																db: db, 
																selectSql: 'select SearchTargets.rowid, name, hostname, port, dbname, enabled, description, userid  from SearchTargets', 
																applyLoader: false,
																baseAttrs: {
																	allowDrag: false,
																	allowDrop: false,
																	allowAdd: false,
																	allowDelete: false,
																	icon: 'ui/images/network-server.png',
																	loader: new Ext.ux.GearsTreeLoader({
																		db: db,
																		selectSql: 'select hostname, port, userid, dbname from SearchTargets ',
																		whereClause: 'where SearchTargets.rowid=?',
																		processData: function(data) {
																			var json = '[';
																			for( var i = 0; i < data.length; i++) {
																				json += '{"leaf":true, "text":"Server:'+data[i][0]+'"},';
																				json += '{"leaf":true, "text":"Port:'+data[i][1]+'"},';
																				json += '{"leaf":true, "text":"Database:'+data[i][3]+'"},';
																				json += '{"leaf":true, "text":"User:'+data[i][2]+'"}';
																			}
																			json += ']';
																			return json;
																		} // processData for server info leaves
																	}) // loader for server info leaves
																}, // baseAttrs for server nodes
																processData: function(data) {  
																	var json = '[';
																	for( var i = 0; i< data.length; i++) {
																		if(i>0) {
																			json += ',';
																		}
																		json += '{';
																		json += '"leaf": false,';
																		json += '"servername":"'+data[i][1]+'",';
																		json += '"text":"'+data[i][1]+'",';
																		json += '"id":"'+data[i][0]+'",';
																		json += '"hostname":"'+data[i][2]+'",';
																		json += '"port":"'+data[i][3]+'",';
																		json += '"dbname":"'+data[i][4]+'",';
																		json += '}';
																	}
																	json += ']';
																	return json;
																}
															})
														}),
													}), // resources treepanel with treeeditor applied
													new Ext.tree.TreePanel({
														id: 'facetsTreePanel',
														animate: true,
														leaf: false,
														lines: false,
														applyLoader: false,
														loader: new Ext.ux.FacetsTreeLoader({dataUrl: pazpar2url + '?session='+paz.sessionID+'&command=termlist&name=author,subject,date,publication-name'}),
														root: new Ext.tree.AsyncTreeNode({
															text: 'Facets',
														}),
														listeners: {
															checkchange: function(node, checked) {
																if(checked == true) {
																	UI.searchLimits[node.id] = node.attributes.searchType;
																}
																else if( checked == false ) {
																	delete UI.searchLimits[node.id];
																}
																limitSearch();
															} // facets panel check change listener

														} // facets tree listeners
													}), // resources treepanel with treeeditor applied
													new Ext.tree.TreePanel({
														id: 'FoldersTreePanel',
														leaf: false,
														animate: true,
														expanded: true,
														enableDD: true,
														ddGroup: 'RecordDrop',
														lines: false,
														root: new Ext.tree.AsyncTreeNode({
															text: 'Save Folders',
															leaf: false,
															animate: true,
															listeners: {
																click: function(node, e) {
																	biblios.app.displaySaveView();
																}
															}, // save folder listeners
															loader: new Ext.ux.GearsTreeLoader({
																db: db,
																selectSql: 'select Savefiles.rowid, name, parentid, description, icon, allowDelete, allowAdd, allowDrag, allowDrop, ddGroup from Savefiles where parentid is null',
																applyLoader: false,
																processData: function(data) {
																	var json = '[';
																	for( var i = 0; i < data.length; i++) {
																		if( i > 0 ) {
																			json += ',';
																		}
																		json += '{';
																		json += '"id":"'+data[i][0]+'",';
																		json += '"text":"'+data[i][1]+'",';
																		json += '"savefileid":"'+data[i][0]+'",';
																		json += '"parentid":"'+data[i][2]+'",';
																		json += '"qtip":"'+data[i][3]+'",';
																		json += '"icon":"'+data[i][4]+'",';
																		json += '"leaf":false'+',';
																		json += '"allowDelete":"'+data[i][5]+'",';
																		json += '"allowAdd":"'+data[i][6]+'",';
																		json += '"allowDrag":"'+data[i][7]+'",';
																		json += '"allowDrop":"'+data[i][8]+'",';
																		json += '"ddGroup":"'+data[i][9]+'"';
																		json += '}';
																	}
																	json += ']';
																	return json;
																}, // processData for savefile root nodes
																baseAttrs: {
																	listeners: {
																		click: function(node, e) {
																			UI.currSaveFile = node.attributes.id;
																			UI.currSaveFileName = node.text;
																			biblios.app.displaySaveFile( node.attributes.id );
																			biblios.app.displaySaveView();
																		}
																	}, // save folder listeners
																	loader: new Ext.ux.GearsTreeLoader({
																		db: db,
																		selectSql: 'select Savefiles.rowid, name, parentid, description, icon, allowDelete, allowAdd, allowDrag, allowDrop, allowRename, ddGroup from Savefiles ',
																		whereClause: ' where parentid = ?',
																		processData: function(data) {
																			var json = '[';
																			for( var i = 0; i < data.length; i++) {
																				if( i > 0 ) {
																					json += ',';
																				}
																				json += '{';
																				json += '"id":"'+data[i][0]+'",';
																				json += '"text":"'+data[i][1]+'",';
																				json += '"savefileid":"'+data[i][0]+'",';
																				json += '"parentid":"'+data[i][2]+'",';
																				json += '"qtip":"'+data[i][3]+'",';
																				json += '"icon":"'+data[i][4]+'",';
																				json += '"leaf":false'+',';
																				json += '"allowDelete":"'+data[i][5]+'",';
																				json += '"allowAdd":"'+data[i][6]+'",';
																				json += '"allowDrag":"'+data[i][7]+'",';
																				json += '"allowDrop":"'+data[i][8]+'",';
																				json += '"allowRename":"'+data[i][9]+'",';
																				json += '"ddGroup":"'+data[i][10]+'"';
																				json += '}';
																			}
																			json += ']';
																			return json;
																		}, // processData for savefiles 
																	}) // gears loader for subsequent savefile nodes
																	
																} // baseAttrs for savefile children nodes
															}) // savefiles root gears loader
														}),
														listeners: {
															beforenodedrop: function(e) {
																var droppedsavefileid = e.target.attributes.savefileid;
																if( e.data.selections) {
																	doSaveLocal(droppedsavefileid, '', 0);
																}
																// we have a record from a location in search grid
																else {
																	var offset = e.source.id.substr(3); // "loc"+offset
																	var id = Ext.getCmp('searchgrid').getSelections()[0].id;
																	doSaveLocal(droppedsavefileid, '', offset);
																}
															}, // savefolders beforenodedrop
															contextmenu: function(node, e) {
																var Menu = new Ext.menu.Menu({
																	id:'menu',
																	listeners: {
																		click: function(menu, menuItem, e) {
																			menu.hide();
																		}
																	}, // save folder context menu listeners
																	items: [{
																			id:'removeNode',
																			handler:function() {
																				var n = Ext.getCmp('FoldersTreePanel').getSelectionModel().getSelectedNode();
																				if(n && n.attributes.allowDelete) {
																						// do we really want to do this???
																						Ext.MessageBox.confirm("Delete", "Really delete this folder and all records in it?", 
																							function(btn, text) {
																							if( btn == 'yes' ) {
																								var id = n.attributes.savefileid;
																								Ext.getCmp('FoldersTreePanel').getSelectionModel().selectPrevious();
																								n.parentNode.removeChild(n);
																								// update db
																								try {
																									DB.Savefiles.select('rowid = ?', [id]).getOne().remove();
																									return true;
																									// update our hash of savefile id/names
																									getSaveFileNames();
																									updateSaveMenu();
																								}
																								catch(ex) {
																									Ext.MessageBox.alert("Database error", ex.message);
																									return false;
																								}
																								return true;
																							}
																							else {
																								return false;   
																							}
																						} // on user confirmation of delete
																					);
																				}
																			}, // remove handler
																			cls:'remove',
																			text: 'Delete folder'
																	},
																	{
																	id: 'addNode',
																	handler: function() {
																		var n = Ext.getCmp('FoldersTreePanel').getSelectionModel().getSelectedNode();
																		if((n.attributes.allowAdd == true)) {
																			// update db with new save file and get its id so we can pass it to TreeNode config
																			var parentid;
																			parentid = n.attributes.savefileid;
																			if( parentid == 'null') {
																				parentid = null;
																			}
																			try {
																				var savefile = new DB.Savefiles({
																					name: "New Folder",
																					description: '',
																					parentid: parentid,
																					allowDelete: 1,
																					allowAdd: 1,
																					allowRename: 1,
																					allowDrag: 1,
																					allowDrop: 1,
																					ddGroup: 'RecordDrop',
																					icon: libPath + 'ui/images/drive-harddisk.png',
																					date_added: '',
																					date_modified: ''
																				}).save();
																			}
																			catch(ex) {
																				Ext.MessageBox.alert("Database error", ex.message);
																			}
																			try {
																				id = DB.Savefiles.count();
																			}
																			catch(ex) {
																				  Ext.MessageBox.alert("Database error", ex.message);
																			}
																			var newnode = new Ext.tree.TreeNode(
																			{
																				text: 'New Folder', 
																				savefileid: id, 
																				id: id,
																				qtip:'', 
																				icon: libPath + 'ui/images/drive-harddisk.png',
																				leaf: false, 
																				allowDelete:true, 
																				allowAdd: true,
																				allowRename: true,
																				allowEdit: true,
																				allowDrag:true, 
																				allowDrop:true, 
																				ddGroup:'SaveFileNodeDrop',
																				listeners: {
																					click: function(node, e) {
																						UI.currSaveFile = node.attributes.id;
																						UI.currSaveFileName = node.text;
																						biblios.app.displaySaveFile( node.attributes.id );
																						biblios.app.displaySaveView();
																					}
																				} // save folder listeners
																			});
																			n.appendChild(newnode);
																			n.expand();
																			newnode.on('click', function(n) {
																				displaySaveView();
																				Ext.getCmp('FoldersTreePanel').getSelectionModel().select(n); // displaySaveView selects root save so select the node user clicked
																				showStatusMsg('Displaying ' + n.attributes.id);
																				displaySaveFile(n.attributes.savefileid, n.text); 
																				clearStatusMsg();
																			});
																			Ext.getCmp('FoldersTreePanel').getSelectionModel().select(newnode);
																			treeEditor.editNode = newnode;
																			treeEditor.startEdit(newnode.ui.textNode);
																	} // if this node allows us to add to it
																	}, // addnode handler
																	cls: 'add',
																	text: 'Add folder' 
																	},
																	{
																	id: 'renameNode',
																	handler: function() {
																		var n = Ext.getCmp('FoldersTreePanel').getSelectionModel().getSelectedNode();
																		if((n.attributes.allowRename == true)){
																			treeEditor.editNode = n;
																			treeEditor.startEdit(n.ui.textNode);
																		}
																		else {
																			return false;
																		}
																	}, // rename node handler
																	cls: 'rename',
																	text: 'Rename folder' 
																	},
																	]
																});
																this.getSelectionModel().select(node); // displaySaveView selects root save so select the node user clicked
																Menu.showAt(e.getXY());
															} // save folder tree context menu
														},
													}), // resources treepanel with treeeditor applied
													new Ext.tree.TreePanel({
														id: 'editorsTreePanel',
														leaf: false,
														animate: true,
														expanded: true,
														ddGroup: 'RecordDrop',
														enableDD: true,
														rootVisible: true,
														lines: false,
														listeners: {
															click: function(node, e) {
																biblios.app.displayRecordView();
															},
															beforenodedrop: function(e) {
																// if we have a grid row
																var editorid = e.target.attributes.editorid;
																if( e.data.grid ) {
																	var sel = e.data.selections;
																	if( e.data.selections.length > 1 ) {
																		Ext.MessageBox('Error', 'Please drag only 1 record to an editor');
																		return false;
																	}
																	var gridid = e.data.grid.id;
																	var id = e.data.grid.store.data.get(e.data.rowIndex).data.Id;
																	if( gridid == 'savegrid') {
																		showStatusMsg('Opening record...');
																		var xml = getLocalXml(id);
																		UI.editor[editorid].id = id;
																		openRecord( xml, editorid);
																	} // record from save grid
																	else if( gridid == 'searchgrid' ) {
																		// FIXME
																		var id = Ext.getCmp('searchgrid').getSelections()[0].id;
																		UI.editor[editorid].id = id;
																		var loc = Ext.getCmp('searchgrid').getSelections()[0].data.location;
																		if( loc.length > 1 ) {
																			Ext.Msg.alert('Error', 'This record is available at more than one location.  Please select a location by clicking the expander button next to this record in the grid and dragging it to editor one or two.');
																			return false;
																		}
																		getRemoteRecord(id, loc, 0, function(data) { 
																			openRecord( xslTransform.serialize(data), editorid ) 
																		});
																	} // record from search grid
																} // if we have a grid row
																// we have a location from search grid
																else {
																	var id = Ext.getCmp('searchgrid').getSelections()[0].id;
																	UI.editor[editorid].id = id;
																	var offset = e.source.id.substr(3); // "loc"+offset
																	var loc = Ext.getCmp('searchgrid').getSelections()[0].data.location[offset];
																	var record = Ext.getCmp('searchgrid').getSelections()[0];
																	getRemoteRecord(id, loc.name, offset, function(data) { 
																		openRecord( xslTransform.serialize(data), editorid ) 
																	});


																} // if we have a location from the search grid

															} // before node drop for editors 
														}, // save folder listeners
														root: new Ext.tree.AsyncTreeNode({
															text: 'Editors',
															leaf: false,
															ddGroup: 'RecordDrop',
															enableDD: true,
															loader: new Ext.tree.TreeLoader({}),
															children: [
																{
																	text: 'Editor One',
																	id: 'editoroneNode',
																	editorid: 'editorone',
																	leaf: false,
																	allowDrop: true,
																	enableDD: true,
																	ddGroup: 'RecordDrop',
																	listeners: {
																		click: function(node, e) {
																			biblios.app.displayRecordView();
																			Ext.getCmp('editortwo').collapse();
																		} // editor click listener

																	} // editor one listeners
																},
																{	
																	text: 'Editor two',
																	id: 'editortwoNode',
																	editorid: 'editortwo',
																	leaf: false,
																	allowDrop: true,
																	ddGroup: 'RecordDrop',
																	enableDD: true,
																	listeners: {
																		click: function(node, e) {
																			biblios.app.displayRecordView();
																			Ext.getCmp('editortwo').expand();
																		} // editor click listener
																	}
																}
															] // editors children
														})
													}) // editors treepanel
												] // tree panel items
											} // center region of sidebar
										] // resources panel items
									},// biblio tab west
									{
										region: 'east',
										split: true,
										collapsible: true,
										collapsed: true,
										width: 200,
										maxSize: 200,
										title: 'Help'

									}  // biblio tab east
								] // biblio tab items
							}, // biblio tab config
							{
								title: 'Options',
								closable: false,
								autoScroll: true,
								layout: 'border',
								id: 'optionstab',
								items: [
									new Ext.TabPanel({
										region: 'center',
										items: [
											{
												title: 'Setup'

											}, // setup tab
											{
												title: 'Macros',
												html: 'Coming soon'
											}, // macros
											{
												title: 'Plugins',
												html: 'Coming soon'
											},
											{
												title: 'Search Targets',
												layout: 'border',
												listeners: {
													activate: function(tab) {
														Ext.getCmp('searchtargetsgrid').store.load({db: db, selectSql: biblios.app.db.selectSqlSearchTargets});
														biblios.app.viewport.doLayout();
													} // activate search targets grid tab

												}, // search targets grid tab listeners
												items:
													{
														region: 'center',
														height: 600,
														id: 'searchtargetsgridpanel',
														items: [
															new Ext.grid.EditorGridPanel({
																id: 'searchtargetsgrid',
																height: 600,
																ds: new Ext.data.Store({
																	proxy: new Ext.data.GoogleGearsProxy(new Array()),
																	reader: new Ext.data.ArrayReader({
																		record: 'name'
																	}, SearchTarget),
																	remoteSort: false,
																	sortInfo: {
																		field: 'name',
																		direction: 'ASC'
																	},
																	listeners: {
																		update: function(store, record, operation) {
																			record.enabled = record.enabled ? 1 : 0;
																			if( operation == Ext.data.Record.COMMIT || operation == Ext.data.Record.EDIT) {
																				try {
																					var rs = db.execute('update SearchTargets set name = ?, hostname = ?, port = ?, dbname = ?, description = ?, userid = ?, password = ?, enabled = ? where rowid = ?', [record.data.name, record.data.hostname, record.data.port, record.data.dbname, record.data.description, record.data.userid, record.data.password, record.data.enabled, record.data.rowid]);
																					rs.close()
																				}
																				catch(ex) {
																					Ext.MessageBox.alert('Error', ex.message);
																				}
																			}
																			Ext.getCmp('TargetsTreePanel').root.reload();
																		} // search targets store update
																	} // search targets grid store listeners
																}),
																listeners: {
																	afteredit: function(e) {
																		var id = e.record.data.id;
																		var field = e.field;
																		var value = e.value;
																		if( typeof(value) == 'boolean' ) {
																			if( value == true ) {
																				value = 1;
																			}
																			else if( value == false ) {
																				value = 0;
																			}
																		}
																		var rs;
																		try {
																			rs = db.execute('update SearchTargets set '+field+' = ? where rowid = ?', [value, id]);
																			rs.close();
																		}
																		catch(ex) {
																			Ext.MessageBox.alert('Error', ex.message);
																		}

																	} // after edit event on search target grid
																}, // search target grid listeners
																sm: new Ext.grid.RowSelectionModel({

																}),
																cm: new Ext.grid.ColumnModel([
																	{
																		header: 'Name', 
																		dataIndex: 'name', 
																		sortable: true,
																		editor: new Ext.grid.GridEditor(new Ext.form.TextField())
																	},
																	{	
																		header: 'Host', 
																		dataIndex: 'hostname', 
																		editor: new Ext.grid.GridEditor(new Ext.form.TextField())
																	},
																	{
																		header: 'Port', 
																		dataIndex: 'port', 
																		editor: new Ext.grid.GridEditor(new Ext.form.TextField())
																	},
																	{
																		header: 'Database', 
																		dataIndex: 'dbname', 
																		editor: new Ext.grid.GridEditor(new Ext.form.TextField())
																	},
																	{
																		header: 'Description', 
																		dataIndex: 'description', 
																		editor: new Ext.grid.GridEditor(new Ext.form.TextField())
																	},
																	{
																		header: 'User', 
																		dataIndex: 'userid', 
																		editor: new Ext.grid.GridEditor(new Ext.form.TextField())
																	},
																	{
																		header: 'Password', 
																		dataIndex: 'password', 
																		editor: new Ext.grid.GridEditor(new Ext.form.TextField())
																	},
																	{
																		header: 'Syntax',
																		dataIndex: 'syntax',
																		editor: new Ext.grid.GridEditor(new Ext.form.TextField())
																	},
																	{
																		header: 'Enabled', 
																		dataIndex: 'enabled', 
																		renderer: function formatBoolean(value) {
																			return value ? 'Yes' : 'No';
																		},
																		editor: new Ext.grid.GridEditor(new Ext.form.Checkbox())
																	}
																]),
																tbar: [
																	{
																		text: 'Add Target',
																		handler: function() {
																			// insert new target into db so we get it's id
																			var rs;
																			try {
																				rs = db.execute('insert into SearchTargets (name) values ("")');
																				rs.close();
																			}
																			catch(ex) {
																				Ext.MessageBox.alert('Error', ex.message);
																			}
																			var t = new SearchTarget({
																				id: db.lastInsertRowId,
																				name: '',
																				hostname: '',
																				port: '',
																				dbname: '',
																				description: '',
																				userid: '',
																				password: '',
																				enabled: 0
																			});
																			var grid = Ext.getCmp('searchtargetsgrid');
																			grid.stopEditing();
																			grid.store.insert(0, t);
																			grid.startEditing(0, 0);
																		}
																	},
																	{
																		text: 'Remove Target',
																		handler: function() {
																			var records = Ext.getCmp('searchtargetsgrid').getSelectionModel().getSelections();
																			for( var i = 0; i < records.length; i++) {
																				try {
																					DB.SearchTargets.select('SearchTargets.rowid=?', [records[i].data.rowid]).getOne().remove();
																				}
																				catch(ex) {
																					Ext.MessageBox.alert('Error', ex.message);
																				}
																			Ext.ComponentMgr.get('searchtargetsgrid').store.reload();
																			} // process search targets records to remove
																			//updateSearchTargets();
																			Ext.getCmp('searchtargetsgrid').store.reload();
																		}
																	}
																]
															}) // search targets grid

														] // center search target tab region

													} // search targets tab items
											}, // search targets tab
											{
												title: 'Send Targets',
												layout: 'border',
												listeners: {
													activate: function(tab) {
														Ext.getCmp('sendtargetsgrid').store.load({db: db, selectSql: biblios.app.db.selectSqlSendTargets});
														biblios.app.viewport.doLayout();
													} // activate search targets grid tab
												}, // send targets listeners
												items: 
													{
														region: 'center',
														height: 300,
														id: 'sendtargetsgridpanel',
														items: [
															new Ext.grid.EditorGridPanel({
																id: 'sendtargetsgrid',
																height: 300,
																ds: new Ext.data.Store({
																	proxy: new Ext.data.GoogleGearsProxy(new Array()),
																	reader: new Ext.data.ArrayReader({
																		record: 'name'
																	}, SendTarget),
																	remoteSort: false,
																	sortInfo: {
																		field: 'name',
																		direction: 'ASC'
																	},
																listeners: {
																	update: function(store, record, operation) {
																		record.enabled = record.enabled ? 1 : 0;
																		if( operation == Ext.data.Record.COMMIT || operation == Ext.data.Record.EDIT ) {
																			try {
																				var rs = db.execute('update SendTargets set name = ?, location = ?, user= ?, password = ?, pluginlocation = ?, plugininit= ?, enabled = ? where rowid = ?', [record.data.name, record.data.location, record.data.user, record.data.password, record.data.pluginlocation, record.data.pluginit, record.data.enabled, record.data.rowid]);
																				rs.close()
																			}
																			catch(ex) {
																				Ext.MessageBox.alert('Error', ex.message);
																			}
																		}
																	}
																} // send target grid store listeners
																}), // send target grid data store
																listeners: {
																	afteredit: function(e) {
																		var id = e.record.data.rowid;
																		var field = e.field;
																		var value = e.value;
																		if( typeof(value) == 'boolean' ) {
																			if( value == true ) {
																				value = 1;
																			}
																			else if( value == false ) {
																				value = 0;
																			}
																		}
																		var rs;
																		try {
																			rs = db.execute('update SendTargets set '+field+' = ? where rowid = ?', [value, id]);
																			rs.close();
																		}
																		catch(ex) {
																			Ext.MessageBox.alert('Error', ex.message);
																		}
																		e.grid.store.load({db: db, selectSql: 'select SendTargets.rowid as rowid, name, location, url, user, password, pluginlocation, plugininit, enabled from SendTargets'});
																	} // afteredit handler
																},
																sm: new Ext.grid.RowSelectionModel({

																}),
																cm: new Ext.grid.ColumnModel([
																	{
																		header: 'Name', 
																		dataIndex: 'name', 
																		sortable: true,
																		editor: new Ext.form.TextField()
																	},
																	{	
																		header: 'Location Name', 
																		dataIndex: 'location', 
																		editor: new Ext.form.TextField()
																	},
																	{
																		header: 'Url', 
																		dataIndex: 'url', 
																		editor: new Ext.form.TextField()
																	},
																	{
																		header: 'User', 
																		dataIndex: 'user', 
																		editor: new Ext.form.TextField()
																	},
																	{
																		header: 'Password', 
																		dataIndex: 'password', 
																		editor: new Ext.form.TextField()
																	},
																	{
																		header: 'Plugin Location',
																		dataIndex: 'pluginlocation',
																		editor: new Ext.form.TextField()
																	},
																	{
																		header: 'Plugin Init',
																		dataIndex: 'plugininit',
																		editor: new Ext.form.TextField()
																	},
																	{
																		header: 'Enabled', 
																		dataIndex: 'enabled', 
																		renderer: function (value) {
																			return value ? 'Yes' : 'No';
																		},
																		editor: new Ext.form.Checkbox()
																	}
																]), // send target column model
																tbar: [
																	{
																		text: 'Add Send Target',
																		handler: function() {
																			// insert new target into db so we get it's id
																			var rs;
																			try {
																				rs = db.execute('insert into SendTargets (name) values ("")');
																				rs.close();
																			}
																			catch(ex) {
																				Ext.MessageBox.alert('Error', ex.message);
																			}
																			var t = new SendTarget({
																				id: db.lastInsertRowId,
																				name: '',
																				location: '',
																				url: '',
																				user: '',
																				password: '',
																				pluginlocation: '',
																				plugininit: '',
																				enabled: 0
																			});
																			var sendtargetgrid = Ext.ComponentMgr.get('sendtargetsgrid');
																			var ds = sendtargetgrid.store;
																			sendtargetgrid.stopEditing();
																			ds.insert(0, t);
																			sendtargetgrid.startEditing(0, 0);
																		}
																	}, // sendtarget add target tb button
																	{
																		text: 'Remove Target',
																		handler: function() {
																			var records = Ext.ComponentMgr.get('sendtargetsgrid').getSelectionModel().getSelections();
																			for( var i = 0; i < records.length; i++) {
																				try {
																					DB.SendTargets.select('SendTargets.rowid=?', [records[i].data.rowid]).getOne().remove();
																				}
																				catch(ex) {
																					Ext.MessageBox.alert('Error', ex.message);
																				}
																			}
																			Ext.ComponentMgr.get('sendtargetsgrid').store.reload();
																		}
																	} // send grid remove target tb button
																] // send target grid toolbar
															}) // sendtarget editorgridpanel constructor
														] // send targets tab items
													} // send targets tab center region
											}, // send targets tab
											{
												title: 'Keyboard Shortcuts'
											}
										] // options inner tab panel
									}) // Options tabpanel constructor
								] // options tab items
							} // options tab config
						] // center items of tabpanel
					}) // tabpanel constructor
				] // viewport items
			}); // viewport constructor
			
		var form = new Ext.form.BasicForm('searchform');
		getSaveFileNames(); // set up hash of save file id->names
		openState = 'searchgrid';
		treeEditor = new Ext.tree.TreeEditor( Ext.getCmp('FoldersTreePanel'), {
			cancelOnEsc: true,
			completeOnEnter: true,
			id: 'saveTreeEditor',
			listeners: {
				beforecomplete: function(editor, value, startValue) {
					var n = Ext.getCmp('FoldersTreePanel').getSelectionModel().getSelected();
					var folder = DB.SaveFiles.select('Savefiles.rowid=?', [n.attributes.id]).getOne();
					folder.name = value;
					folder.save();
					//updateSaveMenu();
				}
			}
		});
		treeEditor.render();
		alert('Application successfully initialized');
        }
    };
}(); // end of app
 
