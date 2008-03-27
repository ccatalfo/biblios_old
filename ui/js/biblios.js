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
    // private variables
	Ext.get('loadingtext').update('Loading database');
	init_gears();
	var viewport; 
	var viewState = '';
	Ext.get('loadingtext').update('Setting up search session');
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

    // private functions
	displaySearchView : function displaySearchView() {
		Ext.getCmp('bibliocenter').layout.setActiveItem(0);
		Ext.getCmp('resourcesPanel').expand();
		openState = 'searchgrid';
		displayHelpMsg(UI.messages.help.en.searchview);
	}

	displaySaveFile : function displaySaveFile(id) {
		Ext.getCmp('savegrid').store.load({db: db, selectSql: savefileSelectSql + ' where Savefiles_id = '+id});
		biblios.app.displaySaveView();
		openState = 'savegrid';
		displayHelpMsg(UI.messages.help.en.saveview);
	}

	displayRecordView : function displayRecordView() {
		Ext.getCmp('bibliocenter').layout.setActiveItem(1);
		openState = 'editorPanel';
		Ext.getCmp('helpPanel').collapse();
		Ext.getCmp('resourcesPanel').collapse();
		displayHelpMsg(UI.messages.help.en.recordview);
	}

	displaySaveView: function displaySaveView() {
		Ext.getCmp('bibliocenter').layout.setActiveItem(2);
		Ext.getCmp('resourcesPanel').expand();
		openState = 'savegrid';
		displayHelpMsg(UI.messages.help.en.saveview);
	}
	
	showStatusMsg : function showStatusMsg(msg) {

	}

    // public space
    return {
        // public properties, e.g. strings to translate
		viewport : this.viewport,
		currQuery : this.currQuery,
		savefiles : this.savefiles,
		send: {
			numToSend: 0,
			sendSource: '',
			records: new Array(),
		},
		download: {
			numToExport : 0,
			exportSource: '',
			records: new Array(),
			recordsString : ''
		},
		selectedRecords: {
			selectedSource: '',
			allSelected: false,
			savefileid: ''
		},
		db : {
			selectSqlSendTargets : 'select SendTargets.rowid as rowid, name, location, url, user, password, pluginlocation, plugininit, enabled from SendTargets',
			selectSqlSearchTargets: 'select SearchTargets.rowid as rowid, name, hostname, port, dbname, description, userid, password, syntax, enabled from SearchTargets',
			selectSqlMacros: 'select Macros.rowid as rowid, name, code, hotkey, file, enabled from Macros'
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
			Ext.QuickTips.init();
			Ext.get('loadingtext').update('Setting up send targets');
			setILSTargets();
            this.viewport = new Ext.Panel({
				layout: 'border',
				renderTo: 'biblios',
				height: 600,
				width: Ext.getBody().getComputedWidth(),
				items: [
					{
						region: 'north',
						border: false,
						height: 60,
						layout: 'border',
						items: [
							{
								region: 'north',
								id: 'branding',
								border: false
							},
							{
								region: 'center',
								border: false,
								id: 'searchformpanel',
								height: 50,
								width: 100,
								style: 'padding-left: 15px;',
								contentEl: 'searchform'
							},
							{
								region: 'west',
								border: false,
								width: 170,
								html: {tag: 'img', id: 'logo', src: biblioslogo}
							},
							{
								region: 'east',
								border: false,
								width: 60,
								html: '<div id="status" ><p id="status-msg"></p></div>'
							}
						] // north region items
					}, // viewport north region
					new Ext.TabPanel({
						region: 'center',
						id: 'tabpanel',
						items: [
							{
								title: 'Biblio',
								closable: false,
								autoScroll: true,
								layout: 'border',
								id: 'bibliotab',
								listeners: {
									activate: function(p) {
										biblios.app.viewport.doLayout();
										displayHelpMsg(UI.messages.help.en.welcome);
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
														//autoWidth: true,
														id: 'searchgrid',
														store : (ds = new Ext.data.Store({
															baseParams: {
																disableCaching: false
															},
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
																			var html = '<ul class="locationlist">';
																			for( var i = 0; i < locations.length; i++) {
																				var name = Ext.DomQuery.select('@name', locations[i])[0].firstChild.nodeValue;
																				var id = Ext.DomQuery.select('@id', locations[i])[0].firstChild.nodeValue;
																				var recid = Ext.DomQuery.select('recid', rec)[0].textContent;
																				html += '<li id="loc'+i+recid+'" class="locationitem" onclick="handleLocationClick(\''+recid+'\','+i+')">';
																				html += '<input type="checkbox" class="searchgridcheckbox" id="check'+i+recid+'">';
																				html += name+'</li>';
																			}
																			html += '</ul>';
																			html += '<br/>';
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
																	Ext.getCmp('searchgridExportBtn').enable();
																	Ext.getCmp('searchgridEditBtn').enable();
																	Ext.getCmp('searchgridSendBtn').enable();
																	var id = record.id;
																	if( record.data.count > 1 ) {
																		//Ext.get('searchprevrecord').update("<p>This record is available at more than one location. <br/> Please click the plus icon to the left of this record to view locations from which the record can be previewed.<br/>  Click on a location's name to view that location's version of the record.</p>");
																	}
																	else {
																		// remove any classes from selected locations
																		Ext.select('.locationitem').removeClass('location-click');
																		showStatusMsg('Previewing...');
																		// get the marcxml for this record and send to preview()
																		previewRemoteRecord(id, 0);
																	}
																} // search grid row select handler
															} // selection listeners
														}), // search grid selecion model
														cm : new Ext.grid.ColumnModel([
															(expander = new Ext.grid.RowExpander({
																remoteDataMethod: function(record, index) {
																	$('#remData'+index).html(record.data.locationinfo);
																	// set up drag source, click/focus css and preview for each of these items
																	var locations = record.data.location;
																	var recid = record.id;
																	for( var i = 0; i < locations.length; i++) {
																		Ext.get('loc'+i+recid).dd = new Ext.dd.DragSource('loc'+i+recid, {ddGroup: 'RecordDrop'});
																		Ext.get('loc'+i+recid).addClassOnOver('location-over');
																	}
																}
															})),
															{header: "Medium", width: 50, dataIndex: 'medium'},
															{header: "Title", width: 280, dataIndex: 'title'},
															{header: "Author", width: 170, dataIndex: 'title-responsibility'},
															{header: "Publisher", width: 120, dataIndex: 'publication'},
															{header: "Date", width: 40, dataIndex: 'date'},
															{header: "Location", width: 110, dataIndex: 'location',
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
																var loc = grid.getSelections()[0].data.location[0].name;
																UI.editor['editorone'].location = loc;
																getRemoteRecord(id, loc, 0, function(data) { openRecord( xslTransform.serialize(data), 'editorone' ); }
														);

															},
															keypress: function(e) {
															  if( e.getKey() == Ext.EventObject.ENTER ) {
																var id = Ext.getCmp('searchgrid').getSelections()[0].id;
																UI.editor['editorone'].id = id;
																var loc = Ext.getCmp('searchgrid').getSelections()[0].data.location[0].name;
																UI.editor['editorone'].location = loc;
																  getRemoteRecord(id, loc, 0, function(data) { openRecord( xslTransform.serialize( data), 'editorone' ); });
																}	
															} // on ENTER keypress
														}, // search grid listeners
														tbar: new Ext.PagingToolbar({
															pageSize: 15,
															id: 'searchgridtbar',
															store: ds,
															displayInfo: true,
															displayMsg: 'Displaying records {0} - {1} of {2}',
															emptyMsg: 'No records to display',
															listeners: {
																beforerender: function(tbar) {
																	var msg = 'Select: <span class="gridselector" onclick="selectAll()">All</span>,<span class="gridselector" onclick="selectNone()">None</span>';
																	tbar.autoCreate.html = '<table cellspacing="0"><tr></tr><tr id="';
																	tbar.autoCreate.html += 'searchgridtbarinfo',
																	tbar.autoCreate.html += '">';
																	tbar.autoCreate.html += '<td>' + msg + '</td>';
																	tbar.autoCreate.html += '</tr>';
																	tbar.autoCreate.html += '<tr id="searchgridtbarSelectAll"><td class="gridselector" onclick="selectAllInObject()">Select all <span class="searchgridtotalcount">' + tbar.store.getTotalCount() + '</span> in search results.</td><td id="searchgridallSelectedStatus">All <span class="searchgridtotalcount">'+ tbar.store.getTotalCount() + '</span> are selected.  <span class="gridselector" onclick="selectNone()">Clear Selection</span></td></tr>';
																	tbar.autoCreate.html += '</table>';

																}
															},
															items: [
																{
																	id: 'newrecordbutton-search',
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
																		id: 'searchgridEditBtn',
																		disabled: true,
																		text: 'Edit',
																		handler: function() {
																			var checked = $(':checked.searchgridcheckbox');
																			if( checked.length == 0 || checked.length > 2) {
																				Ext.MessageBox.alert('Error', 'Please select 1 or 2 records to edit by checking the checkbox next to the record title, then clicking this button again.');
																				return false;
																			}
																			// mask search grid 
																			Ext.getCmp('searchgrid').el.mask('Loading record(s)');
																			for( var i = 0; i < checked.length; i++ ) {
																				var editorid = '';
																				if( i == 0 ) {
																					editorid = 'editorone';
																				}
																				else if( i == 1) {
																					editorid = 'editortwo';
																				}
																				var id = checked[i].id.substr(6);
																				var offset = checked[i].id.substr(5,1);
																				UI.editor[editorid].id = '';
																				// get location info
																				var loc = ''
																				if( $(':checked').eq(0).parents('.locationitem').length > 0 ) {
																					
																					loc = $(checked).eq(i).parents('.locationitem').text();

																				}
																				else {
																					loc = Ext.getCmp('searchgrid').store.getById(id).data.location[0].name;
																				}
																				UI.editor[editorid].location = loc;
																				getRemoteRecord(id, loc, 0, function(data) { 
																					openRecord( xslTransform.serialize(data), editorid ); 
																				});
																			} // for each checked record
																			Ext.getCmp('searchgrid').el.unmask();
																		} // search grid Edit btn handler
																	},
																	{   
																		cls: 'x-btn-text-icon bmenu', // icon and text class
																		icon: libPath + 'ui/images/network-receive.png',
																		text: 'Export',
																		id: 'searchgridExportBtn',
																		disabled: true,
																		menu: {
																			id: 'exportMenu',
																			items: getExportMenuItems()
																		}
																	},
																	{
																		cls: 'x-btn-text-icon bmenu', // icon and text class
																		icon: libPath + 'ui/images/document-save.png',
																		id: 'searchgridSendBtn',
																		disabled: true,
																		text: 'Send',
																		tooltip: {text: 'Send record to remote ILS'},
																		menu: {
																			items: getSendFileMenuItems('searchgrid'),
																			listeners: {
																				beforeshow: function(menu, menuItem, e) {
																					updateSendMenu();
																				}
																			}
																		}
																	},
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
														title: 'Editor 1',
														cls: 'marceditor',
														autoScroll: true,
														split: true,
														height: 300,
														html: '<div id="marceditorone"><div class="ffeditor"></div><div class="vareditor"></div></div>',
														tbar: (editorToolbar = [
															{
																cls: 'x-btn-text-icon',
																icon: libPath + 'ui/images/edit-copy.png',
																id: 'editortasks',
																editorid: 'editorone',
																text: 'Tools',
																tooltip: {title: 'MarcEditor tools', text: 'Add field Ctrl-n<br/>Remove field Ctrl-k<br/>Add subfield Ctrl-m<br/>Remove subfield Ctrl-d'},
																menu: {
																	id: 'editortasksmenu',
																	items: [
																		{
																			id: 'toggleFixedFieldGrid',
																			editorid: 'editorone',
																			text: 'Toggle Fixed Field Editor',
																			enableToggle: true,
																			pressed: true,
																			listeners: {
																				click: function(btn, pressed) {
																					btn.pressed = btn.pressed ? false : true;
																					toggleFixedFieldDisplay(btn, pressed);
																				}
																			}
																		},
																		{
																			id: 'addField',
																			editorid: 'editorone',
																			text: 'Add Field',
																			handler: function(btn) {
																				UI.editor.editorone.record.addField();
																			}
																		},
																		{
																			id: 'removeField',
																			editorid: 'editorone',
																			text: 'Remove Field',
																			handler: function(btn) {
																				UI.editor[btn.editorid].record.deleteField('editorone');
																			}
																		},
																		{
																			id: 'addSubfield',
																			editorid: 'editorone',
																			text: 'Add Subfield',
																			handler: function(btn) {
																				UI.editor[btn.editorid].record.addSubfield(btn.editorid);
																			}
																		},
																		{	
																			id: 'removeSubfield',
																			editorid: 'editorone',
																			text: 'Remove subfield',
																			handler: function(btn) {
																				UI.editor[btn.editorid].record.deleteSubfield(btn.editorid);
																			}
																		},
																		{
																			id: 'editorOneMacrosBtn',
																			cls: 'x-btn-text-icon bmenu',
																			text: 'Macros',
																			menu : {
																				id: 'editorOnemacrosmenu',
																				items: getMacroMenuItems(),
																				listeners: {
																					beforeshow: function(menu, menuItem, e) {
																						updateMacrosMenu();
																					}
																				}
																			}
																		}
																	]
																}
															},
															{
																cls: 'x-btn-text-icon bmenu', // icon and text class
																icon: libPath + 'ui/images/document-save.png',
																text: 'Save',
																tooltip: {title: 'Save', text: 'Ctrl-s'},
																menu: {
																	id: 'editorOneSaveMenu',
																	items: getSaveFileMenuItems('editorone'),
																	listeners: {
																		beforeshow: function(menu, menuItem, e) {
																			updateSaveMenu();
																		}
																	}
																}
															},
															{
																cls: 'x-btn-text-icon bmenu', // icon and text class
																icon: libPath + 'ui/images/document-save.png',
																text: 'Send',
																tooltip: {text: 'Send record to remote ILS'},
																menu: {
																	id: 'editorOneSendMenu',
																	editorid: 'editorone',
																	items: getSendFileMenuItems('editorone'),
																	listeners: {
																		beforeshow: function(menu, menuItem, e) {
																			updateSendMenu();
																		}
																	}
																}
															},
															{   
																cls: 'x-btn-text-icon bmenu', // icon and text class
																icon: libPath + 'ui/images/network-receive.png',
																text: 'Export',
																tooltip: {text: 'Export record to marc21 or marcxml'},
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
																tooltip: {text: 'Cancel editing of this record'},
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
																icon: libPath + 'ui/images/edit-copy.png',
																text: 'Validate',
																editorid: 'editorone',
																handler: doValidate,
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
														region: 'east',
														id: 'editortwo',
														cls: 'marceditor',
														autoScroll: true,
														split: true,
														collapsible: true,
														collapsed: true,
														title: 'Editor 2',
														width: 500,
														html: '<div id="marceditortwo"><div class="ffeditor"></div><div class="vareditor"></div></div>',
														tbar: [
															{
																cls: 'x-btn-text-icon',
																icon: libPath + 'ui/images/edit-copy.png',
																id: 'editortasks-two',
																editorid: 'editortwo',
																text: 'Tools',
																tooltip: {title: 'MarcEditor tools', text: 'Add field Ctrl-n<br/>Remove field Ctrl-k<br/>Add subfield Ctrl-m<br/>Remove subfield Ctrl-d'},
																menu: {
																	id: 'editortasksmenu',
																	items: [
																		{
																			id: 'toggleFixedFieldGrid',
																			editorid: 'editortwo',
																			text: 'Toggle Fixed Field Editor',
																			tooltip: {title: 'MarcEditor tools', text: 'Add field Ctrl-n<br/>Remove field Ctrl-k<br/>Add subfield Ctrl-m<br/>Remove subfield Ctrl-d'},
																			enableToggle: true,
																			pressed: true,
																			listeners: {
																				toggle: function(btn, pressed) {
																					toggleFixedFieldDisplay(btn, pressed);
																				}
																			}
																		},
																		{
																			id: 'addField',
																			editorid: 'editortwo',
																			text: 'Add Field',
																			handler: function(btn) {
																				UI.editor.editorone.record.addField();
																				UI.editor[btn.editorid].record.update();
																			}
																		},
																		{
																			id: 'removeField',
																			editorid: 'editortwo',
																			text: 'Remove Field',
																			handler: function(btn) {
																				UI.editor[btn.editorid].record.deleteField('editorone');
																				UI.editor[btn.editorid].record.update();
																			}
																		},
																		{
																			id: 'addSubfield',
																			editorid: 'editortwo',
																			text: 'Add Subfield',
																			handler: function(btn) {
																				UI.editor[btn.editorid].record.addSubfield(btn.editorid);
																			}
																		},
																		{	
																			id: 'removeSubfield',
																			editorid: 'editortwo',
																			text: 'Remove subfield',
																			handler: function(btn) {
																				UI.editor[btn.editorid].record.deleteSubfield(btn.editorid);
																				UI.editor[btn.editorid].record.update();
																			}
																		},
																		{
																			id: 'editorTwoMacrosBtn',
																			cls: 'x-btn-text-icon bmenu',
																			text: 'Macros',
																			menu : {
																				id: 'editorTwomacrosmenu',
																				items: getMacroMenuItems(),
																				listeners: {
																					beforeshow: function(menu, menuItem, e) {
																						updateMacrosMenu();
																					}
																				}
																			}
																		}
																	]
																}
															},
															{
																cls: 'x-btn-text-icon bmenu', // icon and text class
																icon: libPath + 'ui/images/document-save.png',
																text: 'Save',
																tooltip: {title: 'Save', text: 'Ctrl-s'},
																menu: {
																	id: 'editorTwoSaveMenu',
																	items: getSaveFileMenuItems('editortwo'),
																	listeners: {
																		beforeshow: function(menu, menuItem, e) {
																			updateSaveMenu();
																		}
																	}
																}
															},
															{
																cls: 'x-btn-text-icon bmenu', // icon and text class
																icon: libPath + 'ui/images/document-save.png',
																text: 'Send',
																tooltip: {title: 'Save', text: 'Ctrl-s'},
																menu: {
																	id: 'editorTwoSendMenu',
																	editorid: 'editortwo',
																	items: getSendFileMenuItems('editortwo'),
																	listeners: {
																		beforeshow: function(menu, menuItem, e) {
																			updateSendMenu();
																		}
																	}
																}
															},
															{   
																cls: 'x-btn-text-icon bmenu', // icon and text class
																icon: libPath + 'ui/images/network-receive.png',
																text: 'Export',
																tooltip: {text: 'Export record to marc21 or marcxml'},
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
																tooltip: {text: 'Cancel editing of this record'},
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
																		showStatusMsg('Previewing...');
																		Ext.getCmp('savegridEditBtn').enable();
																		Ext.getCmp('savegridExportBtn').enable();
																		Ext.getCmp('savegridSendBtn').enable();
																		var id = record.data.Id;
																		var xml = getLocalXml(id);
																		Ext.getCmp('savepreview').el.mask();
																		$('#saveprevrecord').getTransform(marcxsl, xml);
																		Ext.getCmp('savepreview').el.unmask();
																		clearStatusMsg();
																	}
																} // selection listeners
															}), // save grid selecion model
															cm: new Ext.grid.ColumnModel([
																{header: '', width: 20, 
																	renderer: function(data, meta, record, row, col, store) {
																	var recid = record.data.Id;
																	return '<input id="'+recid+'" class="savegridcheckbox" type="checkbox">';
																	} // renderer
																}, // checkbox 
																{header: "Medium", dataIndex: 'Medium', sortable: true},
																{header: "Title", width: 200, dataIndex: 'Title', sortable: true},
																{header: "Author", width: 160, dataIndex: 'Author', sortable: true},
																{header: "Publisher", width: 130, dataIndex: 'Publisher', sortable: true},
																{header: "DateOfPub", width: 80, dataIndex: 'DateOfPub', sortable: true},
																{header: "Status", width: 100, dataIndex: 'Status', sortable: true},
																{header: "Date Added", width: 120, dataIndex: 'Date Added', sortable: true},
																{header: "Last Modified", width: 120, dataIndex: 'Last Modified', sortable: true}
															]),
															listeners: {
																rowdblclick: function(grid, rowIndex, e) {
																	var id = grid.store.data.get(rowIndex).id;
																	showStatusMsg('Opening record...');
																	var xml = getLocalXml(id);
																	UI.editor.id = id;
																	openRecord( xml, 'editorone');
																},// save grid row dbl click handler
																keypress: function(e) {
																	if( e.getKey() == Ext.EventObject.ENTER ) {
																		showStatusMsg('Opening record...');
																		var sel = Ext.getCmp('savegrid').getSelectionModel().getSelected();
																		var id = sel.data.Id;
																		UI.editor['editorone'].id = id;
																		var xml = getLocalXml(id);
																		openRecord( xml, 'editorone' );
																	} // ENTER
																} // savegrid keypress
															}, // save grid listeners
															tbar: new Ext.PagingToolbar({
																id: 'savegridtbar',
																pageSize: 15,
																store: ds,
																displayInfo: true,
																displayMsg: 'Displaying records {0} - {1} of {2}',
																emptyMsg: 'No records to display',
																listeners: {
																	beforerender: function(tbar) {
																		var msg = 'Select: <span class="gridselector" onclick="selectAll()">All</span>,<span class="gridselector" onclick="selectNone()">None</span>';
																		tbar.autoCreate.html = '<table cellspacing="0"><tr></tr><tr id="';
																		tbar.autoCreate.html += 'savegridtbarinfo',
																		tbar.autoCreate.html += '">';
																		tbar.autoCreate.html += '<td>' + msg + '</td>';
																		tbar.autoCreate.html += '</tr>';
																		tbar.autoCreate.html += '<tr id="savegridtbarSelectAll"><td class="gridselector" onclick="selectAllInObject()">Select all <span class="savegridtotalcount">' + tbar.store.getCount() + '</span> in this folder.</td><td id="savegridallSelectedStatus">All <span class="savegridtotalcount">'+ tbar.store.getCount() + '</span> are selected.  <span class="gridselector" onclick="selectNone()">Clear Selection</span></td></tr>';
																		tbar.autoCreate.html += '</table>';
																	}
																},
																items: [
																{
																	id: 'newrecordbutton-save',
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
																		id: 'savegridEditBtn',
																		disabled: true,
																		handler: function() {
																			var checked = $(':checked.savegridcheckbox');
																			var editorid = '';
																			if( checked.length == 0 || checked.length > 2) {
																				Ext.MessageBox.alert('Error', 'Please select 1 or 2 records to edit by checking the checkbox next to the title, then click this button again.');
																			}
																			else {
																				for( var i = 0; i < checked.length; i++) {
																					if( i == 0 ) {
																						editorid = 'editorone';
																					}
																					else if( i == 1 ) {
																						editorid = 'editortwo';
																					}
																					var id = $(checked).get(i).id;
																					UI.editor[editorid].id = id;
																					Ext.getCmp('savegrid').el.mask('Loading record');
																					showStatusMsg('Opening record...');
																					var xml = getLocalXml(id);
																					openRecord( xml, editorid);
																					Ext.getCmp('savegrid').el.unmask();
																				}
																			} // 1 or 2 checkboxes are checked in save grid
																		}
																	},
																	{   
																		cls: 'x-btn-text-icon bmenu', // icon and text class
																		icon: libPath + 'ui/images/network-receive.png',
																		text: 'Export',
																		id: 'savegridExportBtn',
																		disabled: true,
																		menu: {
																			id: 'exportMenu',
																			items: getExportMenuItems()
																		}
																	},
																	{
																		id: 'savegridSendBtn',
																		cls: 'x-btn-text-icon bmenu', // icon and text class
																		icon: libPath + 'ui/images/document-save.png',
																		disabled: true,
																		text: 'Send',
																		tooltip: {text: 'Send record to remote ILS'},
																		menu: {
																			items: getSendFileMenuItems('savegrid'),
																			listeners: {
																				beforeshow: function(menu, menuItem, e) {
																					updateSendMenu();
																				}
																			}
																		}
																	},
																	{
																		id: 'savegridToolsBtn',
																		cls: 'x-btn-text-icon bmenu', // icon and text class
																		icon: libPath + 'ui/images/document-save.png',
																		disabled: false,
																		text: 'Tools',
																		tooltip: {text: 'Tools'},
																		menu: {
																			items: [
																				{
																					id: 'savegridMacrosBtn',
																					cls: 'x-btn-text-icon bmenu',
																					text: 'Macros',
																					menu : {
																						id: 'savegridmacrosmenu',
																						items: getMacroMenuItems(),
																						listeners: {
																							beforeshow: function(menu, menuItem, e) {
																								updateMacrosMenu();
																							}
																						}
																					}
																				}
																			]
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
														html: '<div id="select"></div><div id="saveprevrecord"></div>'
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
										id: 'resourcesPanel',
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
																		json += '"dbname":"'+data[i][4]+'"';
																		json += '}';
																	}
																	json += ']';
																	return json;
																}
															})
														})
													}), // resources treepanel with treeeditor applied
													new Ext.tree.TreePanel({
														id: 'facetsTreePanel',
														animate: true,
														leaf: false,
														lines: false,
														applyLoader: false,
														loader: new Ext.ux.FacetsTreeLoader({dataUrl: pazpar2url + '?session='+paz.sessionID+'&command=termlist&name=author,subject,date'}),
														root: new Ext.tree.AsyncTreeNode({
															text: 'Facets'
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
																	Ext.getCmp('savegridEditBtn').disable();
																	Ext.getCmp('savegridExportBtn').disable();
																	Ext.getCmp('savegridSendBtn').disable();
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
																			Ext.getCmp('savegridEditBtn').disable();
																			Ext.getCmp('savegridExportBtn').disable();
																			Ext.getCmp('savegridSendBtn').disable();
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
																		baseAttrs: {
																			listeners: {
																				click: function(node, e) {
																					UI.currSaveFile = node.attributes.id;
																					UI.currSaveFileName = node.text;
																					biblios.app.displaySaveFile( node.attributes.id );
																					biblios.app.displaySaveView();
																				}
																			} // save folder listeners
																		}, // inner save folder baseAttrs
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
																		} // processData for savefiles 
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
																if( node.attributes.savefileid == 1 ) {
																	var trashMenu = new Ext.menu.Menu({
																		id: 'trashMenu',
																		listeners: {
																			click: function(menu, menuItem, e) {
																				menu.hide();
																			}
																		},
																		items: [
																			{
																				id: 'emptyTrash',
																				text: 'Empty trash',
																				handler: function() {
																					DB.Records.remove('Savefiles_id=1');
																				}
																			}
																		]
																	});
																	trashMenu.showAt(e.getXY());
																}
																else {
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
																										// update our hash of savefile id/names
																										getSaveFileNames();
																										return true;
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
																		}
																		]
																	});
																	this.getSelectionModel().select(node); // displaySaveView selects root save so select the node user clicked
																	Menu.showAt(e.getXY());
																}
															} // save folder tree context menu
														}
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
																if( editorid == 'editortwo') {
																	biblios.app.displayRecordView();
																	Ext.getCmp(editorid).expand();
																}
																
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
																		UI.editor[editorid].id = '';
																		var loc = Ext.getCmp('searchgrid').getSelections()[0].data.location;
																		UI.editor[editorid].location = loc;
																		if( loc.length > 1 ) {
																			Ext.Msg.alert('Error', 'This record is available at more than one location.  Please select a location by clicking the expander button next to this record in the grid and dragging it to editor one or two.');
																			return false;
																		}
																		getRemoteRecord(id, loc, 0, function(data) { 
																			openRecord( xslTransform.serialize(data), editorid );
																		});
																	} // record from search grid
																} // if we have a grid row
																// we have a location from search grid
																else {
																	var id = e.source.id.substr(4); // "loc"+offset+recid
																	UI.editor[editorid].id = '';
																	var offset = e.source.id.substr(3); // "loc"+offset
																	var loc = $(e.source.el.dom).text(); // text of el
																	UI.editor[editorid].location = loc;
																	var record = Ext.getCmp('searchgrid').getSelections()[0];
																	getRemoteRecord(id, loc.name, offset, function(data) { 
																		openRecord( xslTransform.serialize(data), editorid ); 
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
																	leaf: true,
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
																	leaf: true,
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
										autoScroll: true,
										title: 'Help',
										id: 'helpPanel',
										items: [
											new Ext.ux.ManagedIframePanel({
												id: 'helpIframe'
											})
										]
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
												title: 'Setup',
												border: 'layout',
												html: '<input type="submit" value="Create Test Search Targets" onclick="createTestTargets(); setPazPar2Targets();"><input type="submit" value="Remove Test Search Targets" onclick="removeTestTargets(); setPazPar2Targets();"><input type="submit" value="Enable test Koha Plugin" onclick="setupKohaPlugin();">'
											}, // setup tab
											{
												title: 'Macros',
												layout: 'border',
												listeners: {
													activate: function(tab) {
														Ext.getCmp('macrosgrid').store.load({db: db, selectSql: biblios.app.db.selectSqlMacros});
													}
												}, // macros tab listeners
												items: [
													new Ext.grid.GridPanel({
														id: 'macrosgrid',
														region: 'center',
														height: 600,
														ds: new Ext.data.Store({
															proxy: new Ext.data.GoogleGearsProxy(new Array()),
															reader: new Ext.data.ArrayReader({
																record: 'name'
															}, Macro),
															remoteSort: false,
															sortInfo: {
																field: 'name',
																direction: 'ASC'
															},
															listeners: {

															}
														}),
														sm: new Ext.grid.RowSelectionModel({

														}),
														cm: new Ext.grid.ColumnModel([
															{
																header: 'Name',
																dataIndex: 'name'
															},
															{
																header: 'Code',
																dataIndex: 'code'
															},
															{
																header: 'Hotkey',
																dataIndex: 'hotkey'
															},
															{
																header: 'File',
																dataIndex: 'file'
															},
															{
																header: 'Enabled',
																dataIndex: 'enabled'
															}
														])
													}) // macros gridpanel
												] // macros grid items
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
																			if( operation == Ext.data.Record.COMMIT || operation == Ext.data.Record.EDIT) {
																				record.data.enabled = record.data.enabled ? 1 : 0;
																				try {
																					var rs = db.execute('update SearchTargets set name = ?, hostname = ?, port = ?, dbname = ?, description = ?, userid = ?, password = ?, enabled = ? where rowid = ?', [record.data.name, record.data.hostname, record.data.port, record.data.dbname, record.data.description, record.data.userid, record.data.password, record.data.enabled, record.data.rowid]);
																					rs.close();
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
																		if(field == 'enabled') {
																			value = value ? 1 : 0;
																		}
																		var rs;
																		try {
																			rs = db.execute('update SearchTargets set '+field+' = ? where SearchTargets.rowid = ?', [value, id]);
																			rs.close();
																		}
																		catch(ex) {
																			Ext.MessageBox.alert('Error', ex.message);
																		}
																		setPazPar2Targets();

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
																		text: 'Add Search Target',
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
																		text: 'Remove Search Target',
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
																		if( record.data.enabled == true) {
																			record.data.enabled = 1;
																		}
																		else if( record.data.enabled == false) {
																			record.data.enabled = 0;
																		}
																		if( operation == Ext.data.Record.COMMIT || operation == Ext.data.Record.EDIT ) {
																			try {
																				var rs = db.execute('update SendTargets set name = ?, location = ?, user= ?, password = ?, pluginlocation = ?, plugininit= ?, enabled = ? where rowid = ?', [record.data.name, record.data.location, record.data.user, record.data.password, record.data.pluginlocation, record.data.plugininit, record.data.enabled, record.data.rowid]);
																				rs.close();
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
																		if( e.field == 'enabled' ) {
																			if( value == true ) {
																				value = 1;
																			}
																			else if( value == false ) {
																				value = 0;
																			}
																		}
																		var rs;
																		try {
																			rs = db.execute('update SendTargets set '+field+' = ? where SendTargets.rowid = ?', [value, id]);
																			rs.close();
																		}
																		catch(ex) {
																			Ext.MessageBox.alert('Error', ex.message);
																		}
																		e.grid.store.load({db: db, selectSql: 'select SendTargets.rowid as rowid, name, location, url, user, password, pluginlocation, plugininit, enabled from SendTargets'});
																		setILSTargets();
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
																				rowid: db.lastInsertRowId,
																				name: '',
																				location: '',
																				url: '',
																				user: '',
																				password: '',
																				pluginlocation: 'plugins/koha.js',
																				plugininit: 'new koha()',
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
																		text: 'Remove Send Target',
																		handler: function() {
																			var records = Ext.ComponentMgr.get('sendtargetsgrid').getSelections();
																			for( var i = 0; i < records.length; i++) {
																				try {
																					DB.SendTargets.select('SendTargets.rowid=?', [records[i].data.rowid]).getOne().remove();
																					// remove from Prefs hash
																					delete Prefs.remoteILS[ records[i].data.location ];
																				}
																				catch(ex) {
																					Ext.MessageBox.alert('Error', ex.message);
																				}
																			}
																			Ext.ComponentMgr.get('sendtargetsgrid').store.reload();
																		}
																	}, // send grid remove target tb button
																	{
																		text: 'Test Connection',
																		handler: function() {
																			var sel = Ext.getCmp('sendtargetsgrid').getSelections();
																			if(sel.length > 1 ) {
																				Ext.MessageBox.alert('Error', 'Please select just 1 Send Target to test');
																				return false;
																			}
																			var record = sel[0];
																			if( record.data.url == '' || record.data.pluginlocation == '' || record.data.plugininit == '' ) {
																				Ext.MessageBox.alert('Error', 'Please enter at least url, plugin location and plugin init to test this connection');
																				return false;
																			}
																			var initcall = record.data.plugininit;
																			var instance = eval( initcall );
																			instance.init( record.data.url, record.data.user, record.data.password);
																			instance.initHandler = function(sessionStatus) {
																				if( sessionStatus != 'ok' ) {
																					Ext.MessageBox.alert('Connection error', 'Authentication to Koha server at ' + this.url + ' failed.  Response: ' + sessionStatus + '.');
																				}
																				else {
																					Ext.MessageBox.alert('Connection successful', 'Authentication to Koha server at ' + this.url + ' was successful.  Response: ' + sessionStatus + '.');

																				}
																			};
																		}
																	}
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
			editDelay: 100,
			id: 'saveTreeEditor'
		});
		treeEditor.on('complete', function(editor, value, startValue) {
					var n = Ext.getCmp('FoldersTreePanel').getSelectionModel().getSelectedNode();
					var folder = DB.Savefiles.select('Savefiles.rowid=?', [n.attributes.id]).getOne();
					folder.name = value;
					folder.save();
		});

		treeEditor.render();
		Ext.get('loadingtext').update('Finishing initializing');
		//	alert('Application successfully initialized');
		var loading = Ext.get('loading');

		var mask = Ext.get('loading-mask');

		mask.setOpacity(.8);

		mask.shift({

			xy:loading.getXY(),

			width:loading.getWidth(),

			height:loading.getHeight(),

			remove:true,

			duration:1,

			opacity:.3,

			easing:'bounceOut',

			callback : function(){

				loading.fadeOut({duration:.2,remove:true});

			}
		});

		Ext.getCmp('tabpanel').activate(0);
        } // end of init method
    }; // end of public biblios.app space
}(); // end of app
 
