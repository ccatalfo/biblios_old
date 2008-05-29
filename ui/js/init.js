
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
var pazpar2url = 'http://'+ location.hostname + ':' + hostPort + '/pazpar2/search.pz2';
var kohaauthurl = 'http://'+ location.hostname+ ':' + hostPort + '/kohaauth/authorities';


// load xsl docs for transforming marcxml
var marcxsl = xslTransform.loadFile(showMarcXslPath);
//var ffxsl = xslTransform.loadFile(fixedFieldXslPath);
//var varfxsl = xslTransform.loadFile(varFieldsXslPath);
var marc21defs = xslTransform.loadFile(marc21defsPath);
var marc21langdefs = xslTransform.loadFile(marc21langdefsPath);
var marc21ctrydefs = xslTransform.loadFile(marc21ctrydefsPath);
var marc21varfields = xslTransform.loadFile(marc21varfieldsPath);
var marc21controlfields = xslTransform.loadFile(marc21controlfieldsPath);

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
var Macro = Ext.data.Record.create([
	{name: 'rowid'},
	{name: 'name'},
	{name: 'code'},
	{name: 'hotkey'},
	{name: 'file'},
	{name: 'enabled'}
]);
var searches = new Array(); // Array of pazpar2 searches
var searchLimits = {};
var currQuery;


