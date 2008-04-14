/* global vars for GearsORM Tables */
var DB = {};
DB.Info_Schema = {};
DB.Records = {};
DB.Targets = {};
DB.ILS = {};
DB.Prefs = {};
DB.RemoteILS = {};
DB.Macros = {};
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
		comment: 'Drop old tables from previous biblios version',
		up: function() {
			db.execute('drop table if exists Records;');
			db.execute('drop table if exists Searches;');
			db.execute('drop table if exists Targets;');
			db.execute('drop table if exists Savefiles;');
			db.execute('drop table if exists Prefs;');
			return true;
		},
		down: function() {
			return true;
		}
	},
	{
		version: 1,
		comment: 'Create tables',
		up: function() {
			DB.SearchTargets.createTable();
			DB.Savefiles.createTable();
			DB.Records.createTable();
			DB.Prefs.createTable();
			DB.SendTargets.createTable();
			return true;
		},
		down: function() {
			DB.SearchTargets.dropTable();
			DB.Savefiles.dropTable();
			DB.Records.dropTable();
			DB.Prefs.dropTable();
			DB.SendTargets.dropTable();
			return true;
		}
	},
	{
		version: 2,
		comment: 'Create default Savefiles',
		up: function() {
			var Trash = new DB.Savefiles({
				name: 'Trash',
				description: 'Record to delete',
				parentid: null,
				children: null,
				allowDelete: 0,
				allowAdd: 0,
				allowRename: 0,
				allowDrag: 0,
				allowDrop: 0,
				ddGroup: null,
				icon: libPath + 'ui/images/user-trash.png',
				date_added: 'datetime("now", "localtime"',
				date_mofified: 'datetime("now", "localtime"'
			}).save();
			var Completed = new DB.Savefiles({
				name: 'Completed',
				description: 'Completed records',
				parentid: null,
				children: null,
				allowDelete: 0,
				allowAdd: 1,
				allowRename: 0,
				allowDrag: 0,
				allowDrop: 1,
				ddGroup: 'RecordDrop',
				icon: libPath + 'ui/images/drive-harddisk.png',
				date_added: 'datetime("now", "localtime"',
				date_mofified: 'datetime("now", "localtime"'
			}).save();
			var Drafts = new DB.Savefiles({
				name: 'Drafts',
				description: 'In-progress records',
				parentid: null,
				children: null,
				allowDelete: 0,
				allowAdd: 1,
				allowRename: 0,
				allowDrag: 0,
				allowDrop: 1,
				ddGroup: 'RecordDrop',
				icon: libPath + 'ui/images/drive-harddisk.png',
				date_added: 'datetime("now", "localtime"',
				date_mofified: 'datetime("now", "localtime"'
			}).save();
			return true;
		},
		down: function() {
			DB.Savefiles.remove('name="Trash"');
			DB.Savefiles.remove('name="Completed"');
			DB.Savefiles.remove('name="Drafts"');
			return true;
		}
	},
	{
		version: 3,
		comment: 'Add Macros table',
		up: function() {
			DB.Macros.createTable();
			return true;
		},
		down: function() {
			DB.Macros.dropTable();
			return true;
		}
	},
    {
        version: 4,
        comment: 'Add allowDelete field to Search and Send Targets tables',
        up: function() {
            try {
                var rs = db.execute('ALTER TABLE SearchTargets ADD COLUMN allowDelete integer');
            }
            catch(ex) {
                console.info("Unable to add allowDelete fields to search table: " + ex);
            }
            try {
                var rs = db.execute('ALTER TABLE SendTargets ADD COLUMN allowDelete integer');
            }
            catch(ex) {
                console.info("Unable to add allowDelete fields to send table" + ex);
            }
            return true;
        },
        down: function() {
            // no drop column cmd
            return true;
        }
    },
    {
        version: 5,
        comment: 'Add allowModify field to Search and Send Targets tables',
        up: function() {
            try {
                var rs = db.execute('ALTER TABLE SearchTargets ADD COLUMN allowModify integer');
            }
            catch(ex) {
                console.info("Unable to add allowModify fields to search table: " + ex);
            }
            try {
                var rs = db.execute('ALTER TABLE SendTargets ADD COLUMN allowModify integer');
            }
            catch(ex) {
                console.info("Unable to add allowModify fields to send table" + ex);
            }
            return true;
        },
        down: function() {
            // no drop column cmd
            return true;
        }
    },
    {
        version: 6,
        comment: 'Add embedded field to SendTargets table',
        up: function() {
            try {
                var rs = db.execute('ALTER TABLE SendTargets ADD COLUMN embedded integer');
            }
            catch(ex) {
                console.info('Unable to add embedded column to SendTargets table: ' + ex);
            }
            return true;
        },
        down: function() {
            // no drop column cmd
            return true;
        }
    }
];

function createTestTargets() {
	var NelsonVille = new DB.SearchTargets({
		hostname: '66.213.78.76',
		port: '9999',
		dbname: 'NPLKoha',
		userid: '',
		password: '',
		name: 'Nelsonville Public Library',
		enabled: 1,
		rank: 1,
		description: 'Nelsonville Public Library',
		syntax: null,
		icon: null,
		position: 'primary',
		type: 'zed'
	}).save();
	var LOC = new DB.SearchTargets({
		hostname: 'z3950.loc.gov',
		port: '7090',
		dbname: 'Voyager',
		userid: '',
		password: '',
		name: 'Library of Congress',
		enabled: 1,
		rank: 1,
		description: 'Library of Congress',
		syntax: null,
		icon: null,
		position: 'primary',
		type: 'zed'
	}).save();
}

function removeTestTargets() {
	DB.SearchTargets.remove('name="Nelsonville Public Library"');
	DB.SearchTargets.remove('name="Berwick Library"');
	DB.SearchTargets.remove('name="Library of Congress"');
	DB.SearchTargets.remove('name="CFC Koha"');
}

function init_gears() {
	
			GearsORM.dbName = "biblios";
			db = GearsORM.getDB();
			DB.Info_Schema = new GearsORM.Model({
				name:"Info_Schema",
				fields:
				{
					version: new GearsORM.Fields.Integer({defaultValue: 0})
				}
			});
			if( ! GearsORM.Introspection.doesTableExist('Info_Schema') ) {
				DB.Info_Schema.createTable();
				is = new DB.Info_Schema({version:0}).save();
			}
			DB.SearchTargets = new GearsORM.Model({
				name: 'SearchTargets',
				fields: 
				{
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
					type: new GearsORM.Fields.String(),
					pluginlocation: new GearsORM.Fields.String(),
                    allowDelete: new GearsORM.Fields.Integer({defaultValue:1}),
                    allowModify: new GearsORM.Fields.Integer({defaultValue:1})
				}
			});
			DB.Prefs = new GearsORM.Model({
				name: 'Prefs',
				fields:
				{
					name: new GearsORM.Fields.String(),
					value: new GearsORM.Fields.String(),
					type: new GearsORM.Fields.String(),
					option: new GearsORM.Fields.String()
				}
			});
			DB.Savefiles = new GearsORM.Model({
				name: 'Savefiles',
				fields:
				{
					name: new GearsORM.Fields.String(),
					description: new GearsORM.Fields.String(),
					parentid: new GearsORM.Fields.Integer({allowNull:true}),
					allowDelete: new GearsORM.Fields.Integer(),
					allowAdd: new GearsORM.Fields.Integer(),
					allowRename: new GearsORM.Fields.Integer(),
					allowDrag: new GearsORM.Fields.Integer(),
					allowDrop: new GearsORM.Fields.Integer(),
					ddGroup: new GearsORM.Fields.String(),
					icon: new GearsORM.Fields.String(),
					date_added: new GearsORM.Fields.TimeStamp(),
					date_modified: new GearsORM.Fields.TimeStamp()
				}
			});
			DB.Records = new GearsORM.Model({
				name: 'Records',
				fields: 
				{
					title: new GearsORM.Fields.String(),
					author: new GearsORM.Fields.String(),
					date: new GearsORM.Fields.String(),
					location: new GearsORM.Fields.String(),
					publisher: new GearsORM.Fields.String(),
					medium: new GearsORM.Fields.String(),
					xml: new GearsORM.Fields.String(),
					status: new GearsORM.Fields.String({maxLength: 256}),
					date_added: new GearsORM.Fields.TimeStamp(),
					date_modified: new GearsORM.Fields.TimeStamp(),
					xmlformat: new GearsORM.Fields.String({defaultValue: 'null'}),
					marcflavour: new GearsORM.Fields.String({defaultValue: 'null'}),
					template: new GearsORM.Fields.String({defaultValue: 'null'}),
					marcformat: new GearsORM.Fields.String({defaultValue: 'null'}),
					Savefiles_id: new GearsORM.Fields.Integer(),
					SearchTargets_id: new GearsORM.Fields.Integer()
				}
			});
			DB.SendTargets = new GearsORM.Model({
				name: 'SendTargets',
				fields: 
				{
					name: new GearsORM.Fields.String(),
					location: new GearsORM.Fields.String(),
					url: new GearsORM.Fields.String(),
					user: new GearsORM.Fields.String(),
					password: new GearsORM.Fields.String(),
					pluginlocation: new GearsORM.Fields.String(),
					plugininit: new GearsORM.Fields.String(),
					enabled: new GearsORM.Fields.Integer({defaultValue: 0}),
                    allowDelete: new GearsORM.Fields.Integer({defaultValue:1}),
                    allowModify: new GearsORM.Fields.Integer({defaultValue:1}),
                    embedded: new GearsORM.Fields.Integer({defaultValue:0})
				}
			});
			DB.Macros = new GearsORM.Model({
				name: 'Macros',
				fields:
				{
					name: new GearsORM.Fields.String(),
					code: new GearsORM.Fields.String(),
					hotkey: new GearsORM.Fields.String(),
					file: new GearsORM.Fields.String(),
					enabled: new GearsORM.Fields.Integer({defaultValue:0})
				}
			});
			GearsORMShift.init( DB.Info_Schema, true );
}
