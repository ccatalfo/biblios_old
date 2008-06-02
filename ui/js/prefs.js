// keep prefs in memory
var Prefs = {};
Prefs.remoteILS = {};

function loadConfig(confPath) {
Ext.Ajax.request({
		url: confPath,
		method: 'GET',
		callback: function( options, success, response ) {
            configDoc = (new DOMParser()).parseFromString( response.responseText, 'text/xml');
            setupConfig( configDoc );
        } // end config ajax callback	
	});
}

function setupConfig( configDoc ) {
		  marcFlavor = $("//marcflavor", configDoc).text();
		  encoding = $("//encoding", configDoc).text();
		  $("searching//server", configDoc).each( function() { 
			var hostname = $(this).children('hostname').text();
            var id = $(this).children('id').text();
			var port = $(this).children('port').text();
			var dbname = $(this).children('dbname').text();
			var userid = $(this).children('userid').text();
			var password = $(this).children('password').text();
			var name = $(this).children('name').text();
			var enabled = $(this).children('enabled').text();
			var description= $(this).children('description').text();
			var allowDelete= $(this).children('allowDelete').text();
			var allowModify= $(this).children('allowModify').text();
			// check db if already exists based on name field
			if( t = DB.SearchTargets.select('SearchTargets.rowid=?', [id]).getOne() ) {
				t.hostname = hostname;
				t.port = port;
				t.dbname = dbname;
				t.userid = userid;
				t.password = password;
				t.name = name;
				t.enabled = enabled;
				t.description = description;
				t.syntax = 'marcxml';
                t.allowDelete = allowDelete;
                t.allowModify = allowModify;
				t.save();
			}
			else {
				var t = new DB.SearchTargets({
					hostname: hostname,
					port: port,
					dbname: dbname,
					userid: userid,
					password: password,
					name: name,
					enabled: enabled,
					description: description,
                    allowDelete: allowDelete,
                    allowModify: allowModify,
					syntax: 'marcxml'
				}).save();
			}
		  } );
		  z3950serversSave = $("saving//server", configDoc).each( function() {
				var name = $(this).children('name').text();
                var id = $(this).children('id').text();
				var loc= $(this).children('location').text();
				var url = $(this).children('url').text();
				var user = $(this).children('user').text();
				var password = $(this).children('password').text();
				var pluginlocation = $(this).children('pluginlocation').text();
				var plugininit = $(this).children('plugininit').text();
				var enabled = $(this).children('enabled').text();
                var allowDelete= $(this).children('allowDelete').text();
                var allowModify= $(this).children('allowModify').text();
                var embedded = $(this).children('embedded').text();
				// check db for sendtarget based on name field
				if( t = DB.SendTargets.select('SendTargets.rowid=?', [id]).getOne() ) {
					t.name = name;
					t.location = loc;
					t.url = url;
					t.user = user;
					t.password = password;
					t.pluginlocation = pluginlocation;
					t.plugininit = plugininit;
					t.enabled = enabled;
                    t.allowDelete = allowDelete || 1;
                    t.allowModify = allowModify || 1;
                    t.embedded = embedded || 0;
					t.save();
				}
				else {
					t = new DB.SendTargets({
						name: name,
						location: loc,
						url: url,
						user: user,
						password: password,
						pluginlocation: pluginlocation,
						plugininit: plugininit,
						enabled: enabled,
                        allowDelete: allowDelete || 1,
                        allowModify: allowModify || 1,
                        embedded: embedded || 0
					}).save();
				}
		  });
		  $("//plugins/plugin/file", configDoc).each( function() { plugins += ' ' + $(this).text(); } );
		  $("//templates/template/file", configDoc).each( function() { templates += ' ' + $(this).text(); } );
        if( Ext.get('loadingtext') ) {
            Ext.get('loadingtext').update('Setting up search session');
        }
		initializePazPar2(pazpar2url, {
			initCallback: function() {
                if( this.initStatusOK == true ) {
                    biblios.app.paz.sessionID = this.sessionID;
                    // set searchgrid's data url for pazpar2 show
                    if( Ext.getCmp('searchgrid') && Ext.getCmp('searchgrid').store ) {
                        Ext.getCmp('searchgrid').store.proxy.conn.url = new Ext.data.HttpProxy({url: pazpar2url+'?session='+biblios.app.paz.sessionID+'&command=show'});
                    }
                    // set facets data url for pazpar termlist
                    if( Ext.getCmp('facetsTreePanel') && Ext.getCmp('facetsTreePanel').loader ) {
                        Ext.getCmp('facetsTreePanel').loader = new Ext.ux.FacetsTreeLoader({dataUrl: pazpar2url + '?session='+biblios.app.paz.sessionID+'&command=termlist&name=author,publication-name,subject,date'});
                    }
                    if( Ext.get('loadingtext') ){
                        Ext.get('loadingtext').update('Setting up search targets');
                    }
                    setPazPar2Targets();
                }
                else {
                    if( Ext.get('loadingtext') ) {
                        Ext.get('loadingtext').update('Error initializing search session');
                    }
                }
			}
        });
        if( Ext.get('loadingtext') ) {
            Ext.get('loadingtext').update('Setting up send targets');
        }
        setILSTargets();

        if( Ext.getCmp('FoldersTreePanel') && Ext.getCmp('TargetsTreePanel') ) {
            Ext.getCmp('TargetsTreePanel').root.reload();
            Ext.getCmp('FoldersTreePanel').root.reload();
        }
    }

function reloadConfig() {
    loadConfig( confPath );
}

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
                Prefs.remoteILS[ils.name].embedded = ils.embedded;
				var initcall = ils.plugininit;
				// initialize and authorize for this ils instance
                // try to instantiate plugin
				try {
					Prefs.remoteILS[ils.name].instance = eval( initcall );
					Prefs.remoteILS[ils.name].instance.initHandler = function(sessionStatus) {
						if( sessionStatus != 'ok' ) {
							Ext.MessageBox.alert('Plugin error', 'Authentication to Koha server at ' + this.url + ' failed.  Response: ' + sessionStatus + '.');
						}
                    }
                    // setup handlers for plugin
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
                    // try initing plugin
                    try {
                        Prefs.remoteILS[ils.name].instance.init(ils.url, ils.name, ils.user, ils.password, ils.embedded);
                    } // try clause for xmlhttp req
                    catch( ex ) {
                        if( ex == 'Permission denied to call method XMLHttpRequest.open' ) {
                            Ext.MessageBox.alert('Error', "Error trying to set remote ILS target.<br/>The ILS target's url must be set in Apache's configuration file so that Biblios can request a remote ILS koha instance.  It is currently set to "+ils.url+ " which prevents Biblios from sending and receiving data.  Please check with your system administrator to fix the problem.");
                        }
                        else {
                            Ext.MessageBox.alert('Error', ex.msg);
                        }
                    } // catch xmlhttp req exception
                } // try insantiating plugin and setting up handlers
                catch(ex) {
                    Ext.MessageBox.alert('Error initializing remote ILS plugin ' + ils.name, ex.msg);
                }
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

