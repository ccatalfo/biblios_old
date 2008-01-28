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
	doSaveLocal = function doSaveLocal(savefileid) {
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
			var ff_ed = $("#fixedfields_editor");
			var var_ed = UI.editor.editorDoc;
			// transform edited record back into marcxml
			xml = UI.editor.record.XMLString();
			progress.updateProgress(.5, 'Extracing marcxml');
			var recid = UI.editor.id;
			// if we don't have a record id, add this record to the db first
			if( recid == '' ) {
				if(debug == 1 ) { console.info( "doSaveLocal: no recid so record must be from search results.  Retrieving data from searchgrid."); }
				var data = Ext.getCmp('searchgrid').getSelections()[0].data;
				var id = Ext.getCmp('searchgrid').getSelections()[0].id;
				progress.updateProgress(.6, 'Retrieving record from server');
				recid = addRecordFromSearch(id, data, savefileid);
				if(debug == 1 ) { console.info( "Saving record with id: " + recid + " and content: " + xml); }
			}
			else { // recid isn't empty so we've already saved this record, just update it
				try {
					var record = DB.Records.select('Records.rowid = ?', [recid]).getOne();
					if( record.marcflavour == 'marc21' ) {
						record.title = UI.editor.record.getValue('245', 'a');
						record.author = UI.editor.record.getValue('100', 'a');
						record.publisher = UI.editor.record.getValue('260', 'b');
						record.dateofpub = UI.editor.record.getValue('260', 'c');
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
		else if( openState == 'searchgrid' ) {
			var grid = Ext.getCmp( 'searchgrid' );
			var ds = grid.store;
			var sel = grid.getSelectionModel().getSelections();
			for( var i = 0; i < sel.length; i++) {
				var id = sel[i].id;
				var data = sel[i].data;
				addRecordFromSearch(id, data, savefileid);
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

        // public methods
		displaySearchView : function() {
			displaySearchView();
		},
		displaySaveView : function() {
			displaySaveView();
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
																new Ext.data.XmlReader({
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
																	{name: 'location', mapping:'location @name'}
																	])),
																	remoteSort: false
														})), // data store search grid aka ds
														sm: new Ext.grid.RowSelectionModel({
															listeners: {
																rowselect: function(selmodel, rowindex, record) {
																	var id = record.id;
																	// get the marcxml for this record and send to preview()
																	var marcxml = '';
																	var xml = getPazRecord(
																		id,
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
																} // search grid row select handler
															} // selection listeners
														}), // search grid selecion model
														cm : new Ext.grid.ColumnModel([
															{header: "Medium", width: 50, dataIndex: 'medium'},
															{header: "Title", width: 180, dataIndex: 'title'},
															{header: "Author", width: 120, dataIndex: 'title-responsibility'},
															{header: "Publisher", width: 120, dataIndex: 'publication'},
															{header: "Date", width: 50, dataIndex: 'date'},
															{header: "Location", width: 100, dataIndex: 'location'}
														]), // column model for search grid
														listeners: {
															rowclick: function(grid, rowindex, e) {

															},
															rowdblclick: function(grid, rowindex, e) {
																var id = grid.getSelections()[0].id;
																var loc = grid.getSelections()[0].data.location;
																getRemoteRecord(id, loc, function(data) { openRecord( xslTransform.serialize(data), 'editorone' ) }
														);

															},
															keypress: function(e) {
															  if( e.getKey() == Ext.EventObject.ENTER ) {
																var id = Ext.getCmp('searchgrid').getSelections()[0].id;
																var loc = Ext.getCmp('searchgrid').getSelections()[0].data.location;
																  getRemoteRecord(id, loc, function(data) { openRecord( xslTransform.serialize( data), 'editorone' ) });
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
																	handler: doNewRecord
																},
																{
																		cls: 'x-btn-text-icon',
																		icon: libPath + 'ui/images/document-open.png',
																		text: 'Edit',
																		disabled: false, // start disabled.  enable if there are records in the datastore (searchsaveds)
																		handler: function() {
																				showStatusMsg('Opening record...');
																			// see which grid is visible at the moment and get selected record from it
																			if( openState == 'searchgrid' ) {
																				var id = Ext.getCmp('searchgrid').getSelections()[0].id;
																				var loc = Ext.getCmp('searchgrid').getSelections()[0].data.location;
																				getRemoteRecord(id, loc, function(data) { openRecord( xslTransform.serialize(data, 'editorone') ) });
																			}
																			else if( openState == 'savegrid' ) {
																				var id = Ext.getCmp('savegrid').getSelections()[0].data.Id;
																				var xml = getLocalXml(id);
																				UI.editor.id = id;
																				openRecord(  xml, 'editorone' );
																			}
																		//	clearStatusMsg();
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
														}) // search grid paging toolbar
													}), // search results grid panel
													{
														region: 'south',
														id: 'searchpreview',
														title: 'Preview',
														split: true,
														collapsible: true,
														html: 'search preview<div id="searchselect"></div><div id="searchprevrecord"></div>',
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
														region: 'north',
														id: 'editorone',
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
																	id: 'saveMenu',
																	items: getSaveFileMenuItems()
																}
															},
															{
																cls: 'x-btn-text-icon bmenu', // icon and text class
																icon: libPath + 'ui/images/document-save.png',
																text: 'Send',
																menu: {
																	id: 'sendMenu',
																	items: getSendFileMenuItems()
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
															},
															{
																cls: 'x-btn-text-icon', // icon and text class
																icon: libPath + 'ui/images/process-stop.png',
																text: 'Cancel',
																handler: function() {
																	showStatusMsg('Cancelling record...');
																	if( openState  == 'savegrid' ) {
																		biblios.app.displaySaveView();
																	}
																	else if( openState  == 'searchgrid' ) {
																		biblios.app.displaySearchView();
																	}
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
													}, // editor north
													{
														region: 'center',
														id: 'editortwo',
														autoScroll: true,
														split: true,
														html: '<div class="ffeditor"></div><div class="vareditor"></div>',
														height: 50,
														tbar: editorToolbar
													} // editor center
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
																rowclick: function(grid, rowIndex, e) {

																},
																rowdblclick: function(grid, rowIndex, e) {
																	var id = grid.store.data.get(rowIndex).data.Id;
																	UI.editor.id = id;
																	showStatusMsg('Opening record...');
																	var xml = getLocalXml(id);
																	openRecord( xml, 'editorone');
																},// save grid row dbl click handler
																keypress: function(e) {
																	if( e.getKey() == Ext.EventObject.ENTER ) {
																		var sel = Ext.getCmp('savegrid').getSelectionModel().getSelected();
																		var id = sel.data.Id;
																		UI.editor.id = id;
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
																	handler: doNewRecord
																},
																{
																		cls: 'x-btn-text-icon',
																		icon: libPath + 'ui/images/document-open.png',
																		text: 'Edit',
																		disabled: false, // start disabled.  enable if there are records in the datastore (searchsaveds)
																		handler: function() {
																				showStatusMsg('Opening record...');
																			// see which grid is visible at the moment and get selected record from it
																			if( openState == 'searchgrid' ) {
																				var id = Ext.getCmp('searchgrid').getSelections()[0].id;
																				var loc = Ext.getCmp('searchgrid').getSelections()[0].data.location;
																				getRemoteRecord(id, loc, function(data) { openRecord( xslTransform.serialize(data, 'editorone') ) });
																			}
																			else if( openState == 'savegrid' ) {
																				var id = Ext.getCmp('savegrid').getSelections()[0].data.Id;
																				var xml = getLocalXml(id);
																				UI.editor.id = id;
																				openRecord(  xml, 'editorone' );
																			}
																		//	clearStatusMsg();
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
																] // save grid toolbar items
															}) // save grid paging toolbar
													}), // savepanel center
													{ 													
														region: 'south',
														id: 'savepreview',
														title: 'Preview',
														split: true,
														collapsible: true,
														height: 150,
														html: '<p>save preview</p><div id="select"></div><div id="saveprevrecord"></div>',
													} // savepanel south
												] // savepanel items
											} // savefilegrid region 
										] // biblio tab center items
									}, // biblio tab center
									{
										region: 'west',
										split: true,
										collapsible: true,
										collapsed: true,
										width: 200,
										maxSize: 200,
										title: 'Resources',
										layout: 'border',
										items: [
												new Ext.tree.TreePanel({
													id: 'resourcesTree',
													region: 'center',
													animate: true,
													expanded: true,
													enableDD: true,
													ddGroup: 'RecordDrop',
													rootVisible: false,
													lines: false,
													root: createFolderList(), // create root and all children
													listeners: {
														beforenodedrop: function(e) {
															var sel = e.data.selections;
															var droppedsavefileid = e.target.attributes.savefileid;
															doSaveLocal(droppedsavefileid);


														} // beforenodedrop
													},
												}) // resources treepanel with treeeditor applied
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
							} // biblio tab config
						] // center items of tabpanel
					}) // tabpanel constructor
				] // viewport items
			}); // viewport constructor
			
		var form = new Ext.form.BasicForm('searchform');
		getSaveFileNames(); // set up hash of save file id->names

		alert('Application successfully initialized');
        }
    };
}(); // end of app
 
