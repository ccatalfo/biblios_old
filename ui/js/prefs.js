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
				try {
					Prefs.remoteILS[ils.name].instance = eval( initcall );
					Prefs.remoteILS[ils.name].instance.initHandler = function(sessionStatus) {
						if( sessionStatus != 'ok' ) {
							Ext.MessageBox.alert('Plugin error', 'Authentication to Koha server at ' + this.url + ' failed.  Response: ' + sessionStatus + '.');
						}
				}
					Prefs.remoteILS[ils.name].instance.bibprofileHandler = function(xml, bibprofileStatus) {
						if( bibprofileStatus != 'ok' ) {
							Ext.MessageBox.alert('Plugin error', 'Retrieval of bibliographic format information from Koha server at ' + this.url + ' failed.  Response: ' + bibprofileStatus + '.  Disabling this plugin.');
							// disable this send target for saving since we have no bib profile for it
							var sendtarget = DB.SendTargets.select('url=?', [ this.url ] ).getOne();
							delete Prefs.remoteILS[ sendtarget.name ];
							sendtarget.enabled = 0;
							sendtarget.save();
							Ext.getCmp('sendtargetsgrid').store.reload();
						}
						else {
							// if openOnLoadRecId if defined, request it from the plugin whose url matches embeddedUrl
							if( openOnLoadRecId ) {
								if( this.embedded ) {
									UI.editor.progress = Ext.MessageBox.progress('Loading record', '');
									UI.editor['editorone'].location = this.name;
									UI.editor['editorone'].id = '';
									UI.editor.progress.updateProgress(.4, 'Retrieving record from Koha');
									getRemoteRecord( openOnLoadRecId, this.name, 0, function(data) {
										openRecord( xslTransform.serialize(data), 'editorone');
										UI.editor.progress.updateProgress(.8, 'Loading into Marc editor');
									});
									// make sure we don't try to open this again if we reset this send target
									delete openOnLoadRecId;
									UI.editor.progress.updateProgress(1, 'Loading completed');
								}
							}
						}
					}
					Prefs.remoteILS[ils.name].instance.init(ils.url, ils.name, ils.user, ils.password);
				} // try clause for xmlhttp req
				catch( ex ) {
					if( ex == 'Permission denied to call method XMLHttpRequest.open' ) {
						Ext.MessageBox.alert('Error', "Error trying to set remote ILS target.<br/>The ILS target's url must be set in Apache's configuration file so that Biblios can request a remote ILS koha instance.  It is currently set to "+ils.url+ " which prevents Biblios from sending and receiving data.  Please check with your system administrator to fix the problem.");
					}
				} // catch xmlhttp req exception
		}; // if this sendtarget is enabled
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

