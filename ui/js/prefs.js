// keep prefs in memory
var Prefs = {};
Prefs.remoteILS = {};

function initPrefs() {
	setPazPar2Targets(paz);
	setILSTargets();
	getSaveFileNames();
	//getRemoteBibProfiles();
}

function getRemoteBibProfiles() {
	// get bib profiles for each remoteILS now (so xhr requests aren't overlapping)
	for ( ils in Prefs.remoteILS ) {
		Prefs.remoteILS[ ils ].instance.bibprofile();
	}
}

function setILSTargets() {
	// get remote ILS location names so we know when to ask remote ILS for record
	DB.RemoteILS.select().each( function(ils) {
			Prefs.remoteILS[ ils.name ] = {};
			// get params for this ils
			Prefs.remoteILS[ils.name].location = ils.location;
			Prefs.remoteILS[ils.name].user = ils.user;
			Prefs.remoteILS[ils.name].pw = ils.password;
			Prefs.remoteILS[ils.name].url = ils.url;
			var initcall = ils.plugininit;
			// initialize and authorize for this ils instance
			Prefs.remoteILS[ils.name].instance = eval( initcall );
			Prefs.remoteILS[ils.name].instance.init(ils.url, ils.user, ils.password);
	});
}

function getTargets() {
	var targets = DB.Targets.select().toArray();
	return targets;
}

function setEnableTargets() {
  // loop through search targets.  If checked, set enable in Targets table to true. Otherwise set to false.
  var targetnodes = searchRoot.childNodes;
  for( var i = 0; i < targetnodes.length; i++) {
    var id = targetnodes[i].attributes.id;
    var enabled = 0; // assume not checked
    if( targetnodes[i].attributes.checked == true ) {
        enabled = 1;
    }
    var rs;
    try {
       if(debug) { console.info('setting enabled to ' + enabled + ' for target ' + id); }
       rs = db.execute('update Targets set enabled = ? where id = ?', [enabled, id]); 
       rs.close();
    }
    catch(ex) {
      Ext.MessageBox.alert('db error', ex.message);
    }
  }
}

function getSaveFileNames() {
	var savefilenames = new Array();
	try {
		var rs = db.execute('select name, id from Savefiles');
		while( rs.isValidRow() ) {
			var id = rs.fieldByName('id');
			var name = rs.fieldByName('name');
			var o = {id: id, name: name};
			UI.save.savefile[ id ] = name;
			savefilenames.push( o );
			rs.next();
		}
	}
	catch(ex) {
		Ext.MessageBox.alert('db error', ex);
	}
	return savefilenames;
}

