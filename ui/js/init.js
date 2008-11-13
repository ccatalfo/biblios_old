
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
var pazcgiurl = cgiDir +'paz.pl';
var pazpar2url = 'http://localhost:9004';
var kohaauthurl = 'http://'+ location.hostname+ ':' + hostPort + '/kohaauth/authorities';



var recordNum = 0; // number of individual records found and saved to db
var newRecordNum = 0; // number of individual records found and saved to db
var resultsDoc;

// record cache for search results
var recordCache = {};

var PazPar2Results = Ext.data.Record.create([
    {name: 'title', mapping: 'title'},
    {name: 'author', mapping:'author'},
    {name: 'publisher', mapping:'publication-name'},
    {name: 'date', mapping: 'date'},
    {name: 'medium', mapping:'medium'},
    {name: 'recid', mapping:'recid'},
    {name: 'checked' },
    {name: 'fullrecord'},
    {name: 'location_name', mapping:'location_name'},
    {name: 'location_id', mapping:'location_id'},
    {name: 'count', mapping: 'count'}																
    ]); 
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
	{name: 'enabled', type: 'bool'},
    {name: 'pazpar2settings', type: 'string'}
]);
var SendTarget = Ext.data.Record.create([
	{name: 'rowid'},
	{name: 'name', type: 'string'},
	{name: 'location', type: 'string'},
	{name: 'url', type: 'string'},
	{name: 'user', type: 'string'},
	{name: 'password', type: 'string'},
	{name: 'plugin', type: 'string'},
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
var Plugin = new Ext.data.Record.create([
    {name: 'rowid'},
    {name: 'name'},
    {name: 'file'},
    {name: 'type'},
    {name: 'initcall'},
    {name: 'enabled'}
]);
var searches = new Array(); // Array of pazpar2 searches
var searchLimits = {};
var currQuery;


