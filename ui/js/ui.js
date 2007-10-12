
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
				var sel = searchgrid.getSelectionModel().getSelected();
				var id = sel.data.Id;
				searches[0].getRecordMarc({
					recid:id, 
					success: function(data){openRecord(data);}
				});
				showStatusMsg('Opening record...');
				clearStatusMsg();
            }
            else if( Ext.get('savegrid').isVisible() ) {
				var xml = getLocalXml(savefilegrid.getSelections()[0].data.Id);
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

/*
   Function: createMainTab

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
          hidden: true
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
		//createSearchResultsGrid();
		var searchgridpanel = new Ext.ContentPanel('searchgridpanel', {toolbar: searchgridpaging, resizeEl: 'searchgrid', fitToFrame: true, autoScroll: true});
		var savegridpanel = new Ext.ContentPanel('savegridpanel', {toolbar: savegridpaging, resizeEl: 'savegrid', fitToFrame: true, autoScroll: true});
		var marceditorpanel = new Ext.ContentPanel('marceditor', {toolbar: editor_toolbar, resizeEl: 'marccontent', fitToFrame: true, autoScroll: true});
		var homepanel = new Ext.ContentPanel('home-panel', {fitToFrame: true, autoScroll: true});
		innerLayout.add('center', searchgridpanel);
		innerLayout.add('center', savegridpanel);
		innerLayout.add('center', marceditorpanel);
		innerLayout.add('center', homepanel);
        lower_panel = new Ext.ContentPanel('lower-panel', "Preview");
        innerLayout.add('south', lower_panel);
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
    // get all savefiles at the root level, then for each append its children
    var rs, current_root;
    try {
    if( parentid == 'null' ) {
        rs = db.execute('select id, name, description, allowDelete, allowAdd, allowRename, allowDrag, allowDrop, ddGroup, icon from Savefiles where parentid is null');
        current_root = saveFilesRoot;
    }
    else {
        rs = db.execute('select id, name, description, allowDelete, allowAdd, allowRename, allowDrag, allowDrop, ddGroup, icon from Savefiles where parentid = ?',[parentid]);
        current_root = getNodeBySaveFileId(parentid);
    }
    while( rs.isValidRow() ) {
        var id = rs.fieldByName('id');  
        var name = rs.fieldByName('name');  
        var desc = rs.fieldByName('description');
        var allowDelete = rs.fieldByName('allowDelete');
        var allowAdd = rs.fieldByName('allowAdd');
        var allowRename = rs.fieldByName('allowRename');
        var allowDrag = rs.fieldByName('allowDrag');
        var allowDrop = rs.fieldByName('allowDrop');
        var ddGroup = rs.fieldByName('ddGroup');
        var icon = rs.fieldByName('icon');
        // create a treenode for this save file
        var newnode = new Ext.tree.TreeNode({
            id: name,
            text: name, 
            savefileid: id, 
            parentid: parentid,
            qtip: desc, 
            icon: icon,
            leaf: false, 
            allowDelete: allowDelete, 
            allowAdd: allowAdd,
            allowDrag: allowDrag, 
            allowDrop: allowDrop, 
            ddGroup: ddGroup
        }); 
        current_root.appendChild(newnode);
        newnode.on('click', function(n) {
			showStatusMsg('Displaying ' + n.attributes.id);
            displaySaveView();
            folderTree.getSelectionModel().select(n); // displaySaveView selects root save so select the node user clicked
            displaySaveFile(n.attributes.savefileid, n.text); 
			clearStatusMsg();
        });
		//FIXME: save records in this save file folder to recordCache
		//if(debug) { console.info('loading records for save file folder with id ' + rs.fieldByName('id') + ' into recordCache'); }
		//recordCache[id] = loadSaveFile(rs.fieldByName('id'));
        // setup dropnode for Trash
        if( name == 'Trash' ) {

        }
        createSaveFileFolders(id);
        rs.next();
    } 
    }
    catch(ex) {
    Ext.Msg.alert("DB error", ex.message);
    }
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
    searchRoot = new Ext.tree.TreeNode({
        allowDrag:false,
        allowDrop:false,
        id:'searchRoot',
        leaf: false,
        text: 'Resources',
        icon: 'ui/images/folder-remote.png'
    });
    var searchTreeChildren = new Array();
    var targets = getTargets();
    for( var i = 0; i < targets.length; i++) {
        var data = targets[i];
        var targetnode = new Ext.tree.TreeNode(
          {
            text: data.name, 
            servername: data.name,
            id: data.id, 
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
          setEnableTargets();
        });
        targetnode.appendChild([serverleaf, portleaf, dbnameleaf, userleaf]);
        searchTreeChildren.push(targetnode);
    }
    searchRoot.appendChild(searchTreeChildren);
	searchRoot.on('click', function(n) {
		displaySearchView();
        folderTree.getSelectionModel().select(n); // displaySaveView selects root save so select the node user clicked
	});

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
    saveFilesRoot.on('click', function() {
        displaySaveView();
    });

    createSaveFileFolders('null'); 



    folderRoot.appendChild([searchRoot, saveFilesRoot]);
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
        rs = db.execute('update Savefiles set name=? where id=?', [value, editor.editNode.attributes.savefileid]);
        rs.close();
        return true;
        }
        catch(ex) {
        Ext.Msg.alert("DB error", ex.message);
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
        Ext.MessageBox.confirm("Delete", "Really delete this folder and all records in it?", function(btn, text) {
            if( btn == 'yes' ) {
            var id = n.attributes.savefileid;
            folderTree.getSelectionModel().selectPrevious();
            n.parentNode.removeChild(n);
            // update db
            try {
                rs = db.execute('delete from Savefiles where id=?', [id]);
                rs.close();
                return true;
            }
            catch(ex) {
                Ext.Msg.alert("DB error", ex.message);
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
        if((n.attributes.allowAdd == true)){
        var newname = 'New Folder';
        // update db with new save file and get its id so we can pass it to TreeNode config
        var rs, id, parentid;
        parentid = n.attributes.savefileid;
        if( parentid == 'null') {
        parentid = null;
        }
        try {
        rs = db.execute('insert into Savefiles (id, name, description, parentid, allowDelete, allowAdd, allowRename, allowDrag, allowDrop, ddGroup, icon, date_added, date_modified) values (null, ?, "", ?, 1, 1, 1, 1, 1, "RecordDrop", "ui/images/drive-harddisk.png", datetime("now", "localtime"), datetime("now", "localtime"))', [newname, parentid]);
        rs.close();
        }
        catch(ex) {
        Ext.Msg.alert("DB error", ex.message);
        }
        try {
        rs = db.execute('select max(id) from Savefiles');
        id = rs.field(0);
        rs.close();
        }
        catch(ex) {
        Ext.Msg.alert("DB error", ex.message);
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
        }                   
        );
            n.appendChild(
        newnode
        );
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
        doSaveLocal(e.target.attributes.savefileid, e.target.text, sel);
        // redisplay current savefile (to show moved record)
        var currentNode = folderTree.getSelectionModel().getSelectedNode();
		// reload data into recordCache
		var currentId = currentNode.attributes.savefileid;
		// FIXME: use Gears workerpool to do this?
		//if(debug) { console.info('reloading data into save file after record(s) droppped'); }
		//recordCache[currentId] = loadSaveFile(currentId);
        displaySaveFile(currentId, currentNode.text); 
        return true;
    });
}

/*
   Function: createSearchResultsGrid

   Creates the ext.Grid for displaying search results.  Destroys any old existing search grids.

   Parameters:

   data: Array holding the data to load into the newly created grid.

   Returns:

   searchgrid: the grid created

   See Also:

      <createSaveFileGrid>
*/
function createSearchResultsGrid(data) {

	// destroy old search results grid
	if( Ext.ComponentMgr.get('search-grid') ) {
		searchsavegrid.destroy(false);
	}
    // create new Search Results Grid
    // empty data at first
	if( ! data) {
		data = [];
	}
    searchsaveds = new Ext.data.Store({
                proxy: new Ext.data.PagingMemoryProxy(data),
                reader: new Ext.data.ArrayReader({}, [
                       {name: 'Id'},
                       {name: 'Title'},
                       {name: 'Author'},
                       {name: 'Publisher'},
                       {name: 'DateOfPub'},
                       {name: 'Server'},
                  ])
        });

    var colModel = new Ext.grid.ColumnModel([
            {header: "Title", width: 370, dataIndex: 'Title', sortable: true},
            {header: "Author", width: 190, dataIndex: 'Author', sortable: true},
            {header: "Publisher", width: 210, dataIndex: 'Publisher', sortable: true},
            {header: "DateOfPub", width: 80, dataIndex: 'DateOfPub', sortable: true},
            {header: "Server", width: 200, dataIndex: 'Server', sortable: true},
    ]);

	// make sure the div holding the search grid has height and width so it will render correclty
	$("#searchgrid").css('width', '10px');
	$("#searchgrid").css('height', '10px');

        // create the Grid
        searchsavegrid = new Ext.grid.Grid('searchgrid', {
            id: 'search-grid',
            ds: searchsaveds,
            cm: colModel,
            enableDragDrop: true,
            ddGroup: 'RecordDrop',
            autoExpandColumn: 1,
			autoWidth: true,
            autoHeight: true
        });
        Ext.ComponentMgr.register(searchsavegrid);
        searchsavegrid.on('celldblclick', function(searchsavegrid, rowIndex, colIndex,  e) {
          var id = searchsaveds.data.items[rowIndex].data.Id;
		  showStatusMsg('Opening record...');
          openRecord( id );
		  clearStatusMsg();
        });
        searchsavegrid.on('keypress', function( e ) {
          if( e.getKey() == Ext.EventObject.ENTER ) {
            var sel = searchsavegrid.getSelectionModel().getSelected();
            var id = sel.data.Id;
		    showStatusMsg('Opening record...');
            openRecord( id );
			clearStatusMsg();
          }
        });
        //searchsavegrid.on('rowclick', function(searchsavegrid, rowIndex, colIndex, e) {
        //  var id = searchsaveds.data.items[rowIndex].data.Id;
        //  previewRecord( id , 'search-prev');
        //});
        searchsavegrid.getSelectionModel().on('rowselect', function(selmodel, rowIndex) {
          var id = searchsaveds.data.items[rowIndex].data.Id;
          previewRecord( id , 'search-prev');
        });
      searchsavegrid.render();
        searchsavegrid.getSelectionModel().selectFirstRow();

      // add a paging toolbar to the grid's header
      searchgridpaging = new Ext.PagingToolbar('searchgrid-toolbar', searchsaveds, {
          displayInfo: true,
          emptyMsg: "No records to display"
      });
    searchgridpaging.insertButton(0, newButton);
    searchgridpaging.insertButton(1, editButton);
    searchgridpaging.insertButton(2, moveButton);
    searchgridpaging.insertButton(3, refreshButton);
    searchgridpaging.insertButton(4, printButton);
    searchgridpaging.insertButton(5, exportButton);
    searchsaveds.load({params:{start:0, limit:20}});
}

function createSearchPazParGrid(url) {
	// clear the searchgrid of old results
	$("#searchgrid").empty();
	var recordDef = Ext.data.Record.create([
		{name: 'title', mapping: 'md-title'},
		{name: 'title-remainder', mapping: 'md-title-remainder'},
		{name: 'author', mapping:'md-author'},
		{name: 'date', mapping: 'md-date'},
		{name: 'medium', mapping:'md-medium'},
		{name: 'location', mapping:'location @name'}
	]);
	var reader = new Ext.data.XmlReader({
		totalRecords: 'total',
		record: 'hit',
		id: 'recid'
	}, recordDef);
    ds = new Ext.data.Store({
        // load using HTTP
        proxy: new Ext.data.HttpProxy({url: url}),

        // the return will be XML, so lets set up a reader
        reader: reader,  
		remoteSort: false
		});

    cm = new Ext.grid.ColumnModel([
		{header: "Title", width: 180, dataIndex: 'title'},
	    {header: "Author", width: 120, dataIndex: 'author'},
		{header: "Date", width: 50, dataIndex: 'date'},
		{header: "Medium", width: 50, dataIndex: 'medium'},
		{header: "Location", width: 100, dataIndex: 'location'}
	]);
    cm.defaultSortable = true;

    // create the grid
    searchgrid = new Ext.grid.Grid('searchgrid', {
        ds: ds,
        cm: cm,
		//autoHeight: true,
		autoExpandColumn: 0
    });
	searchgrid.on('headerclick', function(searchgrid, columnIndex, event) {
		//ds.reload({params:{sort:1}});
	});
	searchgrid.getSelectionModel().on('rowselect', function(selmodel, rowIndex) {
		var id = searchgrid.dataSource.data.items[rowIndex].id;
		// get the marcxml for this record and send to preview()
		var marcxml = '';
		searches[0].getRecordMarc( 
		{
			recid:id,
			success: function(data) {
				previewRecord( data );
			}
		});
	});
	searchgrid.on('celldblclick', function(searchgrid, rowIndex, colIndex,  e) {
		showStatusMsg('Opening record...');
		var id = searchgrid.dataSource.data.items[rowIndex].id;
		searches[0].getRecordMarc({
			recid:id, 
			success: function(data){openRecord(data);}
		});
	});
	searchgrid.on('keypress', function( e ) {
	  if( e.getKey() == Ext.EventObject.ENTER ) {
            var sel = searchgrid.getSelectionModel().getSelected();
            var id = sel.data.Id;
			searches[0].getRecordMarc({
				recid:id, 
				success: function(data){openRecord(data);}
			});
		    showStatusMsg('Opening record...');
			clearStatusMsg();
          } // if ENTER
	}); // on keypress
    searchgrid.render();
      // add a paging toolbar to the grid's header
      searchgridpaging = new Ext.PagingToolbar('searchgrid-toolbar', ds, {
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
    ds.load({params:{start:0, num:20}});

	if( ds.getCount() < 20 ) {
		ds.reload({params: {start:0, num:20}});
	}
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
	// destroy old search results grid
	if( Ext.ComponentMgr.get('save-file-grid') ) {
		savefilegrid.destroy(false);
	}
    // create new Search Results Grid
    // empty data at first
	if( ! data) {
		data = [];
	}
 
    savefileds = new Ext.data.Store({
                proxy: new Ext.data.PagingMemoryProxy(data),
                reader: new Ext.data.ArrayReader({}, [
                       {name: 'Id'},
                       {name: 'Title'},
                       {name: 'Author'},
                       {name: 'Publisher'},
                       {name: 'DateOfPub'},
                       {name: 'Status'},
                       {name: 'Date Added'},
                       {name: 'Last Modified'},
                  ])
        });
        savefileds.load();

    var SavecolModel = new Ext.grid.ColumnModel([
            {header: "Title", width: 300, dataIndex: 'Title', sortable: true},
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
		  showStatusMsg('Opening record...');
		  var xml = getLocalXml(id);
          openRecord( xml );
		  clearStatusMsg();
        });
        savefilegrid.on('keypress', function( e ) {
          if( e.getKey() == Ext.EventObject.ENTER ) {
            var sel = savefilegrid.getSelectionModel().getSelected();
            var id = sel.data.Id;
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
    savefileds.load({params:{start:0, limit:20}});
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
    var data = loadSaveFile(id);
	createSaveFileGrid(data);
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
   Function: loadSearch

   Loads a search with the passed in id into the search results grid.

   Parameters:

   id: id of the search (Searches table) to load.

   Returns:

   None.

*/
function loadSearch(id) {
    var rs;
    try {
    rs = db.execute('select * from Searches where id = ?', [id]);   
    }
    catch(ex) {
    Ext.Message.alert(ex.message);
    }
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
    var data = new Array();
    var i = 0;
    try {
        var rs = db.execute('select * from Records where savefile=?',[id]);
        while( rs.isValidRow() ) {
            var id = rs.fieldByName('id');
            var xml = rs.fieldByName('xml');
            var currRecord = Sarissa.getDomDocument();
            currRecord = (new DOMParser()).parseFromString(xml, 'text/xml');
            var title = $('[@tag="245"]/subfield[@code="a"]', currRecord).text();
            var author = $('[@tag="245"]/subfield[@code="c"]', currRecord).text();
            var publisher = $('[@tag="260"]/subfield[@code="b"]', currRecord).text();
            var dateofpub = $('[@tag="260"]/subfield[@code="c"]', currRecord).text();
            var recstatus = rs.fieldByName('status');
            var date_added = rs.fieldByName('date_added');
            var date_modified = rs.fieldByName('date_modified');
            var recArray = new Array(id, title, author, publisher, dateofpub, recstatus, date_added, date_modified);
            data[i] = recArray;
            i++;
                rs.next();
            }
        } catch(ex) {
            Ext.Msg.alert('Error', 'db error: ' + ex.message);
        }
    rs.close();
    return data;
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
    $("#lower-panel").empty();
    console.info('previewRecord: previewing record with xml: ' + xml);
    $('#lower-panel').getTransform(showMarcXslPath, xml );
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
    innerLayout.getRegion('south').show()
    //hide help panel
    innerLayout.getRegion('east').collapse();
	innerLayout.getRegion('center').hidePanel('marceditor');
    clear_editor();
	innerLayout.getRegion('center').hidePanel('savegridpanel');
	innerLayout.getRegion('center').showPanel('searchgridpanel');
    // select search results root
    folderTree.getSelectionModel().select(searchRoot);
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
    innerLayout.getRegion('south').show()
    //hide help panel
    innerLayout.getRegion('east').collapse();
    if( rte_editor && rte_editor._getDoc()) {
		clear_editor();
	}
	innerLayout.getRegion('center').hidePanel('marceditor');
	innerLayout.getRegion('center').hidePanel('searchgridpanel');
	innerLayout.getRegion('center').showPanel('savegridpanel');
    // select root node of savefile folders
    //folderTree.getSelectionModel().select(saveFilesRoot);
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
    $("#ffeditor").getTransform( fixedFieldXslPath, xml);
    $("#vareditor").getTransform( varFieldsXslPath, xml);
	var vared = $("#vareditor").html();
	$("#vareditor").empty();
    $("#vareditor").append("<textarea name='rte_placeholder' id='rte_placeholder'>"+vared+"</textarea>");
	rte_editor = new YAHOO.widget.Editor('rte_placeholder', {
		height: '700px',
		width: '722px',
		dompath: false, //Turns on the bar at the bottom
		animate: false, //Animates the opening, closing and moving of Editor windows
		css: editor_css
	});
	rte_editor.render();
	rte_editor.on('editorContentLoaded', function() {
		// move the cursor to 001 tag so we can use it even though leader will be invisible
		var editorSelection = rte_editor._getSelection();
		var tag001 = $("#001", rte_editor._getDoc()).get(0);
		editorSelection.extend(tag001, 0);
		editorSelection.collapseToEnd();
		editorSetFocus( $(editorSelection.focusNode).children('.tagnumber') );
		rte_editor._focusWindow();
		$("#000", rte_editor._getDoc()).hide();
		$("#008", rte_editor._getDoc()).hide();
		// add metadata div with associated savefile id and record id
		$("#marceditor").prepend("<div id='metadata' style='display: none;'><span id='id'>"+id+"</span><span id='savefileid'>"+savefileid+"</span></div>");
	});
	rte_editor.on('editorKeyPress', editorKeyPress );
	rte_editor.on('editorKeyPress', editorCheckHighlighting );
	rte_editor.on('editorKeyUp', function(o) {
	});
	rte_editor.on('editorMouseUp', function(o) {
		YAHOO.util.Event.stopEvent(o.ev);
		editorSelection = rte_editor._getSelection();
		var selectedElement = editorGetSelectedElement();
		editorSetFocus( selectedElement );
		if(debug) { console.info( "mouseUP: selected node text: " + $(selectedElement).text() );}
		if(debug) { console.info( "mouseUp: " + selectedElement);}
		if(debug) { console.info( "mouseUp: " + editorSelection);}
	});
	// show fixed field editor, hide ldr and 008 divs
	$("#ffeditor").show();
	// hide leader and 008
	$("#000", rte_editor._getDoc()).hide();
	$("#008", rte_editor._getDoc()).hide();


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

	// keep track of currently open record
	currOpenRecord = id;
	displayRecordView();
}

/* 
   Function: clearEditor

   Clear the editor divs and rich text editor of currently open record.

   Parameters:
  
   None.

   Returns:

   None.
 
   See Also:
   <openRecord>
*/
function clear_editor() {
    // if we're coming from marceditor, destroy old rte instance
    if( innerLayout.getRegion('center').activePanel.getId() == 'marceditor' && rte_editor && rte_editor._getDoc()  ) {
        rte_editor.destroy();
    }
   // clear the marceditor divs
   $("#ffeditor").empty();
   $("#rte_placeholder").empty();
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
        var var_ed = rte_editor._getDoc();
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
    // get the last id from sqlite to set open javascript function id
    var rs;
    var lastId;
    try {
        rs = db.execute('select max(id) from Records');
        lastId = rs.field(0);
        //console.info('ProcsessSearchResults: last id inserted: ' + lastId);
    } catch(ex) {
        //console.error('db error: ' + ex.message);
    }
    if( lastId == null) {
    //console.info('changing lastId from null to 0');
    lastId = 0;
    }
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
	if( $("#status").length == 0 ) {
		$("#folder-list").append("<div id='status'></div>");
	}
	else if( $("#status").text() == msg) {
		// don't show this same status message twice
		return false;
	}
	else {
		$("#status").append(msg);
		$("#status").SlideInDown(500);
	}
}

function clearStatusMsg() {
	if( $("#status").length > 0 ) {
		setTimeout( function() {
			$("#status").SlideOutDown(1000);
			$("#status").empty();
		}, 3000);
	}
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
    }
  }
  searchsaveds.filterBy( function(record, id) {
    // if this records Server name matches one of the checkednodes, return true for this record
    for( var i = 0; i < checkednodes.length; i++) {
      if( record.data.Server == checkednodes[i] ) {
        return true;
      }
    }
  });
}

function getLocalXml(id) {
    //console.info('openRecord: opening record with id: ' + id);
    try {
        var resultSet = db.execute('select xml, savefile from Records where id=?', [id]);
    } catch(ex) {
        //console.error('db error: ' + ex.message);
    }
    var xml;
    while( resultSet.isValidRow() ) {
        xml = resultSet.fieldByName('xml');
		savefileid = resultSet.fieldByName('savefile');
        //console.log('opening record with xml: ' + xml);
        resultSet.next();
    }
    if(debug==1) {console.info("record " + id + " has xml: " + xml);}
	return xml;
}
