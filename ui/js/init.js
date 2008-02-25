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
//var ffxsl = xslTransform.loadFile(fixedFieldXslPath);
//var varfxsl = xslTransform.loadFile(varFieldsXslPath);
var marc21defs = xslTransform.loadFile(marc21defsPath);

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
	
var SearchTarget = Ext.data.Record.create([
	{name: 'rowid'},
	{name: 'name', type: 'string'},
	{name: 'hostname', type: 'string'},
	{name: 'port', type: 'string'},
	{name: 'dbname', type: 'string'},
	{name: 'description', type: 'string'},
	{name: 'userid', type: 'string'},
	{name: 'password', type: 'string'},
	{name: 'syntax', type: 'string'},
	{name: 'enabled', type: 'bool'}
]);
var SendTarget = Ext.data.Record.create([
	{name: 'rowid'},
	{name: 'name', type: 'string'},
	{name: 'location', type: 'string'},
	{name: 'url', type: 'string'},
	{name: 'user', type: 'string'},
	{name: 'password', type: 'string'},
	{name: 'pluginlocation', type: 'string'},
	{name: 'plugininit', type: 'string'},
	{name: 'enabled', type: 'bool'}
]);
var searches = new Array(); // Array of pazpar2 searches
var searchLimits = {};
var currQuery;


