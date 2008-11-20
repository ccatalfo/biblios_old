// keep prefs in memory
var Prefs = {};
Prefs.remoteILS = {};

function loadConfig(confPath, callback) {
    $.ajax({
        url: confPath,
		cache:false,
		dataType: 'xml',
        callback: callback,
        error: function(req, textStatus, errorThrow) {
            biblios.app.initerrors.push({title: 'Biblios Configuration Error', msg: 'Unable to load biblios.conf configuration file ' + textStatus});
        },
        success: function(data, textStatus) {
            configDoc = data;
            setupConfig(data);
            this.callback.call(this);
        }
    });
}

function importMacroFromFile(name, code, enabled) {
    // see if already is loaded into gears db
    if( m = DB.Macros.select('Macros.name=?',[name]).getOne() ) {
        // update macro code
        m.code = code;
        m.enabled = enabled;
        m.save();
    }
    else {
        var m = new DB.Macros({
            name : name,
            code : code,
            enabled : enabled
        }).save();
    }
}

function setupConfig( configDoc ) {
		  marcFlavor = $("//marcflavor", configDoc).text();
		  encoding = $("//encoding", configDoc).text();
		  pazpar2url = $("//pazpar2url", configDoc).text();
		  sruauthurl = $("//sruauthurl", configDoc).text();
          $("macros//macro", configDoc).each( function() {
            var name = $(this).attr('name');
            var file = $(this).attr('file');
            var enabled = $(this).attr('enabled');
            $.ajax({
                url: uiPath + file,
                macroname: name,
                macroenabled: enabled,
                success: function(data, textStatus) {
                    importMacroFromFile(this.macroname, data, this.macroenabled);
                },
                error: function(req, textStatus, errorThrown) {
                    Ext.Msg.alert('Error', 'Error loading macro: ' + this.macroname + ' ' + errorThrown);
                }
            });
              clearStatusMsg();
          });
	  DB.SearchTargets.remove('SearchTargets.sysdefined=1');
		  $("searching//server", configDoc).each( function() { 
			var hostname = $(this).children('hostname').text();
			var sysdefined = $(this).children('sysdefined').text();
			var port = $(this).children('port').text();
			var dbname = $(this).children('dbname').text();
			var userid = $(this).children('userid').text();
			var password = $(this).children('password').text();
			var name = $(this).children('name').text();
			var enabled = $(this).children('enabled').text();
			var description= $(this).children('description').text();
			var allowDelete= $(this).children('allowDelete').text();
			var allowModify= $(this).children('allowModify').text();
			var pazpar2settings= $(this).children('pazpar2settings').text();
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
					pazpar2settings: pazpar2settings,
					syntax: 'marcxml',
					sysdefined: sysdefined
				}).save();
		  } );
          $("plugins//plugin", configDoc).each( function() {
            var name = $(this).children('name').text();
            var file = $(this).children('file').text();
            var type = $(this).children('type').text();
            var enabled = $(this).children('enabled').text();
            var initcall = $(this).children('initcall').text();
			var allowDelete= $(this).children('allowDelete').text();
			var allowModify= $(this).children('allowModify').text();
            if( p = DB.Plugins.select('name=?', [name]).getOne() ) {
                p.file = file;
                p.type = type;
                p.enabled = enabled;
                p.initcall = initcall;
                p.allowDelete = allowDelete;
                p.allowModify = allowModify;
                p.save();
            }
            else {
                var p = new DB.Plugins({
                    name : name,
                    file : file,
                    type: type,
                    enabled : enabled,
                    initcall : initcall,
                    allowDelete : allowDelete,
                    allowModify : allowModify
                }).save();
            }
          });
          // clear old editor data from gears db so we can reload from config
          DB.Editors.remove();
          $("editors//editor", configDoc).each( function() {
            var syntax = $(this).children('syntax').text();
            var name = $(this).children('name').text();
            if( e = DB.Editors.select('name=?', [name]).getOne() ) {
                e.syntax = syntax;
                e.save();
            }
            else {
                var e = new DB.Editors({
                    name: name,
                    syntax: syntax
                }).save();
            }
          });
	  DB.SendTargets.remove('SendTargets.sysdefined=1');
		  z3950serversSave = $("saving//server", configDoc).each( function() {
				var name = $(this).children('name').text();
				var sysdefined = $(this).children('sysdefined').text();
				var loc= $(this).children('location').text();
				var url = $(this).children('url').text();
				var user = $(this).children('user').text();
				var password = $(this).children('password').text();
				var plugin= $(this).children('plugin').text();
				var enabled = $(this).children('enabled').text();
                var allowDelete= $(this).children('allowDelete').text();
                var allowModify= $(this).children('allowModify').text();
                var embedded = $(this).children('embedded').text();
                var searchtarget = $(this).children('searchtarget').text();
					t = new DB.SendTargets({
						name: name,
						sysdefined: sysdefined,
						location: loc,
						url: url,
						user: user,
						password: password,
						plugin: plugin,
						enabled: enabled,
                        allowDelete: allowDelete || 1,
                        allowModify: allowModify || 1,
                        embedded: embedded || 0,
                        searchtarget: searchtarget || ''
			}).save();
		      });
	    		  $("//plugins/plugin/file", configDoc).each( function() { plugins += ' ' + $(this).text(); } );
		  $("//templates/template/file", configDoc).each( function() { templates += ' ' + $(this).text(); } );
        
        $('//icons/resources_panel', configDoc).children().each( function(i,j) {
            UI.icons.resources.searching = $(this).children('searching').text();

        });
        if( Ext.getCmp('FoldersTreePanel') && Ext.getCmp('TargetsTreePanel') ) {
            Ext.getCmp('TargetsTreePanel').root.reload();
            Ext.getCmp('FoldersTreePanel').root.reload();
        }
    }

function reloadConfig() {
    loadConfig( confPath, function() {
    
    });
}

function getRemoteBibProfiles() {
	// get bib profiles for each remoteILS now (so xhr requests aren't overlapping)
	for ( ils in Prefs.remoteILS ) {
		Prefs.remoteILS[ ils ].instance.bibprofile();
	}
}

function loadEmbeddedRecord() {
    // if we have xml in recordxml (passed in by embedding system) open in editor
    if( recordxml != '' ) {
        showStatusMsg('Loading remote record');
        UI.editor.loading.numToLoad = 1;
        UI.editor.loading.numLoaded = 0;
        UI.editor.progress = Ext.Msg.progress(
            'Loading record',
            'Retrieving and formatting record',
            '0%'
        );
        openRecord( recordxml, '', 'marcxml');
        clearStatusMsg();
    }
}

function loadPlugins() {
    biblios.app.numPlugins = DB.Plugins.select('enabled=1').toArray().length;
    DB.Plugins.select('enabled=1').each( function(plugin) {
        $.getScript( libPath + plugin.file, function(data, textstatus) {
            biblios.app.numPlugins--;
            if( biblios.app.numPlugins == 0 ) {
                setILSTargets();
                displayInitErrors();
                loadEmbeddedRecord();
            }
        });
    });
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
                Prefs.remoteILS[ils.name].plugin = ils.plugin;
                var plugin = DB.Plugins.select('name=?', [ils.plugin]).getOne();
				var initcall = plugin.initcall;
				// initialize and authorize for this ils instance
                // try to instantiate plugin
				try {
					Prefs.remoteILS[ils.name].instance = eval( initcall );
					Prefs.remoteILS[ils.name].instance.initHandler = function(sessionStatus) {
						if( sessionStatus != 'ok' ) {
							biblios.app.initerrors.push({title: 'Plugin error', msg: 'Authentication to Koha server at ' + this.url + ' failed.  Response: ' + sessionStatus + '.'});
						}
                    }
                    // setup handlers for plugin
                    Prefs.remoteILS[ils.name].instance.bibprofileHandler = function(xml, bibprofileStatus) {
                        if( bibprofileStatus != 'ok' ) {
                            biblios.app.initerrors.push({title: 'Plugin error', msg: 'Retrieval of bibliographic format information from Koha server at ' + this.url + ' failed.  Response: ' + bibprofileStatus + '.  Disabling this plugin.'});
                            // disable this send target for saving since we have no bib profile for it
                            var sendtarget = DB.SendTargets.select('url=?', [ this.url ] ).getOne();
                            delete Prefs.remoteILS[ sendtarget.name ];
                            sendtarget.enabled = 0;
                            sendtarget.save();
                            Ext.getCmp('sendtargetsgrid').store.reload();
                        }
                    }
                    // try initing plugin
                    try {
                        Prefs.remoteILS[ils.name].instance.init({
                            url:ils.url, 
                            name:ils.name, 
                            user:ils.user, 
                            password: ils.password, 
                            embedded: ils.embedded
                        });
                    } // try clause for xmlhttp req
                    catch( ex ) {
                        if( ex == 'Permission denied to call method XMLHttpRequest.open' ) {
                            biblios.app.initerrors.push({title: 'Error', msg: "Error trying to set remote ILS target.<br/>The ILS target's url must be set in Apache's configuration file so that Biblios can request a remote ILS koha instance.  It is currently set to "+ils.url+ " which prevents Biblios from sending and receiving data.  Please check with your system administrator to fix the problem."});
                        }
                        else {
                            biblios.app.initerrors.push({title: 'Error', msg: ex.message});
                        }
                    } // catch xmlhttp req exception
                } // try insantiating plugin and setting up handlers
                catch(ex) {
                    biblios.app.initerrors.push({title: 'Error initializing remote ILS plugin ' + ils.name, msg: ex.msg});
                }
		}; // if this sendtarget is enabled
	});
}

function getTargets() {
	var targets = DB.SearchTargets.select().toArray();
	return targets;
}

function getTargetsForCombo() {
    var list = new Array();
	var targets = DB.SearchTargets.select().toArray();
    for( var i = 0; i < targets.length; i++) {
        list.push([targets[i].rowid,targets[i].name]);
    }
    return list;
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

