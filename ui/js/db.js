/* global vars for GearsORM Tables */
var DB = {};
DB.Info_Schema = {};
DB.Records = {};
DB.Targets = {};
DB.ILS = {};
DB.Prefs = {};
DB.Searches = {};
var db = {};

/*
   Function: init_gears

   Initialize Google Gears sqlite database.

   Parameters:

   None.

   Returns:

   None.

*/
GearsORMShift.rules = [
	{
		version: 0,
		comment: 'Default rule 0',
		up: function() {
			return true;
		},
		down: function() {
			return true;
		}
	},
	{
		version: 1,
		comment: 'Create Records table',
		up: function() {
			DB.Records.createTable();
			return true;
		},
		down: function() {
			DB.Records.dropTable();
			return true;
		}
	},
	{
		version: 2,
		comment: 'Create Targets table',
		up: function() {
			DB.Targets.createTable();
			return true;
		},
		down: function() {
			DB.Targets.dropTable();
			return true;
		}
	}
];

function init_gears() {
	
			GearsORM.dbName = "catalogingProject";
			db = GearsORM.getDB();
			DB.Info_Schema = new GearsORM.Model({
				name:"Info_Schema",
				fields:
				{
					version: new GearsORM.Fields.Integer()
				}
			});
			DB.Info_Schema.createTable();
			DB.Records = new GearsORM.Model({
				name: 'Records',
				fields: 
				{
					id: new GearsORM.Fields.Integer(),
					xml: new GearsORM.Fields.String(),
					stat: new GearsORM.Fields.String({maxLength: 256}),
					date_added: new GearsORM.Fields.TimeStamp(),
					date_modified: new GearsORM.Fields.TimeStamp(),
					server: new GearsORM.Fields.ManyToOne({related: "Target"}),
					savefile: new GearsORM.Fields.ManyToOne({related: "Savefile"}),
					xmlformat: new GearsORM.Fields.String({defaultValue: 'null'}),
					marcflavour: new GearsORM.Fields.String({defaultValue: 'null'}),
					template: new GearsORM.Fields.String({defaultValue: 'null'}),
					marcformat: new GearsORM.Fields.String({defaultValue: 'null'})
				}
			});
			DB.Targets = new GearsORM.Model({
				name: 'Targets',
				fields: 
				{
					id: new GearsORM.Fields.Integer(),
					hostname: new GearsORM.Fields.String(),
					port: new GearsORM.Fields.Integer(),
					dbname: new GearsORM.Fields.String(),
					userid: new GearsORM.Fields.String(),
					password: new GearsORM.Fields.String(),
					name: new GearsORM.Fields.String(),
					enabled: new GearsORM.Fields.Integer(),
					rank: new GearsORM.Fields.Integer(),
					description: new GearsORM.Fields.String(),
					syntax: new GearsORM.Fields.String(),
					icon: new GearsORM.Fields.String(),
					position: new GearsORM.Fields.String(),
					type: new GearsORM.Fields.String()
				}
			});
			GearsORMShift.init( DB.Info_Schema, true );

>>>>>>> Initial attempt at using GearsORM migration rules.  Believe it's working when migrating up or down.:ui/js/db.js
}


/*
   Function: dropTables

   Drop all tables in the sqlite database.

   Parameters:

   None.

   Returns:

   None.

*/
function dropTables() {
    try {
	rs = db.execute('drop table if exists Records');
	rs = db.execute('drop table if exists Searches');
	rs = db.execute('drop table if exists SaveFiles');
	rs = db.execute('drop table if exists Targets');
	rs = db.execute('drop table if exists Prefs');
    }
    catch(ex) {
	alert(ex.message);
    }
}

/*
   Function: createTables

   (Re)create all tables in the sqlite database.

   Parameters:

   None.

   Returns:

   None.

*/
function createTables() {
    try {
	// (re)create tables 
	rs = db.execute('create table if not exists Records (id integer primary key autoincrement, xml text, status varchar(256), date_added date, date_modified date, server integer, savefile integer, xmlformat varchar(255) default null, marcflavor varchar(255) default null, template varchar(255) default null, marcformat varchar(255) default null)');
	rs = db.execute('create table if not exists Searches (id integer primary key autoincrement, xml text, query text, servers text, date_added date, searchname text)');
	rs = db.execute('create table if not exists Savefiles (id integer primary key autoincrement, name text, description text, parentid integer, allowDelete boolean, allowAdd boolean, allowRename boolean, allowDrag boolean, allowDrop boolean, ddGroup text, icon text, date_added date, date_modified date)');
	rs = db.execute('create table if not exists Targets (id integer primary key autoincrement, hostname varchar(255) default null, port integer default null, dbname varchar(255) default null, userid varchar(255) default null, password varchar(255) default null, name text, enabled boolean default 0, rank integer default null, description text, syntax varchar(80) default null, icon text, position text default "primary", type not null default "zed")');
	rs = db.execute('create table if not exists targetPlugins (id integer primary key autoincrement, targetid integer, command varchar(255) default null, func varchar(255) default null)');
	rs = db.execute('create table if not exists Prefs (id integer primary key autoincrement, name text, value text, type text, option text)');
    }
    catch(ex) {
	Ext.MessageBox.alert("DB error", ex.message);
    }
}

/*
   Function: resetDatabase

   Reset the sqlite database (drop all tables, recreate tables, insert default data)

   Parameters:

   None.

   Returns:

   None.

*/
function resetDatabase() {
    try {
	dropTables();	
	createTables();
    }
    catch(ex) {
	Ext.message.alert(ex.message);
    }
}

/*
   Function: setupSaveFiles

   Add data to Savefiles table for non-deletable savefiles (Trash, Drafts, Complete).

   Parameters:

   None.

   Returns:

   None.

*/
function setupSaveFiles() {
    try{
	// set up Savefiles table with default Drafts, Complete, Trash folders
	rs = db.execute('insert or ignore into Savefiles (id, name, description, parentid, allowDelete, allowAdd, allowRename, allowDrag, allowDrop, ddGroup, icon, date_added, date_modified) values (1, "Trash", "Place items to be deleted here", null, 0, 0, 0, 0, 0, null, "ui/images/user-trash.png", datetime("now", "localtime"), datetime("now", "localtime"))');
	rs = db.execute('insert or ignore into Savefiles (id, name, description, parentid, allowDelete, allowAdd, allowRename, allowDrag, allowDrop, ddGroup, icon,date_added, date_modified) values (2, "Drafts", "Place in progress items here", null, 0, 1, 0, 0, 1, "RecordDrop", "ui/images/drive-harddisk.png",datetime("now", "localtime"), datetime("now", "localtime"))');
	rs = db.execute('insert or ignore into Savefiles (id, name, description, parentid, allowDelete, allowAdd, allowRename, allowDrag, allowDrop, ddGroup, icon,date_added, date_modified) values (3, "Complete", "Place completed items here", null, 0, 1, 0, 0, 1, "RecordDrop", "ui/images/drive-harddisk.png", datetime("now", "localtime"), datetime("now", "localtime"))');
    }
    catch(ex) {
	Ext.MessageBox.alert('db error', ex.message);
    }
}


/*
   Function: setupTargets

   Add data to Targets table for testing.

   Parameters:

   None.

   Returns:

   None.

*/
function setupTestTargets() {
  try {
    rs = db.execute('insert or ignore into Targets (id, hostname, port, dbname, userid, password, name, enabled, rank, description, syntax, icon, position, type) values (1, "66.213.78.76", 9999, "NPLKoha", "", "", "Nelsonville Public Library", 1, 1, "Nelsonville Public Library", null, null, "primary", "zed");');
    rs = db.execute('insert or ignore into Targets (id, hostname, port, dbname, userid, password, name, enabled, rank, description, syntax, icon, position, type) values (2, "zconn.lib.monash.edu.au", 7090, "Voyager", "", "", "Berwick Library", 1, 1, "Berwick Library, Monash University", null, null, "primary", "zed");');
    rs = db.execute('insert or ignore into Targets (id, hostname, port, dbname, userid, password, name, enabled, rank, description, syntax, icon, position, type) values (3, "z3950.lib.byu.edu", 2200, "unicorn", "", "", "Brigham Young University", 1, 1, "Brigham Young University", null, null, "primary", "zed");');
    rs = db.execute('insert or ignore into Targets (id, hostname, port, dbname, userid, password, name, enabled, rank, description, syntax, icon, position, type) values (4, "z3950.loc.gov", 7090, "voyager", "", "", "Library of Congress", 1, 1, "Library of Congress", null, null, "primary", "zed");');
    rs = db.execute('insert or ignore into Targets (id, hostname, port, dbname, userid, password, name, enabled, rank, description, syntax, icon, position, type) values (5, "arwen.metavore.com", 9820, "biblios", "", "", "Koha-cfc", 1, 1, "Koha-cfc", null, null, "primary", "zed");');

  }
  catch(ex) {
    Ext.MessageBox.alert('db error', ex.message);
  }
}

// test prefs for koha integration
function setupKohaPlugin() {
	try {
		rs = db.execute("insert or ignore into Prefs (id, name, value, type, option) values (1, 'remoteILS', 'Koha-cfc', 'koha', '')");
		rs = db.execute("insert or ignore into Prefs (id, name, value, type, option) values (2, 'remoteILSUrl', 'http://eowyn.metavore.com/kohaapi/', 'koha', '')");
		rs = db.execute("insert or ignore into Prefs (id, name, value, type, option) values (3, 'remoteUser', 'marian', 'koha', '')");
		rs = db.execute("insert or ignore into Prefs (id, name, value, type, option) values (4, 'remotePassword', 'marian', 'koha', '')");
		rs = db.execute("insert or ignore into Prefs (id, name, value, type, option) values (5, 'ilspluginlocation', 'plugins/koha.js', 'koha', '')");
		rs = db.execute("insert or ignore into Prefs (id, name, value, type, option) values (6, 'ilsinitcall', 'new koha();', 'koha', '')");
	}
	catch(ex) {
		Ext.MessageBox.alert('db error on setting test prefs', ex.message);
	}
}

