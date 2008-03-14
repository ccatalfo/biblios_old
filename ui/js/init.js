
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
var marc21langdefs = xslTransform.loadFile(marc21langdefsPath);

var recordNum = 0; // number of individual records found and saved to db
var newRecordNum = 0; // number of individual records found and saved to db
var resultsDoc;

// record cache for search results
var recordCache = {};
	
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


