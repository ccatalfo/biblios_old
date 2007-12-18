var UI = {};
UI.search = {};
UI.search.remoteILS = {};
UI.searchpreview = {};
UI.searchpreview.id = '';
UI.searchpreview.xml = '';
UI.savepreview = {};
UI.savepreview.id = '';
UI.savepreview.xml = '';
UI.editor = {};
UI.editor.id = '';
UI.editor.doc = null;
UI.editor.location = '';
UI.editor.savedRemote = {};
UI.editor.savefileid = '';
UI.editor.xml = '';
UI.editor.lastFocusedEl = '';
UI.editor.record = '';
UI.editor.comboboxes = new Array();
UI.search = {};
UI.search.currQuery = '';
UI.search.limitby = {};
UI.save = {};
UI.save.savefile = {};
UI.savefilesql = 'SELECT Records.rowid as Id, Records.title as Title, Records.author as Author, Records.date as DateOfPub, Records.location as Location, Records.publisher as Publisher, Records.medium as Medium, Records.xml as xml, Records.status as Status, Records.date_added as DateAdded, Records.date_modified as DateModified, Records.xmlformat as xmlformat, Records.marcflavour as marcflavour, Records.template as template, Records.marcformat as marcformat, Records.Savefiles_id as Savefiles_id, Records.SearchTargets_id as SearchTargets_id FROM Records';
UI.currSaveFile = '';
UI.currSaveFileName = '';
UI.lastWindowOpen = '';
UI.lastSearchPreviewed = '';
UI.lastSavePreview = '';
UI.keymaps = {};
// layouts
UI.optionsLayout = {};

var newButton = new Ext.Toolbar.Button ({
        id: 'newrecordbutton',
        icon: 'ui/images/document-new.png',
        cls: 'x-btn-text-icon bmenu',
        text: 'New',
        handler: doNewRecord
});
var refreshButton = new Ext.Toolbar.Button({
        cls: 'x-btn-text-icon bmenu',
        text: 'Refresh',
        icon: 'ui/images/view-refresh.png',
        handler: function() {
            // see which grid is visible at the moment and get reload data in it 
            if( Ext.get('searchgrid').isVisible() ) {
                searchgrid.getDataSource().load();
            }
            else if( Ext.get('savegrid').isVisible() ) {
                savefilegrid.getDataSource().load();
            }
        },
        disabled: true
    });
var moveButton = new Ext.Toolbar.Button({
        cls: 'x-btn-text-icon',
        icon: 'ui/images/emblem-symbolic-link.png',
        text: 'Move',
        handler: function() {},
        disabled: true
    });
var printButton = new Ext.Toolbar.Button({
        cls: 'x-btn-text-icon',
        icon: 'ui/images/document-print.png',
        text: 'Print',
        handler: function() {},
        disabled: true
    });
    
var editButton = new Ext.Toolbar.Button({
        cls: 'x-btn-text-icon',
        icon: 'ui/images/document-open.png',
        text: 'Edit',
        disabled: false, // start disabled.  enable if there are records in the datastore (searchsaveds)
        handler: function() {
				showStatusMsg('Opening record...');
            // see which grid is visible at the moment and get selected record from it
            if( Ext.get('searchgrid').isVisible() ) {
				var id = searchgrid.getSelections()[0].id;
				var loc = searchgrid.getSelections()[0].data.location;
				getRemoteRecord(id, loc, function(data) { openRecord( xslTransform.serialize( data.xmlDoc ) ) });
            }
            else if( Ext.get('savegrid').isVisible() ) {
                var id = savefilegrid.getSelections()[0].data.Id;
				var xml = getLocalXml(id);
                UI.editor.id = id;
                openRecord(  xml );
            }
			clearStatusMsg();
		}
    });
var exportButton = new Ext.Toolbar.Button({
    text: 'Export',
    disabled: false,
    cls: 'x-btn-text-icon',
    icon: 'ui/images/network-receive.png',
    handler: doDownloadRecords 
    
});
var emptyTrashButton = new Ext.Toolbar.Button({
    text: 'Empty Trash',
    disabled: false,
    cls: 'x-btn-text-icon',
    icon: 'ui/images/network-receive.png',
    handler: function() {
            if( Ext.get('searchgrid').isVisible() ) {
					showStatusMsg('Emptying trash...');
					doDeleteFromSaveFile( searchsavegrid.getSelections() );
					clearStatusMsg();
            }
            else if( Ext.get('savegrid').isVisible() ) {
					showStatusMsg('Emptying trash...');
               doDeleteFromSaveFile( savefilegrid.getSelections() );
					clearStatusMsg();
            }
    }
});

function createHomeTab() {
    hometab = tabs.addTab('hometab', 'Home');
    hometab.activate();
}

function createOptionsTab() {
	optionstab = tabs.addTab('optionstab', 'Options');
	optionstab.on('activate', function(tabpanel, item) {
		createTargetGrid();
	});
	var optionsLayout = new Ext.BorderLayout('optionstab', {
		id: 'optionsLayout',
		center: {
			titleBar: true,
			alwaysShowTabs: true,
			tabPosition: 'top'
		}
	});
	UI.optionsLayout = optionsLayout;
	optionsLayout.add('center', new Ext.ContentPanel('database_options', 'Database'));
	optionsLayout.add('center', new Ext.ContentPanel('macro_options', 'Macros'));
	optionsLayout.add('center', new Ext.ContentPanel('plugin_options', 'Plugins'));
	optionsLayout.add('center', new Ext.ContentPanel('target_options', 'Targets'));
	optionsLayout.add('center', new Ext.ContentPanel('keyboard_options', 'Keyboard Shortcuts'));
	optionsLayout.getRegion('center').showPanel('database_options');
	optionsLayout.getRegion('center').getPanel('target_options').on('activate',
		function(cp) {
			createTargetGrid();
	});
	// create database options 
	createDatabaseOptions();
}

function createTargetGrid() {
	var Target = Ext.data.Record.create([
		{name: 'rowid'},
		{name: 'name', type: 'string'},
		{name: 'hostname', type: 'string'},
		{name: 'port', type: 'string'},
		{name: 'dbname', type: 'string'},
		{name: 'description', type: 'string'},
		{name: 'userid', type: 'string'},
		{name: 'password', type: 'string',},
		{name: 'syntax', type: 'string',},
		{name: 'enabled', type: 'bool'}
	]);

	var ds = new Ext.data.Store({
		proxy: new Ext.data.GoogleGearsProxy(new Array()),
		reader: new Ext.data.ArrayReader({
			record: 'name'
		}, Target),
		remoteSort: false,
		sortInfo: {
			field: 'name',
			direction: 'ASC'
		}
	});
	ds.on('update', function(store, record, operation) {
		record.enabled = record.enabled ? 1 : 0;
		if( operation == Ext.data.Record.COMMIT ) {
			try {
				var rs = db.execute('update SearchTargets set name = ?, hostname = ?, port = ?, dbname = ?, description = ?, userid = ?, password = ?, enabled = ? where rowid = ?', [record.name, record.hostname, record.port, record.dbname, record.description, record.userid, record.password, record.enabled, record.rowid]);
				rs.close()
			}
			catch(ex) {
				Ext.MessageBox.alert('Error', ex.message);
			}
		}
	});

	function formatBoolean(value) {
		return value ? 'Yes' : 'No';
	}

	var cm = new Ext.grid.ColumnModel([
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
			renderer: formatBoolean,
			editor: new Ext.grid.GridEditor(new Ext.form.Checkbox())
		}
	]);
	cm.defaultSortable = true;

	var targetgrid = new Ext.grid.EditorGrid('targetgrid', {
		id: 'targetgrid',
		ds: ds,
		cm: cm,
		autoHeight: true,
		autoWidth: true,
		autoExpandColumn: 1
	});
	targetgrid.on('afteredit', function(e) {
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
		updateSearchTargets();
	});
	Ext.ComponentMgr.register(targetgrid);
	targetgrid.render();
	ds.load({db: db, selectSql: 'select SearchTargets.rowid as rowid, name, hostname, port, dbname, description, userid, password, syntax, enabled from SearchTargets'});

	var gridHeader = targetgrid.getView().getHeaderPanel(true);
	var tb = new Ext.Toolbar(gridHeader, [
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
				var t = new Target({
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
				var targetgrid = Ext.ComponentMgr.get('targetgrid');
				var ds = targetgrid.dataSource;
				targetgrid.stopEditing();
				ds.insert(0, t);
				targetgrid.startEditing(0, 0);
			}
		},
		{
			text: 'Remove Target',
			handler: function() {
				var record = Ext.ComponentMgr.get('targetgrid').getSelectionModel().selection.record;
				try {
					var rs = db.execute('delete from SearchTargets where SearchTargets.rowid = ?', [record.data.rowid]);
					rs.close();
				}
				catch(ex) {
					Ext.MessageBox.alert('Error', ex.message);
				}
				updateSearchTargets();
				Ext.ComponentMgr.get('targetgrid').dataSource.reload();
			}
		}
	]);
}

function createDatabaseOptions() {
	var dbform = new Ext.form.Form();
	dbform.addButton('Reset Database', function(btn) {
		GearsORMShift.migrateTo(0);
		GearsORMShift.migrateTo( GearsORMShift.latestVersion() );
		setPazPar2Targets(paz);
		updateSearchTargetFolders();
		Ext.MessageBox.alert('Preferences', 'Database reset');
	});
	dbform.addButton('Add Test Targets', function(btn) {
		createTestTargets();
		setPazPar2Targets(paz);
		updateSearchTargetFolders();
		Ext.MessageBox.alert('Preferences', 'Test targets added');
	});
	dbform.addButton('Remove Test Targets', function(btn) {
		removeTestTargets();
		setPazPar2Targets(paz);
		removeTargetFolder(1);
		removeTargetFolder(2);
		removeTargetFolder(3);
		removeTargetFolder(4);
		removeTargetFolder(5);
		Ext.MessageBox.alert('Preferences', 'Test targets removed');
	});
	dbform.addButton('Add Test Koha Plugin', function(btn) {
		setupKohaPlugin();
		setILSTargets();
		updateSendMenu();
		Ext.MessageBox.alert('Preferences', 'Test Koha plugin loaded');
	});
	dbform.render('dbform');
}

/*
   Function: createBiblioTab

   Creates the main ext.TabItem for bibliographic records.

   Parameters:

   None.

   Returns:

   None.

*/
function createBiblioTab()  {
    bibliotab = tabs.addTab('bibliotab', 'Bibliographic');
    layout = new Ext.BorderLayout('bibliotab', {
        west: {
		  titlebar: true,	
          split: true,
          initialSize: 200,
          collapsible: true,
          hidden: true,
			 autoScroll: true
        },
        center: {
          split: true,
          initialSize: 700,
          collapsible: true,
        }
        });
        folderlist_panel = new Ext.ContentPanel('folder-list', "Folders");
        layout.add('west', folderlist_panel);
      innerLayout = new Ext.BorderLayout('work-panel', {
        center: {
          initialSize: 600,
		  hideTabs: true,
		  preservePanels: true
          //autoScroll: true
        },
        south: {
			split:true,
			initialSize: 200,
			minSize: 100,
			maxSize: 400,
			autoScroll:true,
			collapsible:true,
			titlebar: true
        },
        east: {
          split: true,
          collapsible: true,
          initialSize: 250,
          autoScroll: true,
		  titlebar: true,
		  collapsed: true
        }
        });
		// create the search and save grids
		createSaveFileGrid();
		createSearchPazParGrid(paz.pz2String+"?command=show&session="+paz.sessionID);
		var searchgridpanel = new Ext.ContentPanel('searchgridpanel', {toolbar: searchgridpaging, resizeEl: 'searchgrid', fitToFrame: true, autoScroll: true});
		var savegridpanel = new Ext.ContentPanel('savegridpanel', {toolbar: savegridpaging, resizeEl: 'savegrid', fitToFrame: true, autoScroll: true});
		var marceditorpanel = new Ext.ContentPanel('marceditor', {toolbar: editor_toolbar, resizeEl: 'marccontent', fitToFrame: true, autoScroll: true});
		var homepanel = new Ext.ContentPanel('home-panel', {fitToFrame: true, autoScroll: true});
		innerLayout.add('center', searchgridpanel);
		innerLayout.add('center', savegridpanel);
		innerLayout.add('center', marceditorpanel);
		innerLayout.add('center', homepanel);
        search_preview_panel = new Ext.ContentPanel('search-preview-panel', {id: 'search-preview-panel', title: "Record Preview"});
        save_preview_panel = new Ext.ContentPanel('save-preview-panel', {id: 'save-preview-panel', title: "Record Preview"});
        innerLayout.add('south', search_preview_panel);
        innerLayout.add('south', save_preview_panel);
        right_panel =new Ext.ContentPanel('right-panel');
        innerLayout.add('east', right_panel);
        searchSaveNestedLayout = new Ext.NestedLayoutPanel(innerLayout);
        // add to main layout
        layout.add('center', searchSaveNestedLayout);
          
    createFolderList();

    // setup opening display
    layout.getRegion('west').show();
	// hide all panels for opening of app
	innerLayout.getRegion('center').hidePanel('searchgridpanel');
	innerLayout.getRegion('center').hidePanel('savegridpanel');
	innerLayout.getRegion('center').hidePanel('marceditor');
	innerLayout.getRegion('center').showPanel('home-panel');
}

/*
   Function: getNodeBySaveFileId

   Returnes the Ext.tree.TreeNode represenging the savefile id.

   Parameters:

   savefileid: the id in the database for the savefile whose node we're looking for

   Returns:

   ext.tree.TreeNode 

*/
function getNodeBySaveFileId(savefileid) {
    var wanted_node;
    // visit each node under savefiles root and find one w/ savefileid
    saveFilesRoot.cascade( function(n){
    if(n.attributes.savefileid == savefileid ) {
        wanted_node = n;
    }
    });
    return wanted_node;
}

/*
   Function: createSaveFileFolders

   Creates the TreeNodes for representing savefiles with the passed in parentid.

   Parameters:

   parentid: The parentid id whose children we want to create TreeNodes for.

   Returns:

   None.

*/
function createSaveFileFolders(parentid) {
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
			icon: 'ui/images/folder.png',
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
			UI.currSaveFile = n.attributes.savefileid;
			UI.currSaveFileName = n.text;
            displaySaveView();
            folderTree.getSelectionModel().select(n); // displaySaveView selects root save so select the node user clicked
            displaySaveFile(n.attributes.savefileid, n.text); 
			clearStatusMsg();
        });
        // setup dropnode for Trash
        if( name == 'Trash' ) {

        }
        createSaveFileFolders(savefile.rowid);
    }); 
	return saveFilesRoot;
}

/*
   Function: createFolderList

   Creates the ext.tree.TreePanel and TreeNodes for Searching and Saving servers.

   Parameters:

   None. 

   Returns:

   None.

*/
function createFolderList() {
    $("#folder-list").append("<div id='tree-wrapper'><div id='tree-div'/></div>");

    // tree for servers to search 
   folderTree = new Ext.tree.TreePanel('tree-div', {
    animate:true,
    enableDD:true,
    ddGroup: 'RecordDrop',
    containerScroll: true,
    lines:false,
    rootVisible:false
    });
    var sm = folderTree.getSelectionModel();
    treeEditor = new Ext.tree.TreeEditor(folderTree, {
    autosize:true
    });
    folderRoot = new Ext.tree.TreeNode({
        allowDrag:false,
        allowDrop:false,
        id:'folderRoot',
    });
	Ext.ComponentMgr.register(folderRoot);

    var savefilesRoot = createSaveFileFolders('null'); 
	var searchRoot = createTargetFolders();
	var facetsRoot = createFacetFolder();

	folderRoot.appendChild([searchRoot, facetsRoot, saveFilesRoot]);
	folderTree.setRootNode(folderRoot);
    folderTree.render();
    saveFilesRoot.expand();
    searchRoot.expand();

    // set up context menu and associate handlers
    var Menu = new Ext.menu.Menu({
        id:'menu',
        items: [{
                id:'removeNode',
                handler:removeNode,
                cls:'remove',
                text: 'Delete folder'
        },
        {
        id: 'addNode',
        handler: addNode,
        cls: 'add',
        text: 'Add folder' 
        },
        {
        id: 'renameNode',
        handler: renameNode,
        cls: 'rename',
        text: 'Rename folder' 
        },
        ]
    });

    folderTree.on('contextmenu', function(node, e) {
        folderTree.getSelectionModel().select(node); // displaySaveView selects root save so select the node user clicked
        Menu.showAt(e.getXY());
    }); 

    treeEditor.on('beforestartedit', function(editor, boundEl, value) {
    if( editor.editNode.attributes.allowEdit == true ) {
        return true; 
    }   
    else {
        return false;
    }
    });

    // save new name for save file to db on completion
    treeEditor.on('complete', function(editor, value, startvalue) {
		try {
			var savefile = DB.Savefiles.select('rowid=?', [editor.editNode.attributes.savefileid]).getOne();
			savefile.name = value;
			savefile.save();
			return true;
        }
        catch(ex) {
			Ext.MessageBox.alert("Database error", ex.message);
			return false;
		}
    });
/*
   Function: removeNode

   Handler for removing an ext.tree.TreeNode.

   Parameters:

   None.

   Returns:

   None.

   See Also:

      <createFolderList>
*/
    function removeNode(){
        var n = folderTree.getSelectionModel().getSelectedNode();
        if(n && n.attributes.allowDelete){
			// do we really want to do this???
			Ext.MessageBox.confirm("Delete", "Really delete this folder and all records in it?", 
				function(btn, text) {
				if( btn == 'yes' ) {
					var id = n.attributes.savefileid;
					folderTree.getSelectionModel().selectPrevious();
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
			});
        }
    }

/*
   Function: renameNode

   Handler for renaming an ext.tree.TreeNode.

   Parameters:

   None.

   Returns:

   None.

   See Also:

      <createFolderList>
*/
    function renameNode() {
        var n = folderTree.getSelectionModel().getSelectedNode();
        if((n.attributes.allowRename == true)){
			treeEditor.editNode = n;
			treeEditor.startEdit(n.ui.textNode);
			// update our hash of savefile id/names
			getSaveFileNames();
			updateSaveMenu();
		}
		else {
			return false;
		}
    }

/*
   Function: addNode

   Handler for adding an ext.tree.TreeNode.

   Parameters:

   None.

   Returns:

   None.

   See Also:

      <createFolderList>
*/
    function addNode(){
        var n = folderTree.getSelectionModel().getSelectedNode();
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
					icon: 'ui/images/drive-harddisk.png',
					date_added: '',
					date_modified: ''
				}).save();
				// update our hash of savefile id/names
				getSaveFileNames();
				// update Save menu
				updateSaveMenu();
			}
			catch(ex) {
				Ext.MessageBox.alert("Database error", ex.message);
			}
			try {
				var id = DB.Savefiles.count();
			}
			catch(ex) {
				  Ext.MessageBox.alert("Database error", ex.message);
			}
			var newnode = new Ext.tree.TreeNode(
			{
				text: 'New Folder', 
				savefileid: id, 
				qtip:'', 
				icon: 'ui/images/drive-harddisk.png',
				leaf: false, 
				allowDelete:true, 
				allowAdd: true,
				allowRename: true,
				allowEdit: true,
				allowDrag:true, 
				allowDrop:true, 
				ddGroup:'SaveFileNodeDrop'
			});
			n.appendChild(newnode);
			n.expand();
			newnode.on('click', function(n) {
				displaySaveView();
				folderTree.getSelectionModel().select(n); // displaySaveView selects root save so select the node user clicked
				showStatusMsg('Displaying ' + n.attributes.id);
				displaySaveFile(n.attributes.savefileid, n.text); 
				clearStatusMsg();
			});
			folderTree.getSelectionModel().select(newnode);
			setTimeout(function() {
				treeEditor.on('complete', function(editor, value, startValue) {
					// update our hash of savefile id/names
					getSaveFileNames();
					updateSaveMenu();
				});
				treeEditor.editNode = newnode;
				treeEditor.startEdit(newnode.ui.textNode);
			}, 1000);
        }
    }


    folderTree.on('beforenodedrop', function(e){
		 if(debug) { console.info("savefilestree dropped on: " + e.target.id); }
		 // grid data source: e.data.selections[0].id
		 // tree node target: e.target.id
		 var sel = e.data.selections;
		 var droppedsavefileid = e.target.attributes.savefileid;
		 doSaveLocal(droppedsavefileid);
		 // redisplay current savefile (to show moved record)
		 var currentId = UI.currSaveFile;
		 var currentName = UI.currSaveFileName;
		 ds = Ext.ComponentMgr.get('save-file-grid').dataSource;
		 if( currentId != '') {
			 ds.reload({db: db, selectSql: UI.savefilesql + ' WHERE Savefiles_id='+currentId});
		}
		 return true;
    });
}

function createFacetFolder() {
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

function updateSearchTargets() {
	updateSearchTargetFolders();
	setPazPar2Targets();
}

function updateSearchTargetFolders() {
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
            icon: 'ui/images/network-server.png'
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
        folderTree.getSelectionModel().select(n); // displaySaveView selects root save so select the node user clicked
	});
	// expand searchRoot if it's been rendered
	if( searchRoot.rendered == true ) {
		searchRoot.expand();
	}
}

function createTargetFolders() {
	// remove old searchRoot if it exists to clear out any old entries
	var folderRoot = Ext.ComponentMgr.get('folderRoot');
	var searchRoot = new Ext.tree.TreeNode({
		allowDrag:false,
		allowDrop:false,
		id:'searchRoot',
		leaf: false,
		text: 'Resources',
		icon: 'ui/images/folder-remote.png'
	});
	Ext.ComponentMgr.register(searchRoot);

	updateSearchTargetFolders();
	return searchRoot;
}

function removeTargetFolder(id) {
	var searchRoot = Ext.ComponentMgr.get('searchRoot');
	searchRoot.removeChild( searchRoot.findChild('id', id) );
}

function createSearchPazParGrid(url) {
	// set init callback for paz
	paz.init = function(data) { searchds.proxy.conn.url = pazpar2url + '?command=show&session=' + paz.sessionID;},
	// clear the searchgrid of old results
	$("#searchgrid").empty();
	var recordDef = Ext.data.Record.create([
		{name: 'title', mapping: 'md-title'},
		{name: 'title-remainder', mapping: 'md-title-remainder'},
		{name: 'author', mapping:'md-author'},
		{name: 'title-responsibility', mapping:'md-title-responsibility'},
		{name: 'publication', mapping:'md-publication-name'},
		{name: 'date', mapping: 'md-date'},
		{name: 'medium', mapping:'md-medium'},
		{name: 'location', mapping:'location @name'}
	]);
	var reader = new Ext.data.XmlReader({
		totalRecords: 'merged',
		record: 'hit',
		id: 'recid'
	}, recordDef);
    searchds = new Ext.data.Store({
        proxy: new Ext.data.HttpProxy({url: url}),
        reader: reader,  
		  remoteSort: false
		});

    cm = new Ext.grid.ColumnModel([
		{header: "Medium", width: 50, dataIndex: 'medium'},
		{header: "Title", width: 180, dataIndex: 'title'},
	    {header: "Author", width: 120, dataIndex: 'title-responsibility'},
	    {header: "Publisher", width: 120, dataIndex: 'publication'},
		{header: "Date", width: 50, dataIndex: 'date'},
		{header: "Location", width: 100, dataIndex: 'location'}
	]);
    cm.defaultSortable = true;

    // create the grid
    searchgrid = new Ext.grid.Grid('searchgrid', {
        ds: searchds,
		id: 'searchgrid',
        cm: cm,
		  enableDragDrop: true,
		  ddGroup: 'RecordDrop',
		  //autoHeight: true,
		  autoExpandColumn: 1
    });
	Ext.ComponentMgr.register(searchgrid);
	searchgrid.getSelectionModel().on('rowselect', function(selmodel, rowIndex) {
		var id = searchgrid.dataSource.data.items[rowIndex].id;
		// get the marcxml for this record and send to preview()
		var marcxml = '';
		paz.recordCallback = function(data) { if( $("error[@code=1]", data) ) {  } var xml = xslTransform.serialize(data.xmlDoc); recordCache[id] = xml; previewRecord(xml)  }
        var xml = getPazRecord(id);
        if( xml ) {
          previewRecord(xml);
			 UI.lastSearchPreviewed = xml;
        }
	}); // rowselect
	searchgrid.on('celldblclick', function(searchgrid, rowIndex, colIndex,  e) {
		var id = searchgrid.getSelections()[0].id;
		var loc = searchgrid.getSelections()[0].data.location;
		getRemoteRecord(id, loc, function(data) { openRecord( xslTransform.serialize( data.xmlDoc ) ) }
);
	}); // cell dbl click
	searchgrid.on('keypress', function( e ) {
	  if( e.getKey() == Ext.EventObject.ENTER ) {
		var id = searchgrid.getSelections()[0].id;
		var loc = searchgrid.getSelections()[0].data.location;
		  getRemoteRecord(id, loc, function(data) { openRecord( xslTransform.serialize( data.xmlDoc ) ) });
		}	
	}); // on ENTER keypress
	searchgrid.on('headerclick', function(grid, colIndex, e) {
		// dataStore.getSortState() returns void if not set so check and set defaults
		var sortState = searchds.getSortState() || {direction: 'ASC'};
		if( !sortState.field ) {
			var col = searchgrid.getColumnModel().getColumnById(colIndex);
			sortState.field = col.dataIndex;
		}
		var sortDir;
		// pazpar2: ascending = 1, descending = 0
		if( sortState.direction == 'ASC' ) {
			sortDir = 1;
		}
		else if( sortState.direction == 'DESC' ) {
			sortDir = 0;
		}
		var sortString = sortState.field + ':' + sortDir; 
		var currNum = paz.currNum ? paz.currNum : 20;
		// set searchds proxy url to sort
		searchds.proxy.conn.url = paz.pz2String + '?command=show&session=' + paz.sessionID + '&sort=' + sortString;
		// run the show query
		paz.show(sortString);
	});
    searchgrid.render();
      // add a paging toolbar to the grid's header
      searchgridpaging = new Ext.PagingToolbar('searchgrid-toolbar', searchds, {
          displayInfo: true,
		  pageSize: 20,
          emptyMsg: "No records to display"
      });
    searchgridpaging.insertButton(0, newButton);
    searchgridpaging.insertButton(1, editButton);
    searchgridpaging.insertButton(2, moveButton);
    searchgridpaging.insertButton(3, refreshButton);
    searchgridpaging.insertButton(4, printButton);
    searchgridpaging.insertButton(5, exportButton);
    //ds.load({params:{start:0, num:20}});
}

/*
   Function: createSaveFileGrid

   Creates the ext.Grid for displaying records in a savefile.

   Parameters:

   None.

   Returns:

   savegrid: the grid created.

   See Also:

      <createSearchResultsGrid>
*/
function createSaveFileGrid(data) {
    savefileds = new Ext.data.Store({
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
        });

    var SavecolModel = new Ext.grid.ColumnModel([
			{header: "Medium", dataIndex: 'Medkum', sortable: true},
            {header: "Title", width: 200, dataIndex: 'Title', sortable: true},
            {header: "Author", width: 160, dataIndex: 'Author', sortable: true},
            {header: "Publisher", width: 130, dataIndex: 'Publisher', sortable: true},
            {header: "DateOfPub", width: 80, dataIndex: 'DateOfPub', sortable: true},
            {header: "Status", width: 100, dataIndex: 'Status', sortable: true},
            {header: "Date Added", width: 120, dataIndex: 'Date Added', sortable: true},
            {header: "Last Modified", width: 120, dataIndex: 'Last Modified', sortable: true},
    ]);
	// make sure the div holding the search grid has height and width so it will render correclty
	$("#savegrid").css('width', '10px');
	$("#savegrid").css('height', '10px');

        // create the Grid
        savefilegrid = new Ext.grid.Grid('savegrid', {
            id: 'save-file-grid',
            ds: savefileds,
            cm: SavecolModel,
            enableDragDrop: true,
            ddGroup: 'RecordDrop',
            autoExpandColumn: 1,
			autoHeight: true,
			autoWidth: true
        });
        Ext.ComponentMgr.register(savefilegrid);
        savefilegrid.on('celldblclick', function(savefilegrid, rowIndex, colIndex,  e) {
          savefileds = savefilegrid.getDataSource();
          var id = savefileds.data.items[rowIndex].data.Id;
			 UI.editor.id = id;
			 showStatusMsg('Opening record...');
			 var xml = getLocalXml(id);
          openRecord( xml );
		  clearStatusMsg();
        });
        savefilegrid.on('keypress', function( e ) {
          if( e.getKey() == Ext.EventObject.ENTER ) {
            var sel = savefilegrid.getSelectionModel().getSelected();
				var id = sel.data.Id;
				UI.editor.id = id;
			  var xml = getLocalXml(id);
			  openRecord( xml );
			  showStatusMsg('Opening record...');
			  openRecord( xml );
			  clearStatusMsg();
          }
        });
        //savefilegrid.on('rowclick', function(searchsavegrid, rowIndex, colIndex, e) {
        //  var id = savefileds.data.items[rowIndex].data.Id;
        //  previewRecord( id , 'save-prev');
        //});
        savefilegrid.getSelectionModel().on('rowselect', function(selmodel, rowIndex) {
			var id = savefileds.data.items[rowIndex].data.Id;
			var xml = getLocalXml(id);
			previewRecord( xml );
			UI.lastSavePreview = xml;
        });
		savefilegrid.render();

      // add a paging toolbar to the grid's footer
      savegridpaging = new Ext.PagingToolbar('savegrid-toolbar', savefileds, {
          displayInfo: true,
          emptyMsg: "No records to display"
      });
    savegridpaging.insertButton(0, newButton);
    savegridpaging.insertButton(1, editButton);
    savegridpaging.insertButton(2, moveButton);
    savegridpaging.insertButton(3, refreshButton);
    savegridpaging.insertButton(4, printButton);
    savegridpaging.insertButton(5, exportButton);
    savefileds.load({db: db, selectSql: UI.savefilesql});
    savefilegrid.getSelectionModel().selectFirstRow();
}

/*
   Function: displaySaveFile

   Displays the savefile with the passed in id and savefile name in the savefile ext.Grid.

   Parameters:

   id: id of the savefile to display.
   savefilename: name of the savefile to display (for updating status bar).

   Returns:

   None.

*/
function displaySaveFile(id, savefilename) {
    loadSaveFile(id);
	// FIXME: use Gears workerpool to load records?
	//createSaveFileGrid(recordCache[id]);
}


/*
   Function: displaySearchResults

   Displays the search results from the most recent search.

   Parameters:

   date: an array of the data to load into the search results ext.Grid.

   Returns:

   None.

*/
function displaySearchResults(data) {
    searchsaveds.removeAll();
    searchsaveds.loadData(data);
    //filterSearchResultsByServer();
    searchsavegrid.getSelectionModel().selectFirstRow();
}

/*
   Function: loadSaveFile

   Load the date of the savefile whose id is passed in into the savefile ext.Grid.

   Parameters:

   id: id of the savefile whose data is to be loaded

   Returns:

   None.

*/
function loadSaveFile(id) {
	Ext.ComponentMgr.get('save-file-grid').dataSource.reload({db: db, selectSql: UI.savefilesql + ' WHERE Savefiles_id = ' + id});
}



/*
   Function: previewRecord

   Display a preview in the preview panel of the record whose id is passed in

   Parameters:

   id: id of the record whose preview is to be shown

   Returns:

   None.

*/
function previewRecord(xml) {
	// to prevent Extjs from sending to rowselect events in succession, thereby causing 
	// to preview twice in a row
	if( UI.lastSearchPreviewed == xml || UI.lastSavePreview == xml ) {
		//return;
	}
	if( Ext.get('searchgrid').isVisible() ) {
		var panelid = 'search-preview-panel';
	}
	else if (Ext.get('savegrid').isVisible() ) {
		var panelid = 'save-preview-panel';
	}
	var previewPanel = innerLayout.getRegion('south').getPanel(panelid);
		
	if( previewPanel ) {
		previewPanel.el.mask();
		if(debug) { console.info('previewing record'); }
		showStatusMsg('Previewing record...');
		previewPanel.el.update('');
		//console.info('previewRecord: previewing record with xml: ' + xml);
		$('#'+panelid).getTransform(marcxsl, xml );
		 clearStatusMsg();
		previewPanel.el.unmask();
	}
}

/*
   Function: displayRecordView

   Setup the UI to display a record in the marc editor.

   Parameters:

   None.

   Returns:

   None.

*/
function displayRecordView() {
    // unselect whatever is selected in the folder tree so we can click back on something like Drafts to open it
    var selectedNode = folderTree.getSelectionModel().getSelectedNode();
    folderTree.getSelectionModel().unselect( selectedNode );
    // hide panels for search/save/preview
    innerLayout.getRegion('south').hide()
    //show help panel
    innerLayout.getRegion('east').show();
    innerLayout.getRegion('east').expand();
	innerLayout.getRegion('center').hidePanel('savegridpanel');
	innerLayout.getRegion('center').hidePanel('searchgridpanel');
	innerLayout.getRegion('center').showPanel('marceditor');
}

/*
   Function: displaySearchView

   Setup the UI to display the search results grid.

   Parameters:

   None.

   Returns:

   None.

*/
function displaySearchView() {
    // show panels for search/save/preview
    innerLayout.getRegion('south').showPanel('search-preview-panel');
    //hide help panel
    innerLayout.getRegion('east').collapse();
	innerLayout.getRegion('center').hidePanel('marceditor');
    clear_editor();
	innerLayout.getRegion('center').hidePanel('savegridpanel');
	innerLayout.getRegion('center').showPanel('searchgridpanel');
	UI.lastWindowOpen = 'searchgrid';
}

/*
   Function: displaySaveView

   Setup the UI to display the savefile grid.

   Parameters:

   None.

   Returns:

   None.

*/
function displaySaveView() {
    // show panels for search/save/preview
    innerLayout.getRegion('south').showPanel('save-preview-panel');
    //hide help panel
    innerLayout.getRegion('east').collapse();
    if( rte_editor && rte_editor._getDoc()) {
		clear_editor();
	}
	innerLayout.getRegion('center').hidePanel('marceditor');
	innerLayout.getRegion('center').hidePanel('searchgridpanel');
	innerLayout.getRegion('center').showPanel('savegridpanel');
	UI.lastWindowOpen = 'savegrid';
	// if we have a current save file, reload it so the grid reflects any changes made
	if( UI.currSaveFile != '') {
		loadSaveFile( UI.currSaveFile );
	}
}

/*
   Function: openRecord

   Display the record whose id is passed in in the marc editor for editing.

   Parameters:

   id: id of the record to edit.

   Returns:

   None.

*/
function openRecord(xml) {
	$("#vareditor").empty();
	$("ffeditor").empty();
    $("#ffeditor").getTransform( ffxsl, xml);
    $("#vareditor").getTransform( varfxsl, xml);
	 create_static_editor($('#ffeditor'), $('#vareditor') );
	 //create_jquery_editor();
	//create_yui_rte_editor();
	//create_yui_rte_editor();
	// show fixed field editor, hide ldr and 008 divs
	$("#ffeditor").show();
	// hide leader and 008
	$("#000, #008").css('display', 'none');


	$("#help-panel").append("This is the Help panel");
	 // Draggable is causing the cursor not to be able to move out of the $a subfield <span>.  Not sure why yet.
	 // add jquery draggable and droppable to subfields
	//$('.subfield').Draggable();
	//$('.subfields').Droppable(
	//    {accept: 'subfield',
	//      ondrop: function(dropped) {
	//            $(this).append( "<div class='subfield' style='display:inline;' onclick='initEditor(this)'>"+$(dropped).html() + "</div>").Draggable();
	//            $(dropped).remove();
	//            $('.subfield').Draggable();
	//       },
	//      hoverclass: 'droppable'
	//    });

	displayRecordView();
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
function doDownloadRecords() {
        var xml ='';
        var recsep = "<!-- end of record -->";
        showStatusMsg("<p>Downloading records</p>");
        var currtab = tabs.getActiveTab();
        if( Ext.get('savegrid').isVisible() ) {
            var grid = Ext.ComponentMgr.get('save-file-grid');
            var ds = grid.getDataSource();
            var sel = grid.getSelectionModel().getSelections()
            for( var i = 0; i < sel.length; i++) {
                var id = sel[i].data.Id;
                try {
                  var rs = db.execute('select xml from Records where id =?', [id]);
                  while( rs.isValidRow() ) {
                    xml += rs.fieldByName('xml');
                    xml += recsep;
                    rs.next();
                  }
                }
                catch(ex) {
                  console.error('db error: ' + ex.message);
                }
            }
        rs.close();
        }
        else if( Ext.get('searchgrid').isVisible() ) {
            var grid = Ext.ComponentMgr.get('search-grid');
            var ds = grid.getDataSource();
            var sel = grid.getSelectionModel().getSelections()
            for( var i = 0; i < sel.length; i++) {
                var id = sel[i].data.Id;
                try {
                  var rs = db.execute('select xml from Records where id=?', [id]);
                  while( rs.isValidRow() ) {
                    xml += rs.fieldByName('xml');
                    xml += recsep;
                    rs.next();
                  }
                }
                catch(ex) {
                  console.error('db error: ' + ex.message);
                }
            }
        rs.close();
        }
        // else if we have an open record in the editor
    else if( Ext.get('marceditor').isVisible() ) {
        var ff_ed = $("#fixedfields_editor");
        var var_ed = UI.editor.doc;
        // transform edited record back into marcxml
        if( marcFlavor == 'marc21' ) {
            xml = Edit2XmlMarc21(ff_ed, var_ed);
        }
        else if( marcFlavor == 'unimarc' ) {
            Ext.MessageBox.alert("Unimarc support not yet implemented");
        }
        }
    dlg = new Ext.BasicDialog("newrecord-dlg", {
        height: 200,
        width: 400,
        minHeight: 100,
        minWidth: 150,
        modal: false,
        proxyDrag: true,
        shadow: true
    });
        dlg.body.dom.innerHTML = "<div id='form'></div>";

    var form = new Ext.form.Form({
    });
    var store = new Ext.data.SimpleStore({
    fields: ['name', 'format'],
    data: [ ['MARC21', 'marc21'],
            ['MARCXML', 'marcxml']
          ]
    });
   form.add(
    new Ext.form.ComboBox({
        id: 'recordformat',
        store: store,
        displayField:'name',
        valueField: 'format',
        typeAhead: true,
        mode: 'local',
        triggerAction: 'all',
        fieldLabel: 'Choose record type',
        emptyText:'Select a record type...',
        selectOnFocus:true  
    })
    );
    form.render('form');
    encoding='utf-8';
    if(debug){ console.info("dl rec: xml=" + xml);}
    dlg.addButton('Select',
    function() {  
      format = Ext.ComponentMgr.get('recordformat').getValue();
        handleDownload(format, encoding, xml);
        dlg.hide();
		clearStatusMsg();
    },
    dlg);
    dlg.addButton('Cancel', dlg.hide, dlg);
    dlg.addKeyListener(27, dlg.hide, dlg); // ESCAPE
    dlg.show();
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
        "/cgi-bin/downloadMarc.pl", 
        {format: format, encoding: encoding, xml: xml}, 
          function(data) {
            //if(debug){ alert(data);}
            $("<iframe id='dl' src='/cgi-bin/download.pl?filename="+data+"'/>").appendTo("body");
            //$("#dl").remove();
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
        modal: true,    
        });
        uploadDlg.addKeyListener(26, uploadDlg.hide, uploadDlg);
        uploadDlg.addKeyListener(13, uploadDlg.hide, uploadDlg);
        uploadDlg.addButton('Cancel', uploadDlg.hide, uploadDlg);
        uploadDlg.body.dom.innerHTML = "<div id='uploadFormDiv'/>";
        $("#uploadFormDiv").append("<form id='uploadForm' target='upload_frame' method='POST' action='/cgi-bin/uploadMarc.pl' enctype='multipart/form-data'>Choose a file to upload:<input type='file' id='fileToUpload' name='fileToUpload'/></form>");
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

/*
   Function: doNewRecord

   Prompt the user for the type of record to create (based on configuration file), then display marceditor to edit it.

   Parameters:

   None.

   Returns:

   None.

   See Also:

   <doCreateNewRecord>

*/
function doNewRecord() {
    var dlg = new Ext.BasicDialog("newrecord-dlg", {
        height: 200,
        width: 400,
        minHeight: 100,
        minWidth: 150,
        modal: false,
        proxyDrag: true,
        shadow: true
    });
        dlg.body.dom.innerHTML = "<div id='form'></div>";

    var form = new Ext.form.Form({
    });

    var myData = new Array();
    $("template", configDoc).each( function() {
    var template = new Array( $("name", $(this)).text(), $("file", $(this)).text() );
    myData.push(template);
    });
    var store = new Ext.data.SimpleStore({
    fields: ['name', 'file'],
    data: myData
    });
     form.add(
    new Ext.form.ComboBox({
        id: 'recordtype',
        store: store,
        displayField:'name',
        valueField: 'file',
        typeAhead: true,
        mode: 'local',
        triggerAction: 'all',
        emptyText:'Select a record type...',
        selectOnFocus:true  
    })
    );
    form.render('form');

    dlg.addButton('Select', 
    function(btn) {
        doCreateNewRecord();
        dlg.hide();
    },
    dlg);    
    dlg.addButton('Cancel', dlg.hide, dlg);
    dlg.addKeyListener(27, dlg.hide, dlg); // ESCAPE
    dlg.show();
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
        var filename = Ext.ComponentMgr.get('recordtype').getValue();       
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
   Function: getLastRecId

   Retrieve the last inserted id from the Records table.

   Parameters:

   None.

   Returns:

   None.

   See Also:

      <getLastSrchId>
*/
function getLastRecId() {
	var lastId = DB.Records.count();
    return lastId;
}

/*
   Function: getLastSrchId

   Retrieve the last inserted id from the Searches table.

   Parameters:

   None.

   Returns:

   None.

   See Also:

      <getLastRecId>
*/
function getLastSrchId() {
    // get the last id from sqlite to set open javascript function id
    var rs;
    var lastId;
    try {
        rs = db.execute('select max(id) from Searches');
        lastId = rs.field(0);
    } catch(ex) {
       Ext.Msg.alert('Error', 'db error: ' + ex.message);
    }
    if( lastId == null) {
    //console.info('changing lastId from null to 0');
    lastId = 0;
    }
    return lastId;
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
    showStatusMsg("<p>Deleted "+ sel.length + " record(s).</p>");
	clearStatusMsg();
    // redisplay current savefile (to show moved record)
    var currentNode = folderTree.getSelectionModel().getSelectedNode();
    displaySaveFile(currentNode.attributes.savefileid, currentNode.text); 
    displaySaveView();
  }
}

/*
   Function: doChangeStatus

   Handler for changing the status field of a record or records.

   Parameters:

   recstatus: String to set the record(s)' status to.

   Returns:

   None.

*/
function doChangeStatus(recstatus) {
  Ext.MessageBox.prompt('Change status', 'Choose a record status', function(btn, recstatus) {
        showStatusMsg("<p>Updating status in Save File to " + recstatus + "</p>");
        var currtab = tabs.getActiveTab();
        if( currtab.id == 'savefile' ) {
            var grid = Ext.ComponentMgr.get('save-file-grid');
            var ds = grid.getDataSource();
            var sel = grid.getSelectionModel().getSelections()
            for( var i = 0; i < sel.length; i++) {
                var id = sel[i].data.Id;
                try {
                  db.execute("update Records set status = ? where id = ?", [recstatus, id]);
                }
                catch(ex) {
                  console.error('db error: ' + ex.message);
                }
            }
            displayLocalFile();
        }
        // else if we're on search results give error msg: have to save to save file first
        else if( currtab.recid.match('search') ) {
            Ext.Msg.alert('Error', 'You must open record or save record to Save File before editing or changing status');
        }
        // else if we have an open record in the editor
        else {
            try {
              var id = currtab.recid.substr(6);
              db.execute("update Records set status = ? where id = ?", [recstatus, id]);
            }
            catch(ex) {
              console.error('db error: ' + ex.message);
            }
            
        }
        showStatusMsg("<p>Updated status in Save File to " + recstatus + "</p>");
		clearStatusMsg();
    });
}

/*
  Function: showStatusMsg

  Parameters: 

    msg: String containing message to show

  Returns:

    None.
*/
function showStatusMsg(msg) {
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

function clearStatusMsg() {
	/*if( $("#status").length > 0 ) {
		$("#status").SlideOutDown(2000);
	}*/
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
  var targetnodes = searchRoot.childNodes;
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
	paz.search( paz.currQuery );
}

function getLocalXml(id) {
	var xml = DB.Records.select('Records.rowid=?',[id]).getOne().xml;
	return xml;
}
