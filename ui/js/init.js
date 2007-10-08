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
var srchResultsProcessor = new XSLTProcessor();
var xslDoc = Sarissa.getDomDocument();
xslDoc.load("ui/xsl/search_results.xsl");
srchResultsProcessor.importStylesheet(xslDoc);

var ShowMarcProcessor = new XSLTProcessor();
var fullRecordXSLDoc = Sarissa.getDomDocument();
fullRecordXSLDoc.load("ui/xsl/MARC21slim2HTML.xsl");
ShowMarcProcessor.importStylesheet(fullRecordXSLDoc);

var MarcFixedFieldsProcessor = new XSLTProcessor();
var MarcFixedFieldsProcessor_XSL = Sarissa.getDomDocument();
MarcFixedFieldsProcessor_XSL.load("ui/xsl/fixedfields_editor.xsl");
MarcFixedFieldsProcessor.importStylesheet(MarcFixedFieldsProcessor_XSL);

var MarcVarFieldsProcessor = new XSLTProcessor();
var MarcVarFieldsProcessor_XSL = Sarissa.getDomDocument();
MarcVarFieldsProcessor_XSL.load("ui/xsl/varfields_editor.xsl");
MarcVarFieldsProcessor.importStylesheet(MarcVarFieldsProcessor_XSL);

var srchResults = Sarissa.getDomDocument("", "collection");
var srchResNum = 0; // number of search queries
var recordNum = 0; // number of individual records found and saved to db
var newRecordNum = 0; // number of individual records found and saved to db
var resultsDoc;
// tabs
var tabs;
var maintab;
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
var searchsavegrid;
var searchsaveds;
var searchmodel;
// grid and data store for save file
var savefilegrid;
var savefileds;
var savefilemodel;
var searchgridpaging;
var savegridpaging;
// record cache for save files
var recordCache = {};
// panels
var status_panel, folderlist_panel, toolbar_panel, work_panel, upper_panel, lower_panel, right_panel, left_panel;
// trees
var searchTree, saveTree, saveFilesTree, treeEditor;
var folderRoot, searchRoot, saveRoot, saveFilesRoot;
// YUI rich text editor
var rte_editor;
// get css styles for marc editor
var editor_css;
$.get('ui/css/editor-styles.css', function(data) {
    editor_css = data;
});


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

  layout = new Ext.BorderLayout(document.body, {
      north: {
          split: false,
          titlebar: false,
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
      searchform = new Ext.form.Form({
        labelAlign: 'left',
        method: 'GET',
        url: searchScript
      });
    var store = new Ext.data.SimpleStore({
        fields: ['type', 'desc'],
        data: [
            ['kw:', 'Keyword'],
            ['ti:', 'Title'],
            ['au:', 'Author'],
            ['su:', 'Subject'],
            ['is:', 'ISBN']
        ]		    
        });
      searchform.column(
        {width:300, style: 'margin-left:200px'},
        new Ext.form.TextField({
          fieldLabel: 'Search',
          name: 'query',
          id: 'query',
          width: 300 
        })
        );
        searchform.column(
        {width: 400, style: 'margin-left:0px'},
          new Ext.form.ComboBox({
            id: 'searchtype',
            store: store,
            displayField:'desc',
            valueField: 'type',
            typeAhead: true,
            mode: 'local',
            triggerAction: 'all',
            emptyText:'Select a search type...',
            selectOnFocus:true	
          })
        );
        var map = new Ext.KeyMap("searchform", {
          key: 13, // or Ext.EventObject.ENTER
          fn: function() {
              doSearchZ3950();
          },
          scope: searchform
      });
        searchform.render('searchform');

    editor_toolbar = new Ext.Toolbar('editor-toolbar',
    [
    {
        cls: 'x-btn-text-icon', // icon and text class
        icon: 'ui/images/document-save.png',
        text: 'Save',
        handler: function() {
			// get the savefile info for this record
			var savefileid = $("#metadata").children("#savefileid").text();
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


