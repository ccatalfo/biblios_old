// keep prefs in memory
var Prefs = {};
Prefs.remoteILS = {};

function getRemoteBibProfiles() {
	// get bib profiles for each remoteILS now (so xhr requests aren't overlapping)
	for ( ils in Prefs.remoteILS ) {
		Prefs.remoteILS[ ils ].instance.bibprofile();
	}
}

function setILSTargets() {
	// get remote ILS location names so we know when to ask remote ILS for record
	DB.SendTargets.select().each( function(ils) {
			if( ils.enabled == 0 ) {
				delete Prefs.remoteILS[ils.name];
			}
			else if (ils.enabled == 1 ) {
				Prefs.remoteILS[ ils.name ] = {};
				// get params for this ils
				Prefs.remoteILS[ils.name].location = ils.location;
				Prefs.remoteILS[ils.name].user = ils.user;
				Prefs.remoteILS[ils.name].pw = ils.password;
				Prefs.remoteILS[ils.name].url = ils.url;
				var initcall = ils.plugininit;
				// initialize and authorize for this ils instance
				Prefs.remoteILS[ils.name].instance = eval( initcall );
				Prefs.remoteILS[ils.name].instance.initHandler = function(sessionStatus) {
					if( sessionStatus != 'ok' ) {
						Ext.MessageBox.alert('Plugin error', 'Authentication to Koha server at ' + this.url + ' failed.  Response: ' + sessionStatus + '.');
					}
			}
				Prefs.remoteILS[ils.name].instance.bibprofileHandler = function(xml, bibprofileStatus) {
					if( bibprofileStatus != 'ok' ) {
							Ext.MessageBox.alert('Plugin error', 'Retrieval of bibliographic format information from Koha server at ' + this.url + ' failed.  Response: ' + bibprofileStatus + '.  Disabling this plugin.');
					}
					// disable this send target for saving since we have no bib profile for it
					var sendtarget = DB.SendTargets.select('url=?', [ this.url ] ).getOne();
					delete Prefs.remoteILS[ sendtarget.name ];
					sendtarget.enabled = 0;
					sendtarget.save();
				}
				Prefs.remoteILS[ils.name].instance.init(ils.url, ils.user, ils.password);
		};
	});
}

function getTargets() {
	var targets = DB.SearchTargets.select().toArray();
	return targets;
}

function getSaveFileNames() {
	var savefilenames = new Array();
	DB.Savefiles.select().each( function(savefile) {
		var o = {id: savefile.rowid, name: savefile.name};
		savefilenames.push( o );
		UI.save.savefile[ savefile.rowid ] = savefile.name;
	});
	return savefilenames;
}

