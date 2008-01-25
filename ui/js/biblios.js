/**
  * Application Layout
  * by Jozef Sakalos, aka Saki
  * http://extjs.com/learn/Tutorial:Application_Layout_for_Beginners
  */
 
// reference local blank image
Ext.BLANK_IMAGE_URL = '../extjs/resources/images/default/s.gif';
// create namespace
Ext.namespace('biblios');
 
// create application
biblios.app = function() {
    // do NOT access DOM from here; elements don't exist yet
 
    // private variables
	var viewport; 
    // private functions
	createSearchGrid = function() {
		var pazShowUrl = pazpar2url + '?session=' + paz.sessionID + '&command=show';

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
			proxy: new Ext.data.HttpProxy({url: pazShowUrl}),
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
		searchgrid = new Ext.grid.GridPanel({
			ds: searchds,
			renderTo: 'searchgridpanel',
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
			var xml = getPazRecord(
				id,
				// callback function for when pazpar2 returns record data
				function(data, o) {  
					var xml = xslTransform.serialize(data); 
					recordCache[o.id] = xml; 
					previewRecord(xml)  
				},
				// json literal containing hash of desired params in callback
				{
					id: id
				}
			);
			 UI.lastSearchPreviewed = xml;
		}); // rowselect
		searchgrid.on('celldblclick', function(searchgrid, rowIndex, colIndex,  e) {
			var id = searchgrid.getSelections()[0].id;
			var loc = searchgrid.getSelections()[0].data.location;
			getRemoteRecord(id, loc, function(data) { openRecord( xslTransform.serialize( data) ) }
	);
		}); // cell dbl click
		searchgrid.on('keypress', function( e ) {
		  if( e.getKey() == Ext.EventObject.ENTER ) {
			var id = searchgrid.getSelections()[0].id;
			var loc = searchgrid.getSelections()[0].data.location;
			  getRemoteRecord(id, loc, function(data) { openRecord( xslTransform.serialize( data) ) });
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
    // public space
    return {
        // public properties, e.g. strings to translate
		viewport : this.viewport,

        // public methods
        init: function() {
            this.viewport = new Ext.Viewport({
				layout: 'border',
				items: [
					{
						region: 'north',
						layout: 'border',
						items: [
							{
								region: 'center'
							},
							{
								region: 'west'
							},
							{
								region: 'east'
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
													new Ext.grid.GridPanel({
														region: 'center',
														id: 'searchgrid',
														store : new Ext.data.Store({
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
														}), // data store search grid
														cm : new Ext.grid.ColumnModel([
															{header: "Medium", width: 50, dataIndex: 'medium'},
															{header: "Title", width: 180, dataIndex: 'title'},
															{header: "Author", width: 120, dataIndex: 'title-responsibility'},
															{header: "Publisher", width: 120, dataIndex: 'publication'},
															{header: "Date", width: 50, dataIndex: 'date'},
															{header: "Location", width: 100, dataIndex: 'location'}
														]), // column model for search grid
													}), // search results grid panel
											{
												region: 'center',
												id: 'editorpanel',
												layout: 'border',
												items: [
													{
														region: 'north',
														id: 'editorone'
													}, // editor north
													{
														region: 'center',
														id: 'editortwo'
													} // editor center
												] // editor items
											}, // editor region
											{
												region: 'center',
												id: 'savefilepanel',
												layout: 'border',
												items: [
													{
														region: 'north',
														id: 'savegridpanel'
													}, // savepanel north
													{
														region: 'center',
														id: 'savegridpreview'
													} // savepanel center
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
										title: 'Resources'
									},// biblio tab west
									{
										region: 'south',
										split: true,
										collapsible: true,
										collapsed: true,
										width: 200,
										maxSize: 200,
										height: 200,
										title: 'Previews'

									}, // biblio tab south
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
			
		alert('Application successfully initialized');
        }
    };
}(); // end of app
 
