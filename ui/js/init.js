// reference local blank image
Ext.BLANK_IMAGE_URL = libPath + 'lib/extjs/resources/images/default/s.gif';

// config options
var configDoc = '';
var marcFlavor = '';
var searchScript = '';
var saveScript = '';
var encoding = '';
var z3950serversSearch = '';
var z3950serversSave = '';
var cclfile = '';
var plugins = '';
var templates = '';
var pazpar2url = 'http://'+ location.hostname + hostPort + '/pazpar2/search.pz2';
var kohaauthurl = 'http://'+ location.hostname+ hostPort + '/kohaauth/authorities';
init_gears();

Ext.Ajax.request({
    url: confPath,
    method: 'GET',
    callback: function( options, success, response ) {
      configDoc = (new DOMParser()).parseFromString( response.responseText, 'text/xml');
      marcFlavor = $("//marcflavor", configDoc).text();
      searchScript = $("//searchscript", configDoc).text();
      saveScript = $("//savescript", configDoc).text();
      encoding = $("//encoding", configDoc).text();
      //$("searching//server", configDoc).each( function() { z3950serversSearch += ' ' + $(this).text();  } );
      z3950serversSave = $("saving//server", configDoc).text();
      cclfile = $("//cclfile", configDoc).text();
      marcdesc = $("//marcdesc", configDoc).text();
      $("//plugins/plugin/file", configDoc).each( function() { plugins += ' ' + $(this).text(); } );
      $("//templates/template/file", configDoc).each( function() { templates += ' ' + $(this).text(); } );
    }	
});

// load xsl docs for transforming marcxml
var marcxsl = xslTransform.loadFile(showMarcXslPath);
var ffxsl = xslTransform.loadFile(fixedFieldXslPath);
var varfxsl = xslTransform.loadFile(varFieldsXslPath);

var recordNum = 0; // number of individual records found and saved to db
var newRecordNum = 0; // number of individual records found and saved to db
var resultsDoc;

// tabs
var tabs;
var bibliotab;
var hometab;
var optionstab;
// toolbars, menus
var RecentSearchesMenu;
var searchsavetoolbar;
var editor_toolbar;
var searchbar;
var searchform;
var statusbox;
// layouts
var layout;
var innerLayout;
var searchSaveNestedLayout;
var folder_and_status_layout;
var editorlayout;
// grid and data store for searches
var searchgrid;
var searchds;
var searchmodel;
// grid and data store for save file
var savefilegrid;
var savefileds;
var savefilemodel;
var searchgridpaging;
var savegridpaging;
// record cache for search results
var recordCache = {};
// panels
var status_panel, folderlist_panel, toolbar_panel, work_panel, upper_panel, lower_panel, right_panel, left_panel;
// trees
var searchTree, saveTree, saveFilesTree, treeEditor;
var folderRoot, searchRoot, saveRoot, saveFilesRoot, facetsRoot;
// YUI rich text editor
var rte_editor;
	
var searches = new Array(); // Array of pazpar2 searches
var paz = initializePazPar2(pazpar2url, {
	initCallback: function(data) {
		paz.sessionID = this.sessionID;
		// set pazpar2 search results grid url
		Ext.getCmp('searchgrid').store.proxy.conn.url = pazpar2url + '?session=' + this.sessionID + '&command=show';
		setPazPar2Targets();
	}
	});
var pazShowUrl = pazpar2url + '?session=' + paz.sessionID + '&command=show';
var searchLimits = {};
var currQuery;


/*
   Function: initUI

   Initiliaze the user interface.

   Parameters:

   None.

   Returns:

   None.

*/
function initUI() {
  // initialize the ui
  Ext.QuickTips.init();
	// handle ENTER for query search form
	var querymap = new Ext.KeyMap('query', {
		key: Ext.EventObject.ENTER,
		fn: function() {
			showStatusMsg('Searching...');
			// activate biblio tab
			if( $('#searchloc').val() == 'SearchTargets' ) {
				tabs.getTab(1).activate();
			}
			else if( $('#searchloc').val() == 'Vendors') {
				tabs.getTab(3).activate();
			}
			else if( $('#searchloc').val() == 'All') {
				tabs.getTab(1).activate();
			}
				
			doSearch();
			return false;
		},
		scope: searchform
	});

  layout = new Ext.BorderLayout(document.body, {
      north: {
          split: false,
          titlebar: false,
		  minSize: 100
      },
      center: {
          split: false,
          titlebar: false,
          minSize: 700,
          collapsable: false
      },
	  south: {
	  	split: false,
		titlebar: false,
	}
  });

      tabs = new Ext.TabPanel('tab-panel', 
          {
          resizeTabs: true,
          minTabWidth: 20,
          preferredTabWidth:150
          });
      
  layout.beginUpdate();

  layout.add('north', 
    new Ext.ContentPanel('top-panel', {fittoframe: true})
    );
  layout.add('center', 
    new Ext.ContentPanel('tab-panel', {fittoframe: true})
  );
  layout.endUpdate();
	var saveMenu = new Ext.menu.Menu({
		id: 'saveMenu',
		items: getSaveFileMenuItems()
	});
	var sendMenu = new Ext.menu.Menu({
		id: 'sendMenu',
		items: getSendFileMenuItems()
	});
    editor_toolbar = new Ext.Toolbar('editor-toolbar',
    [
    {
        cls: 'x-btn-text-icon bmenu', // icon and text class
        icon: libPath + 'ui/images/document-save.png',
        text: 'Save',
		menu: saveMenu
	},
	{
        cls: 'x-btn-text-icon bmenu', // icon and text class
        icon: libPath + 'ui/images/document-save.png',
        text: 'Send',
		menu: sendMenu
	},

    {   
        cls: 'x-btn-text-icon', // icon and text class
        icon: libPath + 'ui/images/network-receive.png',
        text: 'Export',
        handler: doDownloadRecords
    },
    {
        cls: 'x-btn-text-icon', // icon and text class
        icon: libPath + 'ui/images/process-stop.png',
        text: 'Cancel',
        handler: function() {
			showStatusMsg('Cancelling record...');
            clear_editor();
			if( UI.lastWindowOpen == 'savegrid' ) {
				displaySaveView();
			}
			else if( UI.lastWindowOpen == 'searchgrid' ) {
				displaySearchView();
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
    ],
    {

    });
	 var handle = new Ext.Toolbar('record-toolbar-handle');
	 handle.add(
	 	new Ext.Toolbar.Separator()
	 );
	 var rectb1 = new Ext.Toolbar('tb1');
	var ffbutton = new Ext.Toolbar.Button({
		//icon: 'ui/images/fixed-field-show-icon.png',
		text: 'FF Editor',
		enableToggle: true,
		pressed: true,
	});
	ffbutton.on('toggle', function(btn, pressed) {
		toggleFixedFieldDisplay(btn, pressed)
	});
	rectb1.add(ffbutton);
	var rectb2 = new Ext.Toolbar('tb2');
	rectb2.add(
		new Ext.Toolbar.Button({
			//icon: 'ui/images/add-icon.png',
			text: 'New',
			menu: new Ext.menu.Menu({
				items: [
					{
						text: 'Add subfield',				
						handler: function() {
							addSubfield(UI.editor.lastFocusedEl);
						}
					},
					{
						text: 'Add field',
						handler: function() {
							addField();
						}
					}
			]})
	}));
	var rectb3 = new Ext.Toolbar('tb3');
	rectb3.add(
		new Ext.Toolbar.Button({
			//icon: 'ui/images/remove-icon.png',
			text: 'Delete',
			menu: new Ext.menu.Menu({
				items: [
					{
						text: 'Remove subfield',
						handler: function() {
							removeSubfield();
						}
					},
					{
						text: 'Remove tag',
						handler: function() {
							removeTag();
						}
					}
			]})
	}));
	$('#record-toolbar').Draggable();

}

