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
var pazpar2url = 'http://eowyn.metavore.com/pazpar2/search.pz2';
init_gears();

Ext.Ajax.request({
    url: 'conf/webcatdb.conf',
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

var showMarcXslPath = "ui/xsl/MARC21slim2HTML.xsl";
var fixedFieldXslPath = "ui/xsl/fixedfields_editor.xsl";
var varFieldsXslPath = "ui/xsl/varfields_editor.xsl";

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
// google gears db handle
var db;
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
// get css styles for marc editor
var editor_css;
$.get('ui/css/editor-styles.css', function(data) {
    editor_css = data;
});
// get css style for jquery autocomplete plugin used in marceditor
var autocomplete_css;
$.get('lib/jquery/jquery.autocomplete.css', function(data) {
	autocomplete_css = data;
});
	
var searches = new Array(); // Array of pazpar2 searches
var paz = initializePazPar2(pazpar2url);


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
			doPazPar2Search();
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

    editor_toolbar = new Ext.Toolbar('editor-toolbar',
    [
    {
        cls: 'x-btn-text-icon', // icon and text class
        icon: 'ui/images/document-save.png',
        text: 'Save',
        handler: function() {
			// get the savefile info for this record
			var savefileid = $("#metadata").children("#savefileid").text();
            if( savefileid == '' ) {
              savefileid = 2; // Drafts
              if(debug) { console.info('Save Button: setting savefileid to Drafts')}
            }
			doSaveLocal(savefileid);
			clearStatusMsg();
		}
    },
    {   
        cls: 'x-btn-text-icon', // icon and text class
        icon: 'ui/images/network-receive.png',
        text: 'Export',
        handler: doDownloadRecords
    },
    {
        cls: 'x-btn-text-icon', // icon and text class
        icon: 'ui/images/process-stop.png',
        text: 'Cancel',
        handler: function() {
            clear_editor();
            displaySaveView();
        }
    },
    {
        cls: 'x-btn-text-icon', // icon and text class
        icon: 'ui/images/edit-copy.png',
        text: 'Merge',
        handler: doMerge,
        disabled: true
    },
    {
        cls: 'x-btn-text-icon', // icon and text class
        icon: 'ui/images/preferences-system.png',
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
	 rectb1.add(
		new Ext.Toolbar.Button({
			//icon: 'ui/images/fixed-field-show-icon.png',
			text: 'FF Editor',
			enableToggle: true,
            pressed: true,
			handler: toggleFixedFieldDisplay
	}));
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
							rte_editor._focusWindow();
							editorSelection = rte_editor._getSelection();
							var selectedElement = editorGetSelectedElement();
							addSubfield(null, selectedElement, editorSelection);
							rte_editor._focusWindow();
						}
					},
					{
						text: 'Add field',
						handler: function() {
							doAddField();
							rte_editor._focusWindow();
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
							doRemoveSubfield();
							rte_editor._focusWindow();
						}
					},
					{
						text: 'Remove tag',
						handler: function() {
							doRemoveTag();
							rte_editor._focusWindow();
						}
					}
			]})
	}));
	 $('#record-toolbar').Draggable();
}

