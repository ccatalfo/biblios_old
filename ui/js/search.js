function doSearch(form) {
    Ext.getCmp('bibliocenter').layout.setActiveItem(0);
	showStatusMsg('Searching...');
	clearSearchLimits();
    Ext.get('searchprevrecord').update('');
    Ext.getCmp('searchgridSelectAllInStoreTbar').hide();
    var query = Ext.getCmp('query').getValue();
    var searchtype  = Ext.getCmp('searchtypeCombo').getValue();
    var searchquery = 'kw';
    if(searchtype == '') {
        searchquery = query;
    }
    else {
        var searchquery = searchtype + '=' + query;
    }
    var searchloc = Ext.getCmp('searchlocCombo').getValue();
	if( searchloc == 'All' ) {
		doPazPar2Search(searchquery);
		doLocalFolderSearch();
	}
	else if( searchloc == 'Remote' ) {
		doPazPar2Search(searchquery);
		biblios.app.displaySearchView();
	}
	else if( searchloc == 'Local') {
		doLocalFolderSearch();
		biblios.app.displaySaveView();
	}
	return false;
}

function doLocalFolderSearch() {
	//Ext.MessageBox.alert('Error', 'Not yet implemented');
	var query = Ext.getCmp('query').getValue();
	var searchtype  = Ext.getCmp('searchtypeCombo').getValue();
	var selectSql = 'SELECT Records.rowid as Id, Records.title as Title, Records.author as Author, Records.date as DateOfPub, Records.location as Location, Records.publisher as Publisher, Records.medium as Medium, Records.xml as xml, Records.status as Status, Records.date_added as DateAdded, Records.date_modified as DateModified, Records.xmlformat as xmlformat, Records.marcflavour as marcflavour, Records.template as template, Records.marcformat as marcformat, Records.Savefiles_id as Savefiles_id, Records.SearchTargets_id as SearchTargets_id FROM Records ';
	var sql = ' where ';
	switch(searchtype) {
		case 'kw': 
			whereClause = 'Records.title like "%'+query+'%" or Records.author like "%'+query+'%" or Records.xml like "%'+query+'%" or Records.publisher like "%'+query+'%"';
			break;
		case 'ti':
			whereClause = 'Records.title like "%'+query+'%"';
			break;
		case 'au':
			whereClause = 'Records.author like "%'+query+'%"';
			break;
		case 'su':
			whereClause = 'Records.xml like "%'+query+'%"';
			break;
		case 'isbn':
			whereClause = 'Records.xml like "%'+query+'%"';
			break;
		case 'issn':
			whereClause = 'Records.xml like "%'+query+'%"';
			break;
        case '':
            Ext.Msg.alert('Error', 'Advanced searching is not implemented for Local folders.');
            return;
	}
	selectSql += 'where ' + whereClause;
    if(bibliosdebug) {
        console.debug('Searching local db with select sql: ' + selectSql);
    }
	Ext.getCmp('savegrid').store.load({db: db, selectSql: selectSql,params:{start:0,limit:15}});
    if( Ext.getCmp('savegrid').store.getCount() > 0 ) {
        Ext.getCmp('savegridSelectAllTbar').show();
    }
    biblios.app.displaySaveView();
    Ext.getCmp('savegrid').selectNone();
    openState = 'savegrid';
    displayHelpMsg(UI.messages.help.en.saveview);
}

function initPazPar2(pazurl) {
	$.ajax({
        url: pazcgiurl 
        ,method: 'POST'
        ,data: {action:'init', pazpar2url:pazurl}
        ,success: function(json, status) {
            biblios.app.paz.sessionID = json.sessionID;
            setPazPar2Targets();
        }
        ,error: function(req, textStatus, errorThrown) {
            if(bibliosdebug) {
                console.debug('error initializing pazpar2' + req + textStatus + errorThrown);
            }
            biblios.app.initerrors.push({title:'Error', msg: 'Error connecting to PazPar2 search server.  Please contact the administrator for this site.'});
        }
    });
}
function loadPazpar2Target( pazpar2settings ) {
    $.post(pazcgiurl, {action:'settings', settings: pazpar2settings});
}

function getPazTargetName(target) {
	var name = target.hostname;
	if( target.port != '' ){
		name += ':' + target.port;
	}
	if( target.dbname != '' ){
		name += '/' + target.dbname;
	}
	return name;
}
function getDefaultPazSettingsJSON( target ) {
	var db = getPazTargetName( target );
	var settings = {};
	settings["pz:name["+ db +"]"] = target.name;
	settings['pz:requestsyntax['+db+']'] = 'marc21';
	
	settings['pz:elements['+db+']'] = 'F';
	
	settings['pz:nativesyntax['+db+']'] = 'iso2709';
	
	settings['pz:xslt['+db+']'] = 'marc21.xsl';

	settings['pz:allow['+db+']'] = '1';
	
	settings['pz:cclmap:kw['+db+']'] = 'u=1016';
	
	settings['pz:cclmap:au['+db+']']  = 'u=1004 s=al';
	
	settings['pz:cclmap:ti['+db+']'] = 'u=4 s=al';
	
	settings['pz:cclmap:su['+db+']'] = 'u=21 s=al';
	
	settings['pz:cclmap:isbn['+db+']'] = 'u=7';
	
	settings['pz:cclmap:issn['+db+']'] = 'u=8';
	
	settings['pz:cclmap:date['+db+']'] = 'u=30 r=r';
	
	settings['pz:cclmap:pub['+db+']'] = 'u=1018 s=al';
    
    if( target.userid != '') {
        settings['pz:authentication['+db+']'] = target.userid+'/'+target.password; 
    }
    if( biblios.app.pazpar2debug == 1 ) {
        settings['pz:apdulog['+db+']'] = 1;
    }
	return settings;
}

function getPazPar2Settings() {
	var targets = getTargets();
	var settings = new Array();
	for (var i = 0; i < targets.length; i++) {
		if (targets[i].enabled) {
			// load this target into pazpar2 as search target
			if (targets[i].pazpar2settings != '' && targets[i].pazpar2settings != null) {
				var s = Ext.util.JSON.decode(targets[i].pazpar2settings);
				var db = getPazTargetName( targets[i] )
				s['pz:allow[' + db + ']'] = 1;
				settings.push(s);
			}
			else {
				settings.push(getDefaultPazSettingsJSON(targets[i]))
			}
		}
		else if (targets[i].enabled == 0) {
				var db = getPazTargetName( targets[i] )
				var s = {};
				s['pz:name[' + db + ']'] = targets[i].name;
				s['pz:allow[' + db + ']'] = 0;
				settings.push(s);
			}
	}
}

function setPazPar2Targets(callback) {
    showStatusMsg('Setting targets');
    Ext.getCmp('TargetsTreePanel').disable();
    Ext.getCmp('searchButton').disable();
    var settings = getPazPar2Settings();
    $.ajax({
        url: pazcgiurl, 
        callback: callback,
        data: {
            action:'settings', 
            settings: Ext.util.JSON.encode(settings)
        },
        type: 'POST',
        success: function(data, textStatus) {
            if( this.callback ) {
                this.callback(xml);
            }
        },
        error: function(req, textStatus, errorThrown) {
            if( this.callback) {
                this.callback(req);
            }
        }
    });
    Ext.getCmp('TargetsTreePanel').enable();
    Ext.getCmp('searchButton').enable();
    clearStatusMsg();
}

function clearSearchLimits() {
	for( l in UI.searchLimits ) { 
		delete UI.searchLimits[l]; 
	}
}

function doPazPar2Search(query) {
	Ext.getCmp('searchgridEditBtn').disable();
	Ext.getCmp('searchgridExportBtn').disable();
	Ext.getCmp('searchgrid').getGridEl().mask();
	// save this query
	biblios.app.currQuery = query;
    if( biblios.app.fireEvent('beforesearch', getTargets(), query) ) {
        runSearch(query);
    }
}

function runSearch(query) {
    $.ajax({
        url: pazcgiurl
        ,dataType:'json'
        ,data: {action:'search', query:query}
        ,success: function(data) {
            setTimeout(function() {
                Ext.getCmp('searchgrid').store.load({params:{start:0,limit:15}});
                Ext.getCmp('facetsTreePanel').root.reload();
            },
            500);
        }
        ,error: function(req, textStatus, errorThrown) {
            Ext.Msg.alert('Search Error', req.status + req.responseText);
        }
    });
}
function getPazRecord(recId, offset, callback, callbackParamObject) {
	if( recordCache[recId] && offset == 0) {
		if(debug) { console.info('retreiving record from cache');}
		// call the callback with record from record cache
		callback.call(this, recordCache[recId], callbackParamObject);
	}
	// if the record isn't in the cache, ask pazpar2 for it with the supplied callback for record retrieval
	else {
		if(debug) { console.info('retreiving record from pazpar2');}
        try {
            var recordsjson = new Array({recid:recId, offset:offset});
		 	$.ajax({
				url: pazcgiurl,
				data: {
					records: Ext.util.JSON.encode(recordsjson),
					action: 'recid'
				},
				type: 'GET',
				dataType: 'xml',
				recId: recId,
				offset: offset,
				callback: callback,
				callbackParamObject: callbackParamObject,
				success: function(data, textStatus) {
					var id = this.recId;
					var callback = this.callback;
					var callbackParamObject = this.callbackParamObject;
					callback.call(this, data, callbackParamObject);
				},
				error: function(req, textStatus, errorThrown) {
				}
			});
		}
        catch(ex) {
         	Ext.MessageBox.alert('Pazpar2 error', ex.message);
        }
	}
}
function getRemoteRecord(id, loc, offset, callback, callbackparamobject) {
		// if this location is in our Prefs.remoteILS hash, retrieve it specially
		if( Prefs.remoteILS[loc] ) {
			// the recid we'll request
			var recid = '';
			// get xml for the record we wantt to retrieve
			var xml = recordCache[id];
			if( xml ) {
				// try to load xmldoc from xml string and extract recid based on this location's xpath for recid
				try {
					xmldoc = xslTransform.loadString(xml);
					recid = $(Prefs.remoteILS[loc].instance.recidXpath, xmldoc).text();
				}
				catch(ex) {
					Ext.MessageBox.alert('Error', 'Error loading xml for record id ' + id);
				}
			}
			// otherwise we're requesting from remote ils via its own recid already
			else {
				recid = id;
			}
			Prefs.remoteILS[loc].instance.retrieveHandler = callback;
			Prefs.remoteILS[loc].instance.retrieve(recid);
		}
		else {
			var xml = getPazRecord(id, offset, callback, callbackparamobject);
		}
}


function term2searchterm(term) {
	switch(term) {
		case 'title':
			return 'ti';
			break;
		case 'date':
			return 'date';
			break;
		case 'author':
			return 'au';
			break;
		case 'subject':
			return 'su';
			break;
		case 'publication-name':
			return 'pub';
			break;
	}
}
function filterSearch() {
    // hide select all in search results tbar
    Ext.getCmp('searchgridSelectAllInStoreTbar').hide();
	var i = 0;
    var filter = '';
	for( f in UI.searchFilters ) {
        if(i == 0) { filter = 'pz:id=';}
		if(i > 0) {filter += '|';}
		filter += f;
		i++;
	}
	if(filter == '') {
        runSearch(biblios.app.currQuery);
	}
	else {
        runSearch(biblios.app.currQuery, filter);
	}
}

function limitSearch() {
    // hide select all in search results tbar
    Ext.getCmp('searchgridSelectAllInStoreTbar').hide();
	// start w/ original query and build from there
	var query = $("#query").val();
	for( name in UI.searchLimits ) {
		query += ' and ' + term2searchterm(UI.searchLimits[name]) + '="' + name + '"';
	}
    doPazPar2Search(query);
	biblios.app.displaySearchView();
}

function handleLocationClick(recid, offset) {
	Ext.select('.locationitem').removeClass('location-click');
	Ext.get('loc'+offset+recid).addClass('location-click');
	previewRemoteRecord(recid, offset);
}

var pzStateToCss = {
Client_Connecting: '',
Client_Connected: '',
Client_Idle: '',
Client_Initializing: '',
Client_Searching: '',
Client_Presenting: '',
Client_Error: '',
Client_Failed: '',
Client_Disconnected: '',
Client_Stopped: '',
Client_Continue: ''
};

function refreshTargetHits(){
	$.getJSON(pazcgiurl, {
		action: 'bytarget'
	}, function(data){
		var nodes = Ext.getCmp('TargetsTreePanel').root.childNodes;
		for (var i = 0; i < data.targets.length; i++) {
			for (var j = 0; j < nodes.length; j++) {
				var pazid = nodes[j].attributes.pazid;
                var state = data.targets[i].state;
                var diagnostic = data.targets[i].diagnostic;
				if (pazid == data.targets[i].id) {
					if (nodes[j]) {
						nodes[j].setText(nodes[j].attributes.servername + ' (' + data.targets[i].records + ')');
                        var classToAdd = pzStateToCss[state];
                        nodes[j].getUI().addClass(classToAdd);
					}
				}
			}
		}
	});
}
