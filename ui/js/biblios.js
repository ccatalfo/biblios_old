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

	var viewport; 
	var viewState = '';
	// save file vars
	var currSaveFile, currSaveFileName;
	var savefiles = {}; // hash mapping save file id -> names

	// editor
	var editor = {};
	editor.record = {};
	var savefileSelectSql = 'SELECT Records.rowid as Id, Records.title as Title, Records.author as Author, Records.date as DateOfPub, Records.location as Location, Records.publisher as Publisher, Records.medium as Medium, Records.xml as xml, Records.status as Status, Records.date_added as DateAdded, Records.date_modified as DateModified, Records.xmlformat as xmlformat, Records.marcflavour as marcflavour, Records.template as template, Records.marcformat as marcformat, Records.Savefiles_id as Savefiles_id, Records.SearchTargets_id as SearchTargets_id FROM Records';
    // private functions
	function displaySearchView() {
        if( Ext.getCmp('searchgrid').store.getCount() == 0 ) {
            Ext.getCmp('splashpanel').getEl().update(searchingsplash);
            Ext.getCmp('bibliocenter').layout.setActiveItem(3);
        }
        else {
            Ext.getCmp('bibliocenter').layout.setActiveItem(0);
            Ext.getCmp('resourcesPanel').expand();
            openState = 'searchgrid';
            displayHelpMsg(UI.messages.help.en.searchview);
            Ext.getCmp('FoldersTreePanel').getSelectionModel().clearSelections();
        }
	}

	function displaySaveFile(id) {
        Ext.getCmp('savegridSelectAllTbar').hide();
		if( (biblios.app.selectedRecords.savefileid == id) && (biblios.app.selectedRecords.loading == true) ) {
			Ext.getCmp('savegrid').el.mask('Loading remote records...');
		}
		else {
			Ext.getCmp('savegrid').el.unmask();
		}
		Ext.getCmp('savegrid').store.load({db: db, selectSql: savefileSelectSql + ' where Savefiles_id = '+id, params:{start:0,limit:15}});
        if( Ext.getCmp('savegrid').store.getCount() > 0 ) {
            Ext.getCmp('savegridSelectAllTbar').show();
        }

		biblios.app.displaySaveView();
		Ext.getCmp('savegrid').selectNone();
		openState = 'savegrid';
		displayHelpMsg(UI.messages.help.en.saveview);
	}

	function displayRecordView() {
        if( Ext.getCmp('editorTabPanel').items.length == 0 ) {
            Ext.getCmp('splashpanel').getEl().update(editingsplash);
            Ext.getCmp('bibliocenter').layout.setActiveItem(3);
        }
        else {
            Ext.getCmp('bibliocenter').layout.setActiveItem(1);
        }
		openState = 'editorPanel';
		//Ext.getCmp('helpPanel').collapse();
		//Ext.getCmp('resourcesPanel').collapse();
		displayHelpMsg(UI.messages.help.en.recordview);
        Ext.getCmp('FoldersTreePanel').getSelectionModel().clearSelections();
        Ext.getCmp('TargetsTreePanel').getSelectionModel().clearSelections();
	}

	function displaySaveView() {
		Ext.getCmp('bibliocenter').layout.setActiveItem(2);
		Ext.getCmp('resourcesPanel').expand();
        Ext.get('saveprevrecord').update('');
		openState = 'savegrid';
		displayHelpMsg(UI.messages.help.en.saveview);
        Ext.getCmp('TargetsTreePanel').getSelectionModel().clearSelections();
	}
	
	function showStatusMsg(msg) {

	}

    function runSearch(searchWhere, searchType, searchQuery) {
        doSearch(searchWhere, searchType, searchQuery);
    }

    // public space
    return Ext.apply(new Ext.util.Observable(), {
        // public properties, e.g. strings to translate
		viewport : this.viewport,
		currQuery : this.currQuery,
		savefiles : this.savefiles,
        initerrors: new Array(),
        paz : {
            sessionID : '',
            query : '',
            settings : { 

            },
            record : {

            },
            records : {


            },
            start : 0,
            num: 15,
            filter: '',
            sort: 'relevance'
        },
        pazpar2debug : 0,
		send: {
			numToSend: 0,
			sendSource: '',
			records: new Array()
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
			savefileid: '',
			loading: false,
			numToGet: 0
		},
		db : {
			selectSqlSendTargets : 'select SendTargets.rowid as rowid, name, location, url, user, password, plugin, enabled, searchtarget from SendTargets',
			selectSqlSearchTargets: 'select SearchTargets.rowid as rowid, name, hostname, port, dbname, description, userid, password, syntax, enabled, pazpar2settings from SearchTargets',
			selectSqlMacros: 'select Macros.rowid as rowid, name, code, hotkey, file, enabled from Macros',
            handle: db,
            selectSqlPlugins: 'select Plugins.rowid as rowid, name, file, type, initcall, enabled from Plugins'
		},
		
        // public methods
        search : function(searchWhere, searchQuery) {
            if( this.fireEvent('beforesearch', searchWhere, searchQuery) ) {
                //runSearch(searchWhere, searchQuery);
            }
        },
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
            if( Ext.isSafari || Ext.isOpera || Ext.isLinux) {
                Ext.get('biblios').update('<p>Your web browser, Safari, is not yet supported by Google Gears.  Please use Firefox or Internet Explorer to access.</p>'); 
            }
            else {
                if( Ext.get('loadingtext') ) {
                    Ext.get('loadingtext').update('Loading database');
                }
                init_gears();
                if( Ext.get('loadingtext') ) {
                    Ext.get('loadingtext').update('Loading settings');
                }
                loadConfig(confPath, function() {
                    biblios.app.initUI();
                    initPazPar2(pazpar2url);
                    loadPlugins();
                });
            }
        }, 

        initUI: function() {
			Ext.QuickTips.init();
			this.facetsTreeLoader = new Ext.ux.FacetsTreeLoader({dataUrl: pazcgiurl});
            this.facetsTreeLoader.on('beforeload', function(treeloader, node) {
                treeloader.baseParams.action = 'termlist';
                treeloader.baseParams.name = 'author,publication-name,subject,date';
            });
            this.facetsTreeLoader.on('load', function(treeloader, node, response) {
                
            });
            this.viewport = new Ext.Viewport({
				layout: 'fit',
                border: false,
				items: [
                    new Ext.Panel({
                        layout: 'border',
                        border: false,
                        applyTo:'biblios',
                        id: 'innerBibliosPanel',
                        items: [
                            {
                                region: 'north',
                                border: false,
                                layout: 'border',
                                height: 60,
                                items: [
                                    {
                                        region: 'north',
                                        id: 'brandingPanel',
                                        border: false,
                                        contentEl: 'bibliosheader',
                                        width:'100%'
                                    },
                                    {
                                        region: 'center',
                                        border: false,
                                        height: 40,
                                        style:'padding-bottom: 5px; padding-top:5px',
                                        html: {
                                            tag:'div',
                                            style:'float:right;',
                                            id: 'status',
                                            width: 30,
                                            children: [
                                                {
                                                    tag:'p',
                                                    id:'status-msg'
                                                }
                                            ]
                                        }
                                    }
                                ] // north region items
                            }, // viewport north region
                            new Ext.TabPanel({
                                region: 'center',
                                id: 'tabpanel',
                                items: [
                                    {
                                        title: 'Bibliographic',
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
                                        tbar: [
                                            {
                                                text: 'Enter a search term:'
                                            },
                                            new Ext.form.TextField({
                                                id:'query',
                                                width: 200,
                                                name:'query',
                                                border:false,
                                                enableKeyEvents:true,
                                                listeners: {
                                                    keypress: function(formfield, e) {
                                                        if( e.getKey() == Ext.EventObject.ENTER ) {
                                                            doSearch();
                                                        }
                                                    }
                                                }
                                            }),
                                            {
                                                text: '  '
                                            },
                                            new Ext.form.ComboBox({
                                                id:'searchtypeCombo',
                                                store: new Ext.data.SimpleStore({
                                                    fields: ['abbr', 'full'],
                                                    data: [['kw','Keyword'],['ti','Title'],['au','Author'],['su','Subject'],['isbn','ISBN'],['issn','ISSN'],['','Advanced']]
                                                }),
                                                border:false,
                                                value:'',
                                                hideLabel:true,
                                                displayField:'full',
                                                valueField:'abbr',
                                                typeAhead:true,
                                                mode:'local',
                                                forceSelection:true,
                                                triggerAction:'all'
                                            }),
                                            '-',
                                            {
                                                text: '  '
                                            },
                                            new Ext.Button({
                                                border:false,
                                                id:'searchButton',
                                                disabled:true,
                                                hideLabel:true,
                                                text:'Search',
                                                handler: function() {
                                                    doSearch();
                                                }
                                            }),
                                            '-',
                                            {
                                                text: '  '
                                            },
                                            new Ext.form.ComboBox({
                                                id:'searchlocCombo',
                                                store: new Ext.data.SimpleStore({
                                                    fields: ['abbr', 'full'],
                                                    data: [['Remote','Remote'],['Local','Local'],['All','All']]
                                                }),
                                                border:false,
                                                value:'Remote',
                                                hideLabel:true,
                                                displayField:'full',
                                                valueField:'abbr',
                                                typeAhead:true,
                                                mode:'local',
                                                forceSelection:true,
                                                triggerAction:'all'
                                            })
                                        ],
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
                                                                loadMask: true,
                                                                id: 'searchgrid',
                                                                store : (ds = new Ext.data.GroupingStore({
                                                                    groupField:'recid',
                                                                    remoteGroup:false,
                                                                    remoteSort:true,
                                                                    baseParams: {
                                                                        disableCaching: false,
                                                                        action: 'show'
                                                                    },
                                                                    proxy: new Ext.data.HttpProxy({url: pazcgiurl}),
                                                                    reader: 
                                                                        new Ext.data.JsonReader({
                                                                            totalProperty: 'merged',
                                                                            merged: 'merged',
                                                                            totalrecords: 'totalrecords',
                                                                            num: 'num',
                                                                            root: 'hits',
                                                                            activeclients: 'activeclients'
                                                                        }, PazPar2Results // search grid record
                                                                        ),//search grid reader
                                                                    remoteSort: true,
                                                                    listeners: {
                                                                        beforeload: function(store, options) {
                                                                            
                                                                        },
                                                                        loadexception: function(proxy, options, response, e) {
                                                                            Ext.Msg.alert('Search error', 'Error: ' +response.status + ' ' + response.responseText );
                                                                            Ext.getCmp('searchgrid').getGridEl().unmask();
                                                                        },
                                                                        load: function(store, records, options) {
                                                                            biblios.app.displaySearchView();
                                                                            refreshTargetHits();
                                                                            var activeclients = store.reader.jsonData.activeclients;
                                                                            if( activeclients == '0' ) {
                                                                                clearStatusMsg();
                                                                                Ext.getCmp('searchgrid').getGridEl().unmask()
                                                                                Ext.getCmp('facetsTreePanel').root.reload();
                                                                                Ext.getCmp('searchgridSelectAllTbar').show();
                                                                                Ext.getCmp('facetsTreePanel').show();
                                                                                Ext.getCmp('facetsTreePanel').root.reload();
                                                                                //this.selectNone();
                                                                            }
                                                                            else {
                                                                                // reload after 1s
                                                                                setTimeout( function() {
                                                                                    Ext.getCmp('searchgrid').store.reload();
                                                                                }, 1000);
                                                                            }
                                                                        }
                                                                    } // searchgrid listeners
                                                                })), // data store search grid aka ds
                                                                
                                                                view: new Ext.grid.GroupingView({
                                                                    forceFit:true
                                                                    ,groupTextTpl:
                                                                        '<table class="x-grid3-row-table">'
                                                                        + '<tbody>'
                                                                        + '<tr>' 

                                                                        + '<td class="x-grid3-col x-grid3-cell x-grid3-td-1 groupingMedium" width="49">'
                                                                        + '{[ values.rs[0].data.medium ]}' 
                                                                        + '</td>'
                                                                        
                                                                        + '<td class="x-grid3-col x-grid3-cell x-grid3-td-2 groupingTitle" width="222">'
                                                                        + '{[ values.rs[0].data.title ]}'
                                                                        + '</td>'

                                                                        + '<td class="x-grid3-col x-grid3-cell x-grid3-td-3 groupingAuthor" width="275">'
                                                                        + '{[ values.rs[0].data.author ]}'
                                                                        + '</td>'

                                                                        /*+ '<td class="x-grid3-col x-grid3-cell x-grid3-td-5">'
                                                                        + '{[ values.rs[0].data.date ]}'
                                                                        + '</td>'*/

                                                                        + '<td class="x-grid3-col x-grid3-cell x-grid3-td-5 groupingCount">'
                                                                        + '{[ values.rs[0].data.count ]} record(s)'
                                                                        + '</td>'

                                                                        + '</tr>'
                                                                        + '</tbody>'
                                                                        + '</table>'
                                                                    
                                                                    ,groupRenderer: function(v, unused,r, rowIndex, colIndex,ds) {
                                                                        return v;
                                                                    },
                                                                    showGroupName:true,
                                                                    header: 'title:'
                                                                   
                                                              }),
                                                            sm: (sm = new Ext.grid.SmartCheckboxSelectionModel({
                                                                    //singleSelect: false,
                                                                    alwaysSelectOnCheck: true,
                                                                    email: true,
                                                                    dataIndex: 'checked',
                                                                    header: '',
                                                                    listeners: {
                                                                        rowselect: function(selmodel, rowindex, record) {
                                                                            Ext.getCmp('searchgridExportBtn').enable();
                                                                            Ext.getCmp('searchgridEditBtn').enable();
                                                                            Ext.getCmp('searchgridSendBtn').enable();
                                                                            Ext.getCmp('searchgridSaveBtn').enable();
                                                                            Ext.getCmp('searchgridToolsBtn').enable();
                                                                            showStatusMsg('Previewing...');
                                                                            // get the marcxml for this record and send to preview()
                                                                            var xmlstring = record.data.fullrecord;		
                                                                            if(bibliosdebug) {
                                                                                console.info(xmlstring);
                                                                            }																
                                                                            var xml = xslTransform.loadString(xmlstring);
                                                                            previewRemoteRecord(xml);																			
                                                                        } // search grid row select handler
                                                                    } // selection listeners
                                                                })), // search grid selecion model		
                                                                cm : new Ext.grid.ColumnModel([			
                                                                    sm,																					
                                                                    {header: "Medium", width: 50, dataIndex: 'medium'},
                                                                    {header: "Title", sortable: true, width: 280, dataIndex: 'title'},
                                                                    {header: "Author", sortable: true, width: 170, dataIndex: 'author'},
                                                                    {header: "Publisher", sortable: true, width: 120, dataIndex: 'publisher'},
                                                                    {header: "Date", sortable: true, width: 40, dataIndex: 'date'},
                                                                    {header: "Location", sortable: true, width: 110, dataIndex: 'location_name'},
                                                                    {header: "Location Id", hidden: true, sortable: true, width: 110, dataIndex: 'location_id'
                                                                    }, // Location column
                                                                    {header: "recid", id: 'recid', width: 30, hidden:true, dataIndex:'recid'},
                                                                    {header: "id", id: 'id', width: 30, hidden:true, dataIndex:'id'},
                                                                    {header: 'Full record', id:'fullrecord', hidden:true, dataIndex:'fullrecord'}
                                                                ]), // column model for search grid
                                                                //plugins: expander, // search grid plugins
                                                                isAllSearchSelected: false,
                                                                checkAllSearchResults: function() {
                                                                    Ext.getCmp('searchgrid').getSelectionModel().checkAllInStore();
                                                                    Ext.getCmp('searchgrid').store.un('load', Ext.getCmp('searchgrid').checkAllSearchResults);
                                                                    Ext.getCmp('searchgrid').getGridEl().unmask();
                                                                    Ext.getCmp('searchgridSelectAllInStoreTbar').items.items[0].getEl().update('All ' + Ext.getCmp('searchgrid').store.reader.jsonData.totalrecords + ' records in this search are selected.  <a href="#" onclick="Ext.getCmp(\'searchgrid\').selectNone()">Clear selection</a>');
                                                                    Ext.getCmp('searchgrid').isAllSearchSelected = true;
                                                                },
                                                                loadAllSearchResults: function() {
                                                                    var totalcount = this.store.getTotalCount();
                                                                    this.store.on('load', this.checkAllSearchResults);
                                                                    this.getGridEl().mask();
                                                                    this.store.load({params:{start:0, limit:totalcount}});
                                                                },
                                                                selectAll: function() {
                                                                    this.getSelectionModel().checkAllInStore();
                                                                    Ext.getCmp('searchgridSelectAllInStoreTbar').show();
                                                                    Ext.getCmp('searchgridSelectAllInStoreTbar').items.items[0].getEl().update('You have selected all ' + this.store.getCount() + ' records on this page.'  + '<a href="#" onclick="Ext.getCmp(\'searchgrid\').loadAllSearchResults()">Select all ' + this.store.reader.jsonData.totalrecords + ' records in this search</a>');
                                                                    Ext.getCmp('searchgridExportBtn').enable();
                                                                    Ext.getCmp('searchgridToolsBtn').enable();
                                                                    Ext.getCmp('searchgridSendBtn').enable();
                                                                    Ext.getCmp('searchgridSaveBtn').enable();
                                                                    Ext.getCmp('searchgridEditBtn').enable();
                                                                },
                                                                selectNone: function() {
                                                                    this.getSelectionModel().clearSelections();
                                                                    this.getSelectionModel().clearChecked();
                                                                    this.isAllSearchSelected = false;
                                                                    Ext.getCmp('searchgridSelectAllInStoreTbar').hide();
                                                                    Ext.getCmp('searchgridExportBtn').disable();
                                                                    Ext.getCmp('searchgridToolsBtn').disable();
                                                                    Ext.getCmp('searchgridSendBtn').disable();
                                                                    Ext.getCmp('searchgridSaveBtn').disable();
                                                                    Ext.getCmp('searchgridEditBtn').disable();
                                                                },
                                                                editRecord: function(rec) {
                                                                    var xml = rec.data.fullrecord;	
                                                                    var xmlformat = 'marcxml';
                                                                    var loc = rec.data.location_name;
                                                                    var id = rec.id;	
                                                                    biblios.app.fireEvent('remoterecordretrieve', rec.data.fullrecord);
                                                                    openRecord( xml, '', xmlformat, '',loc ); 
                                                                },
                                                                listeners: {
                                                                    render: function(grid) {
                                                                        var checkboxWidth = grid.getColumnModel().getColumnWidth(0);
                                                                        var mediumWidth = grid.getColumnModel().getColumnWidth(1);
                                                                        var titleWidth = grid.getColumnModel().getColumnWidth(2);
                                                                        var authorWidth = grid.getColumnModel().getColumnWidth(3);
                                                                        var publisherWidth = grid.getColumnModel().getColumnWidth(4);
                                                                        var dateWidth = grid.getColumnModel().getColumnWidth(5);
                                                                        var locationWidth = grid.getColumnModel().getColumnWidth(6);
                                                                        $('.groupingMedium').css('width', checkboxWidth + mediumWidth);
                                                                        $('.groupingTitle').css('width', titleWidth);
                                                                        $('.groupingAuthor').css('width', authorWidth);
                                                                        $('.groupingLocation').css('width', publisherWidth + dateWidth + locationWidth);
                                                                        var selectAllTbar = new Ext.Toolbar({
                                                                            id: 'searchgridSelectAllTbar',
                                                                            hidden: true,
                                                                            renderTo: this.tbar,
                                                                            items: [
                                                                                {
                                                                                    id: 'searchgridselectall',
                                                                                    xtype: 'tbtext',
                                                                                    text: 'Select <a href="#" onclick="Ext.getCmp(\'searchgrid\').selectAll()">All</a>,' + '<a href="#" onclick="Ext.getCmp(\'searchgrid\').selectNone()">None</a>'
                                                                                }
                                                                                
                                                                            ]
                                                                        });
                                                                        var selectAllInStore = new Ext.Toolbar({
                                                                            id: 'searchgridSelectAllInStoreTbar',
                                                                            hidden: true,
                                                                            renderTo: this.tbar,
                                                                            items: [
                                                                                {
                                                                                    id: 'searchgridselectallfrompz2',
                                                                                    xtype:'tbtext',
                                                                                    text: "You have selected all" + Ext.getCmp('searchgrid').getSelectionModel().getChecked() + " records on this page."
                                                                                }
                                                                            ]
                                                                        });
                                                                        this.syncSize();
                                                                    }, // search grid render listener
                                                                    
                                                                    headerclick: function(grid, colIndex, event) {
                                                                        var colName = grid.getColumnModel().getColumnById(colIndex).dataIndex;
                                                                        var reqName = '';
                                                                        var dir = UI.search.currentSort.dir ? 0 : 1; 
                                                                        switch(colName) {
                                                                            case 'title':
                                                                                reqName = 'title';
                                                                                break;
                                                                            case 'author':
                                                                                reqName = 'author';
                                                                                break;
                                                                            case 'publisher':
                                                                                reqName = 'publication-name';
                                                                                break;
                                                                            case 'date':
                                                                                reqName = 'date';
                                                                                break;
                                                                        }
                                                                        UI.search.currentSort.field = reqName;
                                                                        UI.search.currentSort.dir = dir;
                                                                        var start = Ext.getCmp('searchgrid').store.lastOptions.params ? Ext.getCmp('searchgrid').store.lastOptions.params.start : 0;
                                                                        Ext.getCmp('searchgrid').store.load({params:{ start: start, limit: 15, sort: reqName + ':' + dir}});
                                                                        return false;
                                                                    }, // headerclick handler
                                                                    rowdblclick: function(grid, rowindex, e) {
                                                                        var record = grid.getSelections()[0];
                                                                        var id = record.id;
                                                                        var loc = record.data.location[0].name;
                                                                        var xmlformat = 'marcxml';
                                                                        biblios.app.fireEvent('remoterecordretrieve', record.data.fullrecord);
                                                                        openRecord( record.data.fullrecord,  '', xmlformat, '' ); 
                                                                    },
                                                                    keypress: function(e) {
                                                                      if( e.getKey() == Ext.EventObject.ENTER ) {
                                                                        var record = Ext.getCmp('searchgrid').getSelections()[0];
                                                                        var loc = record.data.location[0].name;
                                                                        var xmlformat = 'marcxml';
                                                                          
                                                                        biblios.app.fireEvent('remoterecordretrieve', record.data.fullrecord);
                                                                        openRecord( record.data.fullrecord,  '', xmlformat, ''); 
                                                                            
                                                                        }	
                                                                    } // on ENTER keypress
                                                                }, // search grid listeners
                                                                tbar: new Ext.ux.ImprovedPagingToolbar({
                                                                    pageSize: 15,
                                                                    id: 'searchgridtbar',
                                                                    unmergedCounts: [
                                                                        {
                                                                            start:0,
                                                                            end: 0
                                                                        }
                                                                    ],
                                                                    store: ds,
                                                                    displayInfo: true,
                                                                    displayMsg: '{0} - {1} of {2} (de-duplicated) {3} - {4} of {5} (records)',
                                                                    msgFormatFunc: function() {
                                                                        var count = this.store.getCount(); 
                                                                        var mergedStart = (this.current * this.pageSize) + 1;
                                                                        var mergedEnd = (this.current * this.pageSize) + parseInt(this.store.reader.jsonData.num);
                                                                        var mergedTotal = this.store.reader.jsonData.merged;
                                                                        var unmergedStart = this.unmergedCounts[this.current].start;
                                                                        var unmergedEnd = this.unmergedCounts[this.current].end;
                                                                        var unmergedTotal = this.store.reader.jsonData.totalrecords;
                                                                        return String.format(this.displayMsg, mergedStart, mergedEnd, mergedTotal, unmergedStart, unmergedEnd, unmergedTotal)
                                                                    },
                                                                    emptyMsg: 'No records to display',
                                                                    listeners: {
                                                                        beforerender: function(tbar) {
                                                                            

                                                                        },
                                                                        beforepagechange: function(tbar, start) {
                                                                        },//searchgrid paging tbar beforepagechange
                                                                        pagechange: function(tbar, page) {
                                                                                    var currentPage = page;
                                                                                    if(bibliosdebug){
                                                                                        console.debug('searchgrid paging tbar setting for ' + currentPage);
                                                                                    }
                                                                                    var start = 0;
                                                                                    if( currentPage == 0 ) {
                                                                                        start = 1;
                                                                                        tbar.unmergedCounts[currentPage] = {
                                                                                            start: start,        
                                                                                            end: tbar.store.getCount()
                                                                                        }
                                                                                    }
                                                                                    else {
                                                                                        if( tbar.unmergedCounts[currentPage-1] ) {
                                                                                            start = tbar.unmergedCounts[currentPage-1].end;
                                                                                        }
                                                                                        else {
                                                                                            start = page*this.pageSize;
                                                                                        }
                                                                                        tbar.unmergedCounts[currentPage] = {
                                                                                            start: start+1,
                                                                                            end: start+tbar.store.getCount()
                                                                                        }
                                                                                    }
                                                                        }
                                                                    },
                                                                    items: [
                                                                        {
                                                                            cls: 'x-btn-text-icon',
                                                                            icon: libPath + 'ui/images/toolbar/'+$('//ui/icons/toolbar/edit', configDoc).text(),
                                                                            id: 'searchgridEditBtn',
                                                                            disabled: true,
                                                                            text: 'Edit',
                                                                            handler: function() {
                                                                                var searchgrid = Ext.getCmp('searchgrid');
                                                                                var checked = searchgrid.getSelectionModel().getChecked();
                                                                                var selections = searchgrid.getSelectionModel().getSelections();
                                                                                
                                                                                if(checked.length>0 && checked.length<11) {
                                                                                    UI.editor.loading.numToLoad = checked.length;
                                                                                    for( var i = 0; i < checked.length; i++ ) {
                                                                                        searchgrid.editRecord( checked[i] ); 
                                                                                    } // for each checked record
                                                                                }
                                                                                else if( checked.length > 10 ) {
                                                                                    Ext.Msg.alert('Editing error', 'Please select at most 10 records to open simultaneously');
                                                                                    return false;
                                                                                }
                                                                                else if(selections.length > 0 ) {
                                                                                    UI.editor.loading.numToLoad = selections.length;
                                                                                    for( var j = 0; j < selections.length; j++ ) {
                                                                                        searchgrid.editRecord( selections[j] ); 
                                                                                    } // for each checked record
                                                                                }
                                                                                else if( checked.length == 0 && selections.length == 0){
                                                                                    Ext.Msg.alert('Editing', 'Please select a record or records to edit by clicking a row or by checking checkboxes next to records you want to edit');
                                                                                    return false;

                                                                                }
                                                                                UI.editor.loading.numLoaded = 0;
                                                                                    
                                                                                UI.editor.progress = Ext.Msg.progress(
                                                                                    'Loading records',
                                                                                    'Retrieving and formatting records',
                                                                                    '0%'
                                                                                );
                                                                            } // search grid Edit btn handler
                                                                        }, // search grid Edit button
                                                                        {
                                                                            cls:'x-btn-text-icon',
                                                                            icon: libPath + 'ui/images/toolbar/'+$('//ui/icons/toolbar/tools', configDoc).text(),
                                                                            id:'searchgridToolsBtn',
                                                                            disabled:true,
                                                                            text:'Tools',
                                                                            menu: 
                                                                                {
                                                                                    items: [
                                                                                                                                                                                {   
                                                                                            cls: 'x-btn-text-icon bmenu', // icon and text class
                                                                                            icon:libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/export', configDoc).text(),
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
                                                                                            icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/send', configDoc).text(),
                                                                                            id: 'searchgridSendBtn',
                                                                                            disabled: true,
                                                                                            text: 'Send',
                                                                                            tooltip: {text: 'Send record to remote target'},
                                                                                            menu: {
                                                                                                items: getSendFileMenuItems('searchgrid'),
                                                                                                listeners: {
                                                                                                    beforeshow: function(menu, menuItem, e) {
                                                                                                        updateSendMenu(menu, 'searchgrid');
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        },
                                                                                        {
                                                                                            cls: 'x-btn-text-icon bmenu', // icon and text class
                                                                                            icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/save', configDoc).text(),
                                                                                            text: 'Save',
                                                                                            id: 'searchgridSaveBtn',
                                                                                            disabled: true,
                                                                                            tooltip: {title: 'Save', text: 'Ctrl-s'},
                                                                                            menu: {
                                                                                                id: 'searchgridSaveMenu',
                                                                                                items: getSaveFileMenuItems('searchgrid'),
                                                                                                listeners: {
                                                                                                    beforeshow: function(menu, menuItem, e) {
                                                                                                        updateSaveMenu(menu, 'searchgrid');
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    ] // search grid tools menu items
                                                                                } // search grid tools menu
                                                                            }, // search grid tools button
                                                                            {
                                                                                id: 'searchgridUploadsBtn',
                                                                                cls: 'x-btn-text-icon bmenu',
                                                                                icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/upload', configDoc).text(),
                                                                                text: 'Upload',
                                                                                tooltip: {text: 'Upload marc21 or marcxml files'},
                                                                                menu: [
                                                                                    {
                                                                                        id: 'marc21uploadBtn',
                                                                                        text: 'MARC21',
                                                                                        handler: function() {
                                                                                            showUploadDialog('marc21')
                                                                                        }
                                                                                    },
                                                                                    {
                                                                                        id: 'marcxmluploadBtn',
                                                                                        text: 'MARCXML',
                                                                                        handler: function() {
                                                                                            showUploadDialog('marcxml')
                                                                                        }
                                                                                    }
                                                                                ]
                                                                            } // uploads menu
                                                                            
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
                                                            new Ext.TabPanel({
                                                                region: 'center',
                                                                id: 'editorTabPanel',
                                                                defaults: {autoScroll:true},
                                                                resizeTabs: true,
                                                                enableTabScroll:true,
                                                                plugins: new Ext.ux.TabCloseMenu(),
                                                                listeners: {
                                                                    remove: function(tabpanel, tab) {
                                                                        if(bibliosdebug) {
                                                                            console.info('closing tab and freeing UI.editor' + tab.title);
                                                                        }
                                                                        biblios.app.displayRecordView();
                                                                        delete UI.editor[ tab.editorid ];
                                                                    }

                                                                }
                                                            })
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
                                                                    sm: (sm = new Ext.grid.SmartCheckboxSelectionModel({
                                                                        //singleSelect: false,
                                                                        alwaysSelectOnCheck: true,
                                                                        email: true,
                                                                        dataIndex: 'checked',
                                                                        header: '',
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
                                                                    })), // save grid selecion model
                                                                    cm: new Ext.grid.ColumnModel([
                                                                        sm, // checkbox for smartcheckbox selectiomodel
                                                                        {header: 'Id', dataIndex:'Id', hidden:true},
                                                                        
                                                                        {header: "Medium", dataIndex: 'Medium', width: 50, sortable: true},
                                                                        {header: "Title", width: 200, dataIndex: 'Title', sortable: true},
                                                                        {header: "Author", width: 160, dataIndex: 'Author', sortable: true},
                                                                        {header: "Publisher", width: 130, dataIndex: 'Publisher', sortable: true},
                                                                        {header: "DateOfPub", width: 80, dataIndex: 'DateOfPub', sortable: true},
                                                                        {header: "Status", width: 100, dataIndex: 'Status', sortable: true},
                                                                        {header: "Date Added", width: 120, dataIndex: 'Date Added', sortable: true},
                                                                        {header: "Last Modified", width: 120, dataIndex: 'Last Modified', sortable: true}
                                                                    ]),
                                                                    checkAllOnLoad: function() {
                                                                        this.getSelectionModel().checkAllInStore();
                                                                        this.store.un('load', Ext.getCmp('savegrid').checkAllOnLoad);
                                                                    },
                                                                    selectAllInStore: function() {
                                                                        var totalcount = this.store.getTotalCount();
                                                                        this.store.on('load', this.checkAllOnLoad, this);
                                                                        this.store.load({params:{start:0, limit:totalcount}});
                                                                        Ext.getCmp('savegridSelectAllInStoreTbar').items.items[0].getEl().update('All ' + this.store.getCount() + ' records in this folder are selected.'  + '<a href="#" onclick="Ext.getCmp(\'savegrid\').selectNone()">Clear selection</a>');
                                                                    },
                                                                    selectAll: function() {
                                                                        this.getSelectionModel().checkAllInStore();
                                                                        Ext.getCmp('savegridSelectAllInStoreTbar').show();
                                                                        Ext.getCmp('savegridSelectAllInStoreTbar').items.items[0].getEl().update('You have selected all ' + this.store.getCount() + ' records on this page.'  + '<a href="#" onclick="Ext.getCmp(\'savegrid\').selectAllInStore()">Select all ' + this.store.getTotalCount() + ' records in this folder</a>');
                                                                        Ext.getCmp('savegridExportBtn').enable();
                                                                        Ext.getCmp('savegridSendBtn').enable();
                                                                        Ext.getCmp('savegridEditBtn').enable();
                                                                    },
                                                                    selectNone: function() {
                                                                        this.getSelectionModel().clearSelections();
                                                                        this.getSelectionModel().clearChecked();
                                                                        Ext.getCmp('savegridSelectAllInStoreTbar').hide();
                                                                        Ext.getCmp('savegridExportBtn').disable();
                                                                        Ext.getCmp('savegridSendBtn').disable();
                                                                        Ext.getCmp('savegridEditBtn').disable();
                                                                    },
                                                                    listeners: {
                                                                        render: function() {
                                                                            var selectAllTbar = new Ext.Toolbar({
                                                                                    id: 'savegridSelectAllTbar',
                                                                                    hidden: true,
                                                                                    renderTo: this.tbar,
                                                                                    items: [
                                                                                        {
                                                                                            id: 'savegridselectall',
                                                                                            xtype: 'tbtext',
                                                                                            text: 'Select <a href="#" onclick="Ext.getCmp(\'savegrid\').selectAll()">All</a>, <a href="#" onclick="Ext.getCmp(\'savegrid\').selectNone()">None</a>'
                                                                                        }
                                                                                    ]
                                                                                });
                                                                                var selectAllInStore = new Ext.Toolbar({
                                                                                    id: 'savegridSelectAllInStoreTbar',
                                                                                    hidden: true,
                                                                                    renderTo: this.tbar,
                                                                                    items: [
                                                                                        {
                                                                                            id: 'savegridselectallstore',
                                                                                            xtype: 'tbtext',
                                                                                            text: "You have selected all records in this folder"
                                                                                        }
                                                                                    ]
                                                                                });
                                                                            this.syncSize();
                                                                        },
                                                                            
                                                                        rowdblclick: function(grid, rowIndex, e) {
                                                                            var id = grid.store.data.get(rowIndex).data.Id;
                                                                            grid.editRecord(id);
                                                                        },// save grid row dbl click handler
                                                                        keypress: function(e) {
                                                                            if( e.getKey() == Ext.EventObject.ENTER ) {
                                                                                var id = Ext.getCmp('savegrid').getSelectionModel().getSelected()[0].data.Id;
                                                                                Ext.getCmp('savegrid').editRecord(id);
                                                                            } // ENTER
                                                                        } // savegrid keypress
                                                                    }, // save grid listeners
                                                                    editRecord: function(id, savefileid) {
                                                                        showStatusMsg('Opening record...');
                                                                        var xml = getLocalXml(id);
                                                                        openRecord( xml,  id, 'marcxml', savefileid);
                                                                    },
                                                                    tbar: new Ext.PagingToolbar({
                                                                        id: 'savegridtbar',
                                                                        pageSize: 15,
                                                                        store: ds,
                                                                        displayInfo: true,
                                                                        displayMsg: 'Displaying records {0} - {1} of {2}',
                                                                        emptyMsg: 'No records to display',
                                                                        listeners: {
                                                                            render: function(){
                                                                            
                                                                            }
                                                                        },
                                                                        items: [
                                                                        {
                                                                                cls: 'x-btn-text-icon',
                                                                                icon: libPath + 'ui/images/toolbar/'+$('//ui/icons/toolbar/edit', configDoc).text(),
                                                                                text: 'Edit',
                                                                                id: 'savegridEditBtn',
                                                                                disabled: true,
                                                                                handler: function() {
                                                                                    var savegrid = Ext.getCmp('savegrid');
                                                                                    var checked = Ext.getCmp('savegrid').getSelectionModel().getChecked();
                                                                                    var selections = Ext.getCmp('savegrid').getSelectionModel().getSelections();
                                                                                    UI.editor.loading.numLoaded = 0;
                                                                                    if( checked.length > 0 && checked.length < 11) {
                                                                                        UI.editor.loading.numToLoad = checked.length;  
                                                                                        for( var i = 0; i < checked.length; i++) {
                                                                                            var savefileid = checked[i].data.Savefiles_id;
                                                                                            var recid = checked[i].data.Id;
                                                                                            savegrid.editRecord( recid, savefileid );
                                                                                        }
                                                                                    }
                                                                                    else if (checked.length > 10 ) {
                                                                                        Ext.Msg.alert('Editing error', 'Please select at most 10 records to open simultaneously');
                                                                                        return false;
                                                                                    }
                                                                                    else if( selections.length > 0) {
                                                                                        UI.editor.loading.numToLoad = selections.length;
                                                                                        for( var j = 0; j < selections.length; j++) {
                                                                                            var savefileid = selections[j].data.Savefiles_id;
                                                                                            savegrid.editRecord( selections[j].data.Id, savefileid );
                                                                                        }
                                                                                    }
                                                                                    else if( checked.length == 0 && selections.length == 0){
                                                                                        Ext.Msg.alert('Editing', 'Please select a record or records to edit by clicking a row or by checking checkboxes next to records you want to edit');
                                                                                        return false;

                                                                                    }
                                                                                    UI.editor.progress = Ext.Msg.progress(
                                                                                        'Loading records',
                                                                                        'Retrieving and formatting records',
                                                                                        '0%'
                                                                                    );
                                                                                } // save grid Edit button handler
                                                                            },
                                                                            {
                                                                                id: 'savegridToolsBtn',
                                                                                cls: 'x-btn-text-icon bmenu', // icon and text class
                                                                                icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/tools', configDoc).text(),
                                                                                disabled: false,
                                                                                text: 'Tools',
                                                                                tooltip: {text: 'Tools'},
                                                                                menu: {
                                                                                    items: [
                                                                                        {
                                                                                            id: 'savegridMoveBtn',
                                                                                            cls: 'x-btn-text-icon bmenu',
                                                                                            icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/move', configDoc).text(),
                                                                                            text: 'Move',
                                                                                            tooltip: {text: 'Move selected records to another folder'},
                                                                                            menu: {
                                                                                                id: 'savegridSaveMenu',
                                                                                                items: getSaveFileMenuItems('savegrid'),
                                                                                                listeners: {
                                                                                                    beforeshow: function(menu, menuItem, e) {
                                                                                                        updateSaveMenu(menu, 'savegrid');
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        },
                                                                                        {   
                                                                                            cls: 'x-btn-text-icon bmenu', // icon and text class
                                                                                            icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/export', configDoc).text(),
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
                                                                                            icon:  libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/send', configDoc).text(),
                                                                                            disabled: true,
                                                                                            text: 'Send',
                                                                                            tooltip: {text: 'Send record to remote ILS'},
                                                                                            menu: {
                                                                                                id: 'savegridSendMenu',
                                                                                                items: getSendFileMenuItems('savegrid'),
                                                                                                listeners: {
                                                                                                    beforeshow: function(menu, menuItem, e) {
                                                                                                        updateSendMenu(menu, 'savegrid');
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        },
                                                                                        {
                                                                                            id: 'savegridDuplicateBtn',
                                                                                            cls: 'x-btn-text-icon',
                                                                                            text: 'Duplicate',
                                                                                            icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/duplicate', configDoc).text(),
                                                                                            handler: function(btn) {
                                                                                                var records = Ext.getCmp('savegrid').getSelectionModel().getChecked();
                                                                                                for( var i = 0; i < records.length; i++) {
                                                                                                    var r = DB.Records.select('Records.rowid=?',[records[i].data.Id]).getOne();
                                                                                                    // add new record to db with this rec's data
                                                                                                    var newrec = new DB.Records({
                                                                                                        xml : r.xml,
                                                                                                        title : r.title || '',
                                                                                                        author : r.author || '',
                                                                                                        publisher : r.publisher || '',
                                                                                                        date : r.date || '',
                                                                                                        date_added : new Date().toString(),
                                                                                                        date_modified : new Date().toString(),
                                                                                                        status : 'duplicate',
                                                                                                        medium : r.medium || '',
                                                                                                        SearchTargets_id : r.SearchTargets_id,
                                                                                                        Savefiles_id : r.Savefiles_id,
                                                                                                        xmlformat : r.xmlformat || '',
                                                                                                        marcflavour : r.marcflavour || '',
                                                                                                        template : r.template || '',
                                                                                                        marcformat : r.marcformat || ''
                                                                                                    }).save();
                                                                                                }
                                                                                                showStatusMsg(records.length + ' records duplicated.');
                                                                                                Ext.getCmp('savegrid').store.reload();
                                                                                                biblios.app.displaySaveFile( UI.currSaveFile);
                                                                                                return true;
                                                                                            }
                                                                                        },
                                                                                        {
                                                                                            id: 'savegridMacrosBtn',
                                                                                            cls: 'x-btn-text-icon bmenu',
                                                                                            text: 'Macros',
                                                                                            icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/macros', configDoc).text(),
                                                                                            menu : {
                                                                                                id: 'savegridmacrosmenu',
                                                                                                items: getMacroMenuItems('savegrid'),
                                                                                                listeners: {
                                                                                                    beforeshow: function(menu, menuItem, e) {
                                                                                                        menu.removeAll();
                                                                                                        var items = getMacroMenuItems('savegrid');
                                                                                                        for( i in items) {
                                                                                                            menu.add( items[i] );
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    ] // save grid Tools menu items
                                                                                }
                                                                            },
                                                                            {
                                                                                id: 'savegridTrashBtn',
                                                                                cls: 'x-btn-icon',
                                                                                icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/trash', configDoc).text(),
                                                                                tooltip: {text: 'Move selected records to trash'},
                                                                                handler: function() {
                                                                                    doMoveRecords(1);
                                                                                    biblios.app.displaySaveFile( UI.currSaveFile );
                                                                                }
                                                                            },
                                                                            {
                                                                                id: 'savegridEmptyTrash',
                                                                                cls: 'x-btn-icon',
                                                                                tooltip: {text: 'Empty the trash'},
                                                                                icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/trash', configDoc).text(),
                                                                                handler: function() {
                                                                                    DB.Records.remove('Savefiles_id=1');
                                                                                    Ext.getCmp('savegrid').store.reload();
                                                                                    biblios.app.displaySaveFile( UI.currSaveFile );
                                                                                }
                                                                            },
                                                                            {
                                                                                id: 'savegridUploadsBtn',
                                                                                cls: 'x-btn-text-icon bmenu',
                                                                                icon: libPath + 'ui/images/toolbar/' + $('//ui/icons/toolbar/upload', configDoc).text(),
                                                                                text: 'Upload',
                                                                                tooltip: {text: 'Upload marc21 or marcxml files'},
                                                                                menu: [
                                                                                    {
                                                                                        id: 'marc21uploadBtn',
                                                                                        text: 'MARC21',
                                                                                        handler: function() {
                                                                                            showUploadDialog('marc21')
                                                                                        }
                                                                                    },
                                                                                    {
                                                                                        id: 'marcxmluploadBtn',
                                                                                        text: 'MARCXML',
                                                                                        handler: function() {
                                                                                            showUploadDialog('marcxml')
                                                                                        }
                                                                                    }
                                                                                ]
                                                                            } // uploads menu
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
                                                    }, // savefilegrid region 
                                                    {
                                                        region: 'center',
                                                        layout: 'fit',
                                                        id: 'splashpanel'
                                                    }
                                                ] // biblio tab center items
                                            }, // biblio tab center
                                            {
                                                region: 'west',
                                                split: true,
                                                collapsible: true,
                                                collapsed: false,
                                                maxSize: 300,
                                                width:280,
                                                height: 'auto',
                                                autoScroll:true,
                                                title: 'Resources',
                                                headerAsText:false,
                                                layout: 'border',
                                                id: 'resourcesPanel',
                                                items: [
                                                    {
                                                        height: 'auto',
                                                        autoScroll:true,
                                                        region: 'center',
                                                        items: 
                                                        [
                                                            new Ext.tree.TreePanel({
                                                                id: 'editingTreePanel',
                                                                autoScroll: true,
                                                                leaf: false,
                                                                expanded: true,
                                                                maskDisabled:true,
                                                                disabled:true,
                                                                root: new Ext.tree.AsyncTreeNode({
                                                                    text: 'Editing',	
                                                                    loader: new Ext.tree.TreeLoader({}),
                                                                    children: getNewRecordMenu(),
                                                                    expanded: true,
                                                                    icon: libPath + 'ui/images/resources_parents/' + $('//ui/icons/resources_panel/editing', configDoc).text(),
                                                                    listeners: {
                                                                        click: function(n,e) {
                                                                            biblios.app.displayRecordView();
                                                                        }
                                                                    } // editingTreePanel listeners
                                                                })
                                                            }),
                                                            new Ext.tree.TreePanel({
                                                                id: 'TargetsTreePanel',
                                                                animate: true,
                                                                leaf: false,
                                                                lines: false,
                                                                maskDisabled:true,
                                                                disabled:true,
                                                                listeners: {
                                                                    click: function(node, e) {
                                                                        biblios.app.displaySearchView();
                                                                    }
                                                                }, // save folder listeners
                                                                root: new Ext.tree.AsyncTreeNode({
                                                                    text: 'Searching',
                                                                    id: 'targetsTreeRoot',
                                                                    expanded: true,
                                                                    icon: uiPath + 'ui/images/resources_parents/' + $('//ui/icons/resources_panel/searching', configDoc).text(),
                                                                    listeners: {
                                                                        load: function(tree) {										
                                                                            tree.appendChild( new Ext.tree.TreeNode({
                                                                                text: 'Edit Search Targets',
                                                                                listeners: {
                                                                                    click: function(n) {
                                                                                        Ext.getCmp('optionstab').show();
                                                                                        Ext.getCmp('searchtargetstab').show();
                                                                                    }
                                                                                }
                                                                            }));
                                                                        },
                                                                        click: function(node, e) {
                                                                            Ext.getCmp('splashpanel').getEl().update(searchingsplash);
                                                                            Ext.getCmp('bibliocenter').layout.setActiveItem(3);

                                                                        }
                                                                    },
                                                                    loader: new Ext.ux.GearsTreeLoader({
                                                                        db: db, 
                                                                        selectSql: 'select SearchTargets.rowid, name, hostname, port, dbname, enabled, description, userid  from SearchTargets', 
                                                                        applyLoader: false,
                                                                        baseAttrs: {
                                                                            listeners: {
                                                                                checkchange: function(node, checked) {
                                                                                    var t = DB.SearchTargets.select('SearchTargets.rowid=?',[node.attributes.id]).getOne();
                                                                                    checked = checked ? 1 : 0;
                                                                                    t.enabled = checked;
                                                                                    t.save();
                                                                                    setPazPar2Targets(function(data) {
                                                                                        if( biblios.app.currQuery ) {
                                                                                            doPazPar2Search(biblios.app.currQuery);
                                                                                            Ext.getCmp('searchgrid').store.reload();
                                                                                        }
                                                                                    });

                                                                                }
                                                                                
                                                                            },
                                                                            allowDrag: false,
                                                                            allowDrop: false,
                                                                            allowAdd: false,
                                                                            allowDelete: false,
                                                                            icon: uiPath + 'ui/images/Search_Target.gif',
                                                                            loader: new Ext.ux.GearsTreeLoader({
                                                                                db: db,
                                                                                selectSql: 'select hostname, port, userid, dbname from SearchTargets ',
                                                                                whereClause: 'where SearchTargets.rowid=?',
                                                                                processData: function(data) {
                                                                                    var json = [];
                                                                                    for( var i = 0; i < data.length; i++) {
                                                                                        var server = data[i][0];
                                                                                        var port = data[i][1];
                                                                                        var db = data[i][3];
                                                                                        var user = data[i][2];
                                                                                        var rowid = data[i][4];
                                                                                        var serverleaf = {
                                                                                            leaf: true,
                                                                                            text: 'Server: ' + server
                                                                                        };
                                                                                        var portleaf = {
                                                                                            leaf: true,
                                                                                            text: 'Port: ' + port
                                                                                        };
                                                                                        var dbleaf = {
                                                                                            leaf: true,
                                                                                            text: 'Database: ' + db
                                                                                        };
                                                                                        var userleaf = {
                                                                                            leaf: true,
                                                                                            text: 'User: ' + user
                                                                                        };
                                                                                        json.push( serverleaf, portleaf, dbleaf, userleaf );
                                                                                    }
                                                                                    return json;
                                                                                } // processData for server info leaves
                                                                            }) // loader for server info leaves
                                                                        }, // baseAttrs for server nodes
                                                                        processData: function(data) {  
                                                                            var json = [];
                                                                            for( var i = 0; i< data.length; i++) {
                                                                                var pazid = data[i][2];
                                                                                if( data[i][3] != '') {
                                                                                    pazid += ':' + data[i][3];
                                                                                }
                                                                                if( data[i][4] != '') {
                                                                                    pazid += '/' + data[i][4];
                                                                                }
                                                                                var servername = data[i][1];
                                                                                var text = data[i][1];
                                                                                var id = data[i][0];
                                                                                var hostname = data[i][2];
                                                                                var port = data[i][3];
                                                                                var enabled = data[i][5];
                                                                                var checked = enabled ? true : false
                                                                                json.push({
                                                                                    leaf: false,
                                                                                    checked: checked,
                                                                                    servername: servername,
                                                                                    text: text,
                                                                                    id: id,
                                                                                    hostname: hostname,
                                                                                    port: port,
                                                                                    pazid: pazid
                                                                                });
                                                                            }
                                                                            return json;
                                                                        } // base attrs for leaf nodes
                                                                    })
                                                                })
                                                            }), // resources treepanel with treeeditor applied
                                                            new Ext.tree.TreePanel({
                                                                id: 'facetsTreePanel',
                                                                animate: true,
                                                                leaf: false,
                                                                lines: false,
                                                                applyLoader: false,
                                                                loader: this.facetsTreeLoader,
                                                                root: new Ext.tree.AsyncTreeNode({
                                                                    text: 'Facets',
                                                                    icon: uiPath + 'ui/images/resources_parents/' + $('//ui/icons/resources_panel/facets', configDoc).text()
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
                                                                    text: 'Folders',
                                                                    leaf: false,
                                                                    animate: true,
                                                                    allowAdd: true,
                                                                    savefileid: 'null',
                                                                    parentid: 'null',
                                                                    expanded: true,
                                                                    listeners: {
                                                                        click: function(node, e) {
                                                                            Ext.getCmp('splashpanel').getEl().update(folderssplash);
                                                                            Ext.getCmp('bibliocenter').layout.setActiveItem(3);
                                                                            Ext.getCmp('savegridEditBtn').disable();
                                                                            Ext.getCmp('savegridExportBtn').disable();
                                                                            Ext.getCmp('savegridSendBtn').disable();
                                                                            
                                                                        }
                                                                    }, // save folder listeners
                                                                    loader: new Ext.ux.GearsTreeLoader({
                                                                        db: db,
                                                                        selectSql: 'select Savefiles.rowid, name, parentid, description, icon, allowDelete, allowAdd, allowDrag, allowDrop, ddGroup from Savefiles where parentid is null',
                                                                        applyLoader: false,
                                                                        baseAttrs: {
                                                                            listeners: {
                                                                                click: function(node, e) {
                                                                                    Ext.getCmp('savegridEditBtn').disable();
                                                                                    Ext.getCmp('savegridExportBtn').disable();
                                                                                    Ext.getCmp('savegridSendBtn').disable();
                                                                                    UI.currSaveFile = node.attributes.id;
                                                                                    UI.currSaveFileName = node.text;
                                                                                    biblios.app.displaySaveFile( node.attributes.id );
                                                                                    if(node.text == 'Trash') {
                                                                                        Ext.getCmp('savegridEmptyTrash').show();
                                                                                        Ext.getCmp('savegridTrashBtn').hide();
                                                                                    }
                                                                                    else {
                                                                                        Ext.getCmp('savegridEmptyTrash').hide();
                                                                                        Ext.getCmp('savegridTrashBtn').show();
                                                                                    }
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
                                                                                            Ext.getCmp('savegridEditBtn').disable();
                                                                                            Ext.getCmp('savegridExportBtn').disable();
                                                                                            Ext.getCmp('savegridSendBtn').disable();
                                                                                            UI.currSaveFile = node.attributes.id;
                                                                                            UI.currSaveFileName = node.text;
                                                                                            biblios.app.displaySaveFile( node.attributes.id );
                                                                                            if(node.text == 'Trash') {
                                                                                                Ext.getCmp('savegridEmptyTrash').show();
                                                                                                Ext.getCmp('savegridTrashBtn').hide();
                                                                                            }
                                                                                            else {
                                                                                                Ext.getCmp('savegridEmptyTrash').hide();
                                                                                                Ext.getCmp('savegridTrashBtn').show();
                                                                                            }
                                                                                            biblios.app.displaySaveView();
                                                                                        }
                                                                                    } // save folder listeners
                                                                                } // inner save folder baseAttrs
                                                                            }) // gears loader for subsequent savefile nodes
                                                                            
                                                                        } // baseAttrs for savefile children nodes
                                                                    }) // savefiles root gears loader
                                                                }),
                                                                listeners: {
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
                                                                                        tooltip: {text: 'Move selected records to trash'},
                                                                                        handler: function() {
                                                                                            DB.Records.remove('Savefiles_id=1');
                                                                                            Ext.getCmp('savegrid').store.reload();
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
                                                                                            icon: libPath + 'lib/extjs2/resources/images/default/tree/folder-open.gif',
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
                                                                                                    Ext.getCmp('savegridEditBtn').disable();
                                                                                                    Ext.getCmp('savegridExportBtn').disable();
                                                                                                    Ext.getCmp('savegridSendBtn').disable();
                                                                                                    UI.currSaveFile = node.attributes.id;
                                                                                                    UI.currSaveFileName = node.text;
                                                                                                    biblios.app.displaySaveFile( node.attributes.id );
                                                                                                    if(node.text == 'Trash') {
                                                                                                        Ext.getCmp('savegridEmptyTrash').show();
                                                                                                        Ext.getCmp('savegridTrashBtn').hide();
                                                                                                    }
                                                                                                    else {
                                                                                                        Ext.getCmp('savegridEmptyTrash').hide();
                                                                                                        Ext.getCmp('savegridTrashBtn').show();
                                                                                                    }
                                                                                                    biblios.app.displaySaveView();
                                                                                                }
                                                                                            } // save folder listeners
                                                                                        });
                                                                                        n.appendChild(newnode);
                                                                                        n.expand();
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
                                                            }) // resources treepanel with treeeditor applied
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
                                                listeners: {
                                                },
                                                items: [
                                                    new Ext.Panel({
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
                                                        title: 'Database',
                                                        layout: 'border',
                                                        listeners: {
                                                            activate: function(tab) {
                                                                biblios.app.viewport.doLayout();
                                                            }
                                                        }, // db tab listeners
                                                        items: [
                                                            new Ext.Toolbar({
                                                                region: 'center',
                                                                items: [
                                                                    {
                                                                        text: 'Reset Google Gears database',
                                                                        handler: function(btn) {
                                                                            Ext.MessageBox.confirm('Reset Database', 'Reset database, removing all records, send targets, search targets, macros, and user-created savefiles?', function(btn) {
                                                                                try {
                                                                                    resetDB();
                                                                                    Ext.MessageBox.alert('Reset Database', 'Database has been reset');
                                                                                }
                                                                                catch(ex) {
                                                                                    Ext.MessageBox.alert('Reset Database', 'There was an error in reseting the database.  Please report this error to your system administrator: ' + ex);
                                                                                }
                                                                            });
                                                                        }
                                                                    },
                                                                    {
                                                                        text: 'Reload ‡biblios.net configuration',
                                                                        handler: function(btn) {
                                                                            reloadConfig();
                                                                            Ext.MessageBox.alert('Configuration reload', '‡biblios.net configuration has been reloaded');
                                                                        }
                                                                    },
                                                                    {
                                                                        text: 'Export Google Gears database',
                                                                        handler: function(btn) {
                                                                            var db = exportDB();
                                                                            doExportDB(db);
                                                                        }
                                                                    },
                                                                    {
                                                                        text: 'Import Google Gears database',
                                                                        handler: function(btn) {
                                                                            showImportDBDialog();
                                                                        }
                                                                    }
                                                                ],
                                                                listeners: {
                                                                    beforerender: function(tbar) {
                                                                            tbar.autoCreate.html = '<table cellspacing="0"><tr></tr></table>';
                                                                    }
                                                                } // db tbar listeners
                                                            })
                                                        ]
                                                    }, // db tab
                                                    {
                                                        title: 'Macros',
                                                        layout: 'border',
                                                        listeners: {
                                                            activate: function(tab) {
                                                                Ext.getCmp('macrosgrid').store.load({db: db, selectSql: biblios.app.db.selectSqlMacros});
                                                                biblios.app.viewport.doLayout();
                                                            }
                                                        }, // macros tab listeners
                                                        items: [
                                                            new Ext.grid.EditorGridPanel({
                                                                id: 'macrosgrid',
                                                                region: 'center',
                                                                height: 600,
                                                                ds: new Ext.data.Store({
                                                                    proxy: new Ext.data.GoogleGearsProxy(new Array()),
                                                                    reader: new Ext.data.ArrayReader({
                                                                        record: 'name'
                                                                    }, Macro),
                                                                    remoteSort: true,
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
                                                                                        m = DB.Macros.select('Macros.rowid=?',[record.data.rowid]).getOne();
                                                                                        m.name = record.data.name;
                                                                                        m.code = record.data.code;
                                                                                        m.hotkey = record.data.hotkey;
                                                                                        m.file = record.data.file;
                                                                                        m.enabled = record.data.enabled;
                                                                                        m.save();
                                                                                    }
                                                                                    catch(ex) {
                                                                                        Ext.MessageBox.alert('Error', ex.message);
                                                                                    }
                                                                                } // commit, edit
                                                                            } // update listener
                                                                        }
                                                                }),
                                                                sm: (sm = new Ext.grid.SmartCheckboxSelectionModel({
                                                                    //singleSelect: false,
                                                                    alwaysSelectOnCheck: true,
                                                                    email: true,
                                                                    dataIndex: 'enabled',
                                                                    header: '',
                                                                })),
                                                                cm: new Ext.grid.ColumnModel([
                                                                    sm,
                                                                    {
                                                                        header: 'Name',
                                                                        dataIndex: 'name',
                                                                        editor: new Ext.form.TextField()
                                                                    },
                                                                    {
                                                                        header: 'Code',
                                                                        dataIndex: 'code',
                                                                        width: 700,
                                                                        editor: new Ext.form.TextArea()
                                                                    },
                                                                    {
                                                                        header: 'Hotkey',
                                                                        dataIndex: 'hotkey',
                                                                        hidden: true,
                                                                        editor: new Ext.form.TextField()
                                                                    },
                                                                    {
                                                                        header: 'File',
                                                                        dataIndex: 'file',
                                                                        hidden: true,
                                                                        editor: new Ext.form.TextField()
                                                                    }
                                                                ]),
                                                                tbar: new Ext.Toolbar({
                                                                    id: 'macrosgridtbar',
                                                                    items: [
                                                                    {
                                                                        text: 'Add Macro',
                                                                        handler: function() {
                                                                            var rs = db.execute('insert into Macros (name) values("")');
                                                                            rs.close();
                                                                            var m = new Macro({
                                                                                rowid: db.lastInsertRowId,
                                                                                name: '',
                                                                                code: '',
                                                                                hotkey: '',
                                                                                file: '',
                                                                                enabled: 0
                                                                            });
                                                                            Ext.getCmp('macrosgrid').stopEditing();
                                                                            Ext.getCmp('macrosgrid').store.insert(0, m);
                                                                            Ext.getCmp('macrosgrid').startEditing(0, 0);
                                                                        }
                                                                    },
                                                                    {
                                                                        text: 'Delete Macro',
                                                                        handler: function() {
                                                                            var records = Ext.getCmp('macrosgrid').getSelections();
                                                                            for( var i = 0; i < records.length; i++) {
                                                                                DB.Macros.select('Macros.rowid=?', [records[i].data.rowid]).getOne().remove();
                                                                            }
                                                                            Ext.getCmp('macrosgrid').store.reload();
                                                                        }
                                                                    }
                                                                    ], // macros grid toolbar
                                                                    listeners: {
                                                                        beforerender: function(tbar) {
                                                                        }
                                                                    }
                                                                }) // macros grid tbar
                                                            }) // macros gridpanel
                                                        ] // macros grid items
                                                    }, // macros
                                                    {
                                                        title: 'Plugins',
                                                        layout: 'border',
                                                        listeners: {
                                                            activate: function(tab) {
                                                                Ext.getCmp('pluginsgrid').store.load({db: db, selectSql: biblios.app.db.selectSqlPlugins});
                                                                biblios.app.viewport.doLayout();
                                                            }
                                                        },
                                                        items: 
                                                            {
                                                                region: 'center',
                                                                height: 600,
                                                                id: 'pluginsgridpanel',
                                                                items: [
                                                                    new Ext.grid.GridPanel({
                                                                        id: 'pluginsgrid',
                                                                        height: 600,
                                                                        ds: new Ext.data.Store({
                                                                            proxy: new Ext.data.GoogleGearsProxy(new Array()),
                                                                            reader: new Ext.data.ArrayReader({
                                                                                record: 'name'
                                                                            }, Plugin),
                                                                            remoteSort: false,
                                                                            listeners: {

                                                                            } // plugins ds listeners
                                                                        }), // plugins ds
                                                                        listeners: {

                                                                        }, // plugins grid listeners
                                                                        sm: new Ext.grid.RowSelectionModel({

                                                                        }),
                                                                        cm: new Ext.grid.ColumnModel([
                                                                            {
                                                                                header: 'Name',
                                                                                dataIndex: 'name',
                                                                                editor: new Ext.grid.GridEditor(new Ext.form.TextField())
                                                                            },
                                                                            {
                                                                                header: 'File',
                                                                                dataIndex: 'file',
                                                                                hidden: true,
                                                                                editor: new Ext.grid.GridEditor(new Ext.form.TextField())
                                                                            },
                                                                            {
                                                                                header: 'Type',
                                                                                dataIndex: 'type',
                                                                                editor: new Ext.grid.GridEditor(new Ext.form.TextField())
                                                                            },
                                                                            {
                                                                                header: 'Initcall',
                                                                                dataIndex: 'initcall',
                                                                                editor: new Ext.grid.GridEditor(new Ext.form.TextField()),
                                                                                hidden: true
                                                                            },
                                                                            {
                                                                                header: 'Enabled',
                                                                                dataIndex: 'enabled',
                                                                                renderer: function formatBoolean(value) {
                                                                                    return value ? 'Yes' : 'No';
                                                                                },
                                                                                editor: new Ext.grid.GridEditor(new Ext.form.Checkbox())
                                                                            }
                                                                        ])
                                                                    }) // plugins editor grid panel
                                                                ] // pluginsgridpanel items
                                                            } // plugins tab items
                                                    },
                                                    {
                                                        title: 'Search Targets',
                                                        id: 'searchtargetstab',
                                                        layout: 'border',
                                                        listeners: {
                                                            activate: function(tab) {
                                                                this.refresh();
                                                            }, // activate search targets grid tab
                                                            beforeshow: function(tab){
                                                                this.refresh();
                                                            } // show tab
                                                        }, // search targets grid tab listeners
                                                        refresh: function() {
                                                            Ext.getCmp('searchtargetsgrid').store.load({db:db,selectSql:biblios.app.db.selectSqlSearchTargets});
                                                            biblios.app.viewport.doLayout();
                                                         },
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
                                                                                    record.data.enabled = record.data.enabled ? 1 : 0;
                                                                                    if( operation == Ext.data.Record.COMMIT || operation == Ext.data.Record.EDIT) {
                                                                                        t = DB.SearchTargets.select('SearchTargets.rowid=?', [record.data.rowid]).getOne();
                                                                                        if( t.allowModify == 0 ) {
                                                                                           Ext.MessageBox.alert('Error', "This search target is defined in the ‡biblios.net configuration file.  Please contact your system administrator to change it's settings"); 
                                                                                            return false;
                                                                                        }
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
                                                                                t = DB.SearchTargets.select('SearchTargets.rowid=?', [id]).getOne();
                                                                                if( t.allowModify == 0 ) {
                                                                                   Ext.MessageBox.alert('Error', "This search target is defined in the ‡biblios.net configuration file.  Please contact your system administrator to change it's settings"); 
                                                                                    return false;
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
                                                                                Ext.getCmp('searchtargetsgrid').store.reload();
                                                                                Ext.getCmp('TargetsTreePanel').getRootNode().reload();
                                                                                
                                                                            }, // after edit event on search target grid
                                                                            celldblclick: function(grid, rowIndex, colIndex, e) {
                                                                                if( colIndex != 9 ) {
                                                                                    return true;
                                                                                }
                                                                                var record = grid.store.getAt(rowIndex);
                                                                                var settingsjson = record.data.pazpar2settings;
                                                                                var settings = {};
                                                                                if( settingsjson == '' ) {
                                                                                    var target = DB.SearchTargets.select('SearchTargets.rowid=?',[ record.data.rowid ] ).getOne();
                                                                                    settings = getDefaultPazSettingsJSON(target);

                                                                                }
                                                                                else {
                                                                                    settings = Ext.util.JSON.decode(settingsjson);
                                                                                }
                                                                                var win = new Ext.Window({
                                                                                    id:'pazpar2settingsproperties',
                                                                                    layout:'fit',
                                                                                    width: 300,
                                                                                    height: 300,
                                                                                    autoScroll: true,
                                                                                    closeAction:'hide',
                                                                                    items: (pg = new Ext.grid.PropertyGrid({
                                                                                        title: 'Advanced Search Settings',
                                                                                        id: 'searchtargetspropertygrid',
                                                                                        autoHeight: true,
                                                                                        width: 300,
                                                                                        stripeRows:true,
                                                                                        source: settings
                                                                                    })),
                                                                                    buttons: [
                                                                                        {
                                                                                            grid:pg,
                                                                                            record:record,
                                                                                            text:'New Search Type',
                                                                                            handler: function(btn) {
                                                                                                Ext.Msg.prompt('Add new search type', 'Enter abbreviation for new search type', function(btn, text) {
                                                                                                    var rowid = this.record.data.rowid;
                                                                                                    var pazid = getPazTargetName( DB.SearchTargets.select('SearchTargets.rowid=?',[rowid]).getOne() );
                                                                                                    var newcclmap = 'pz:cclmap:'+text+'['+pazid+']';
                                                                                                    if(bibliosdebug) {
                                                                                                        console.debug('add searchtype: ' + rowid + ' ' + pazid + ' ' + newcclmap);
                                                                                                    }
                                                                                                    var rec = new Ext.grid.PropertyRecord({
                                                                                                        name: newcclmap,
                                                                                                        value: ''
                                                                                                    });
                                                                                                    this.grid.store.addSorted(rec);
                                                                                                    this.grid.store.commitChanges();
                                                                                                    return true;
                                                                                                }, btn);
                                                                                                

                                                                                            }
                                                                                        },
                                                                                        {
                                                                                            grid:pg,
                                                                                            record:record,
                                                                                            text:'Remove',
                                                                                            handler: function(btn) {
                                                                                                Ext.Msg.confirm('Remove search type', 'Are you sure you want to remove this search type?', function(btn, text) {
                                                                                                    if(btn=='ok') {
                                                                                                        var r = Ext.getCmp('searchtargetspropertygrid').getSelectionModel().selection.record;
                                                                                                        this.grid.store.remove( r );
                                                                                                        this.grid.store.commitChanges();
                                                                                                        return true;
                                                                                                    }
                                                                                                    else {
                                                                                                        return true;
                                                                                                    }
                                                                                                }, btn);

                                                                                            }
                                                                                        },
                                                                                        {
                                                                                            grid: pg,
                                                                                            record: record,
                                                                                            text: 'Save',
                                                                                            handler: function(btn) {
                                                                                                var settingsjson = btn.grid.getSource();
                                                                                                if(bibliosdebug) { console.info(settingsjson);}
                                                                                                var settingsstring = Ext.util.JSON.encode(settingsjson);
                                                                                                if(bibliosdebug) { console.info(settingsstring);}
                                                                                                btn.record.data.pazpar2settings = settingsstring;
                                                                                                btn.record.commit();
                                                                                                Ext.getCmp('searchtargetsgrid').store.reload();
                                                                                                setPazPar2Targets();
                                                                                                Ext.getCmp('pazpar2settingsproperties').close();
                                                                                            }
                                                                                        },
                                                                                        {
                                                                                            grid: pg,
                                                                                            text: 'Cancel',
                                                                                            handler: function(btn) {
                                                                                                Ext.getCmp('pazpar2settingsproperties').close();
                                                                                            }
                                                                                        }
                                                                                    ]
                                                                                }).show();

                                                                            } // search targets grid cell dbl click handler
                                                                        }, // search target grid listeners
                                                                        sm: (sm =new Ext.grid.SmartCheckboxSelectionModel({
                                                                            dataIndex:'enabled',
                                                                            alwaysSelectOnCheck: true,
                                                                            email:true,
                                                                            header: ''
                                                                        })),
                                                                        cm: new Ext.grid.ColumnModel([
                                                                            sm,
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
                                                                                editor: new Ext.grid.GridEditor(new Ext.form.TextField({inputType:'password'})),
                                                                                renderer: function(value) {
                                                                                    var pw = '';
                                                                                    for( var i = 0; i < value.length; i++) {
                                                                                        pw += '*';
                                                                                    }
                                                                                    return pw;
                                                                                }
                                                                            },
                                                                            {
                                                                                header: 'Syntax',
                                                                                dataIndex: 'syntax',
                                                                                editor: new Ext.grid.GridEditor(new Ext.form.TextField()),
                                                                                hidden: true
                                                                            }
                                                                        ]),
                                                                        tbar: new Ext.Toolbar({
                                                                            items: [
                                                                            {
                                                                                text: 'Add Search Target',
                                                                                handler: function() {
                                                                                    // insert new target into db so we get it's id
                                                                                    var rs;
                                                                                    try {
                                                                                        rs = db.execute('insert into SearchTargets (name, allowDelete, allowModify, description, hostname, dbname, port, userid, password, pazpar2settings) values ("", 1, 1,"","","","", "", "", "")');
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
                                                                                        enabled: 0,
                                                                                        allowModify: 1,
                                                                                        allowDelete: 1
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
                                                                                            var t = DB.SearchTargets.select('SearchTargets.rowid=?', [records[i].data.rowid]).getOne();
                                                                                            if( t.allowDelete == 1 ) {
                                                                                                t.remove();
                                                                                            }
                                                                                            else {
                                                                                               Ext.MessageBox.alert('Error', "This search target is defined in the ‡biblios.net configuration file.  Please contact your system administrator to change it's settings"); 
                                                                                            }
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
                                                                        ],
                                                                        listeners: {
                                                                            beforerender: function(tbar) {
                                                                                    tbar.autoCreate.html = '<table cellspacing="0"><tr></tr></table>';
                                                                            }
                                                                        }
                                                                        }) // toolbar
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
                                                                                t = DB.SendTargets.select('SendTargets.rowid=?', [record.data.rowid]).getOne();
                                                                                if( t.allowModify == 0 ) {
                                                                                    Ext.MessageBox.alert('Error', "This send target is defined in the biblios configuration file.  Please contact your system administrator to change it's settings");
                                                                                    return false;
                                                                                }
                                                                                if( operation == Ext.data.Record.COMMIT || operation == Ext.data.Record.EDIT ) {
                                                                                    try {
                                                                                     var rs = db.execute('update SendTargets set name = ?, location = ?, user= ?, password = ?, plugin= ?, enabled = ?, searchtarget = ? where rowid = ?', [record.data.name, record.data.location, record.data.user, record.data.password, record.data.plugin, record.data.enabled, record.data.searchtarget, record.data.rowid ]);
                                                                                        rs.close();
                                                                                    }
                                                                                    catch(ex) {
                                                                                        Ext.MessageBox.alert('Error', ex.message);
                                                                                    }
                                                                                    setILSTargets();
                                                                                }
                                                                            }
                                                                        } // send target grid store listeners
                                                                        }), // send target grid data store
                                                                        listeners: {
                                                                            afteredit: function(e) {
                                                                                var id = e.record.data.rowid;
                                                                                var t = DB.SendTargets.select('SendTargets.rowid=?', [id]).getOne();
                                                                                if( t.allowModify == 0 ) {
                                                                                    Ext.MessageBox.alert('Error', "This send target is defined in the ‡biblios.net configuration file.  Please contact your system administrator to change it's settings");
                                                                                    return false;
                                                                                }
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
                                                                                e.grid.store.load({db: db, selectSql: 'select SendTargets.rowid as rowid, name, location, url, user, password, plugin, enabled, searchtarget from SendTargets'});
                                                                                setILSTargets();
                                                                            } // afteredit handler
                                                                        },
                                                                        sm: (sm =new Ext.grid.SmartCheckboxSelectionModel({
                                                                            dataIndex:'enabled',
                                                                            alwaysSelectOnCheck: true,
                                                                            email:true,
                                                                            header: ''
                                                                        })),
                                                                        cm: new Ext.grid.ColumnModel([
                                                                            sm,
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
                                                                                editor: new Ext.form.TextField({inputType:'password'}),
                                                                                renderer: function(value) {
                                                                                    var pw = '';
                                                                                    for( var i = 0; i < value.length; i++) {
                                                                                        pw += '*';
                                                                                    }
                                                                                    return pw;
                                                                                }
                                                                            },
                                                                            {
                                                                                header: 'Plugin',
                                                                                dataIndex: 'plugin',
                                                                                editor: new Ext.form.TextField(),
                                                                                hidden: true
                                                                            }
                                                                            ,{
                                                                                header: 'SearchTarget',
                                                                                dataIndex: 'searchtarget',
                                                                                width: 100,
                                                                                renderer: function(value) {
                                                                                    return DB.SearchTargets.select('SearchTargets.rowid=?',[value]).getOne().name;
                                                                                },
                                                                                editor: new Ext.form.ComboBox({
                                                                                    width:100,
                                                                                    store: new Ext.data.SimpleStore({
                                                                                        fields: ['rowid', 'name'],
                                                                                        data: getTargetsForCombo()
                                                                                    }),
                                                                                    mode:'local',
                                                                                    displayField: 'name',
                                                                                    valueField: 'rowid',
                                                                                    forceSelection:true,
                                                                                    typeAhead:true,
                                                                                    triggerAction:all
                                                                                })
                                                                            }
                                                                        ]), // send target column model
                                                                        tbar:  new Ext.Toolbar({
                                                                            items: [
                                                                            {
                                                                                text: 'Add Send Target',
                                                                                handler: function() {
                                                                                    // insert new target into db so we get it's id
                                                                                    var rs;
                                                                                    try {
                                                                                        rs = db.execute('insert into SendTargets (name, allowModify, allowDelete) values ("", 1, 1)');
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
                                                                                        plugin: 'Save To Koha',
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
                                                                                            var t = DB.SendTargets.select('SendTargets.rowid=?', [records[i].data.rowid]).getOne();
                                                                                            if( t.allowDelete == 1 ) {
                                                                                                t.remove();
                                                                                                delete Prefs.remoteILS[ records[i].data.location ];
                                                                                            }
                                                                                            else {
                                                                                                Ext.MessageBox.alert('Error', "This send target is defined in the ‡biblios.net configuration file.  Please contact your system administrator to change it's settings");
                                                                                            // remove from Prefs hash
                                                                                            }
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
                                                                                    if( record.data.user == '' || record.data.password == '' || record.data.url == '' || record.data.plugin== '' ) {
                                                                                        Ext.MessageBox.alert('Error', 'Please enter user, password, url, plugin location and plugin init to test this connection.');
                                                                                        return false;
                                                                                    }
                                                                                    var plugin = DB.Plugins.select('name=?', [record.data.plugin]).getOne();
                                                                                    var initcall = plugin.initcall;
                                                                                    try {
                                                                                    var instance = eval( initcall );
                                                                                        try {
                                                                                            instance.init( {
                                                                                                url:record.data.url, 
                                                                                                name:record.data.name, 
                                                                                                user: record.data.user, 
                                                                                                password: record.data.password
                                                                                            });
                                                                                            instance.initHandler = function(sessionStatus) {
                                                                                                if( sessionStatus != 'ok' ) {
                                                                                                    Ext.MessageBox.alert('Connection error', 'Authentication to Koha server at ' + this.url + ' failed.  Response: ' + sessionStatus + '.');
                                                                                                }
                                                                                                else {
                                                                                                    Ext.MessageBox.alert('Connection successful', 'Authentication to Koha server at ' + this.url + ' was successful.  Response: ' + sessionStatus + '.');

                                                                                                }
                                                                                            };
                                                                                        }
                                                                                        catch(ex) {
                                                                                            Ext.MessageBox.alert('Error', ex.msg);
                                                                                        }
                                                                                    }
                                                                                    catch(ex) {
                                                                                        Ext.MessageBox.alert('Error', ex.msg);
                                                                                    }
                                                                                }
                                                                            }
                                                                        ], 
                                                                        listeners: {
                                                                            beforerender: function(tbar) {
                                                                                    tbar.autoCreate.html = '<table cellspacing="0"><tr></tr></table>';
                                                                            }
                                                                        }
                                                                        }) // toolbar
                                                                    }) // sendtarget editorgridpanel constructor
                                                                ] // send targets tab items
                                                            } // send targets tab center region
                                                    }, // send targets tab
                                                    {
                                                        title: 'Preferences',
                                                        layout: 'border',
                                                        listeners: {
                                                            activate: function() {
                                                                biblios.app.viewport.doLayout();
                                                            }
                                                        },// pref tab list
                                                        items: [
                                                            new Ext.Panel({
                                                                region: 'center',
                                                                items: [
                                                                    new Ext.form.Checkbox({
                                                                        id: 'editorOutlineCheckBox',
                                                                        autoCreate: true,
                                                                        boxLabel: 'Show borders around editor fields',
                                                                        checked: true,
                                                                        listeners: {
                                                                            check: function(checkbox, checked) {
                                                                                if(checked) {
                                                                                    setPref('ShowFieldBordersInEditor', 1);
                                                                                }
                                                                                else {
                                                                                    setPref('ShowFieldBordersInEditor', 0);
                                                                                }
                                                                            }
                                                                        } // preferences editor outline checkbox listeners
                                                                    }) // preferences editor outline checkbox
                                                                ] // preferences panel items
                                                            }) // preferences panel
                                                        ] // preferences tab items
                                                    } // preferences tab
                                                ] // options inner tab panel
                                            }) // Options tabpanel constructor
                                        ] // options tab items
                                    } // options tab config
                                ] // center items of tabpanel
                            })
                        ] // viewport items
                    }) // inner panel
                ] // viewport items
			}); // viewport constructor
			
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

        treeEditor.on('beforestartedit', function(editor, el, value) {
            var n = Ext.getCmp('FoldersTreePanel').getSelectionModel().getSelectedNode();
            if( n.attributes.allowRename == false || n.attributes.allowEdit == false || n.attributes.allowDelete == false) {
                return false;
            }
                
        });

		treeEditor.render();

		Ext.getCmp('tabpanel').activate(0);
        Ext.getCmp('splashpanel').getEl().update(mainsplash); 
        Ext.getCmp('bibliocenter').layout.setActiveItem(3);
        Ext.getCmp('facetsTreePanel').hide();
        } // end of init method
    }); // end of public biblios.app space
}(); // end of app

// define events for biblios.app
biblios.app.addEvents({
    /*
        beforesearch
        params:
            searchWhere: array of target(s) being searched
            searchQuery: search query being sent to targets
    */
    'beforesearch' : true,
    'searchcomplete' : true,
    /*
        remoterecordretrieve
        params: xml document of retrieved record
    */
    'remoterecordretrieve' : true,
    /*
        beforeeditrecord
        params: xml string of record to edit, editor id where record is to be opened
    */
    'beforeeditrecord' : true,
    /*
        beforesaverecord
        params: 
            savefileid: savefile where record is to be saved
            editorid: editor id where record is being saved from
            offset: offset used for record retrieval from pazpar2 (optional)
    */
    'beforesaverecord' : true,
    /*
        saverecordcomplete
        params: 
            savefileid: id of save file where record was saved
            xml: xml string of record saved
    */
    'saverecordcomplete' : true,
    /*
        beforesendrecord
        params: 
            loc: location record is being saved to
            xmldoc: xml document of record being saved
            editorid: id of editor record is being saved from
    */
    'beforesendrecord' : true,
    /*
        sendrecordcomplete
        params: 
            loc: location where record was (attempted to be) saved
            xmldoc: xml document of record as returned from remote server
            status: status of request to server
    */
    'sendrecordcomplete' : true,
    /*
        updatesendmenu
        params:
            menu: Ext menu component being updated
    */
    'updatesendmenu': true,
    /*
        updatesavemenu
        params:
            menu: Ext menu component being updated
    */
    'updatesavemenu': true,
    /*
        beforerecordexport
        params:
            record: xml string of record being exported
    */
    'beforerecordexport':true
});

 
