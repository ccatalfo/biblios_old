function doSearch(form) {
	showStatusMsg('Searching...');
	if( $('#searchloc').val() == 'All' ) {
		doPazPar2Search();
		doLocalFolderSearch();
	}
	else if( $('#searchloc').val() == 'SearchTargets' ) {
		doPazPar2Search();
		biblios.app.displaySearchView();
	}
	else if( $('#searchloc').val() == 'LocalFolders') {
		doLocalFolderSearch();
		biblios.app.displaySaveView();
	}
	return false;
}

function doLocalFolderSearch() {
	//Ext.MessageBox.alert('Error', 'Not yet implemented');
	var query = $('#query').val();
	var searchtype  = $("#searchtype").val();
	var selectSql = 'SELECT Records.rowid as Id, Records.title as Title, Records.author as Author, Records.date as DateOfPub, Records.location as Location, Records.publisher as Publisher, Records.medium as Medium, Records.xml as xml, Records.status as Status, Records.date_added as DateAdded, Records.date_modified as DateModified, Records.xmlformat as xmlformat, Records.marcflavour as marcflavour, Records.template as template, Records.marcformat as marcformat, Records.Savefiles_id as Savefiles_id, Records.SearchTargets_id as SearchTargets_id FROM Records';
	var sql = ' where ';
	var col = '';
	switch(searchtype) {
		case '': 
			col = 'title or author or xml or publisher '
			break;
		case 'ti':
			col = 'title ';
			break;
		case 'au':
			col = 'author ';
			break;
		case 'su':
			col = 'xml ';
			break;
		case 'isbn':
			col = 'xml ';
			break;
		case 'issn':
			col = 'xml ';
			break;
	}
	sql += col + ' like "%' + query + '%"';
	selectSql += sql;
	Ext.getCmp('savegrid').store.load({db: db, selectSql: selectSql});
}

function initializePazPar2(pazpar2url, options) {
if(!options) { options = {} }
paz = new pz2({ 
					"errorhandler": pazPar2Error,
					"oninit": options.initCallback || function() {},
					"onping": options.pingCallback || function(){},
					"onshow": function(data){ 
						Ext.getCmp('searchgrid').store.reload(); 
						if(data.activeclients == 0 ) {
							// remove 'Searching' status msg
							clearStatusMsg();
						}
					},
					"termlist": "subject,author,date,publication-name",
					"onterm": function(data) { 
						if( data.activeclients == 0 ) {
							Ext.getCmp('facetsTreePanel').root.reload();
						}
					},
                    "showtime": 500,            //each timer (show, stat, term, bytarget) can be specified this way
                    "pazpar2path": pazpar2url,
					"usesessions" : true,
					"clear": 1
				});
	// HACK: set paz.termKeys manually or else pz2.js doesn't seem to accept date in termlist
	paz.termKeys = 'subject,author,date,publication-name';
	return paz;
}

function setPazPar2Targets() {
	var targets = getTargets();
	$.each( targets, function(i, n){
		if( targets[i].enabled == 1 ) {
			var db = n.hostname+":"+n.port+"/"+n.dbname;
			$.get(  paz.pz2String +
					'?' +
					'command=settings'+
					'&' +
					'session='+paz.sessionID +
					'&' +
					'pz:name['+db+']='+ n.name +
					'&' +
					'pz:requestsyntax['+db+']='+'marc21'+
					'&' +
					'pz:elements['+db+']='+'F'+
					'&' +
					'pz:nativesyntax['+db+']='+'iso2709'+
					'&' +
					'pz:xslt['+db+']='+'marc21.xsl'+
					'&' +
					'pz:cclmap:term=['+db+']='+'u=1016 t=1,r s=al'+
					'&' +
					'pz:cclmap:au['+db+']='+'u=1004 s=al'+
					'&' +
					'pz:cclmap:ti['+db+']='+'u=4 s=al'+
					'&' +
					'pz:cclmap:su['+db+']='+'u=21 s=al'+
					'&' +	
					'pz:cclmap:isbn['+db+']='+'u=7'+
					'&' +
					'pz:cclmap:issn['+db+']='+'u=8'+
					'&' +
					'pz:cclmap:date['+db+']='+'u=30 r=r'+
					'&' +
					'pz:cclmap:pub['+db+']='+'u=1018 s=al'
			);
		}
	});
}

function changePazPar2TargetStatus(o) {
		$.get( paz.pz2String + "?command=settings&session="+paz.sessionID+"&pz:allow["+o.db+"]="+o.allow );
}

function resetPazPar2(options) {
	if(debug){ console.info('resetting pazpar2') }
	paz = initializePazPar2(pazpar2url, {
			initCallback: function(statusOK) {
				if(debug) { console.info('pazpar2 initCallback: resetting sessionID for searching and setting Z targets') }
				if(statusOK == true) {
					// reset search grid's url for new session id
					Ext.getCmp('searchgrid').store.proxy.conn.url = paz.pz2String + "?command=show&session=" + paz.sessionID;
					setPazPar2Targets(paz);
					if(options) {
						if(debug) { console.info("re-running search with pazpar2") }
						paz.search( options.currQuery );
						paz.show(options.currStart, options.currNum);
						getPazRecord(options.currRecId, 0, function(data) {previewRecord(data);}, {});
					}
				}
			}
	});
}

function pazPar2Error(data) {
		if(debug){ console.info('pazpar2 error: ' + data.code)}
		if( data.code == 'HTTP' ) {
			Ext.MessageBox.alert('Initialization error', 'Pazpar2 search server is unavailble. Please check your configuration and try again');
		}
		// if session does not exist  or record is missing
		if( data.code == '1' || data.code == '7') {
			if(debug) { console.info("pazpar2 error: session does not exist or record is missing") }
			var currQuery = paz.currQuery;
			var currStart = paz.currentStart;
			var currNum = paz.currNum;
			var currRecId = paz.currRecId;
			resetPazPar2({currQuery: currQuery, currStart: currStart, currNum: currNum, currRecId: currRecId});
		}
}

function clearSearchLimits() {
	for( l in UI.searchLimits ) { 
		delete UI.searchLimits[l]; 
	}
}

function doPazPar2Search() {
	clearSearchLimits();
	var query = $("#query").val();
	var searchtype  = $("#searchtype").val();
	var searchquery = '';
	if( searchtype == '') {
		searchquery = '"' + query + '"';
	}
	else {
		searchquery = searchtype + '="' + query + '"';
	}
	// save this query
	biblios.app.currQuery = searchquery;
	// reset search ds's proxy url to get rid of old sort params
	Ext.getCmp('searchgrid').store.proxy.conn.url = paz.pz2String + '?command=show&session=' + paz.sessionID;
    paz.search( searchquery );
    biblios.app.displaySearchView();
}

function getRemoteRecord(id, loc, offset, callback) {
		showStatusMsg('Opening record...');
		// if this location is in our Prefs.remoteILS hash, retrieve it specially
		if( Prefs.remoteILS[loc] ) {
			getRecordFromLocation(id, loc, callback);
		}
		else {
			var xml = getPazRecord(id, offset, callback);
		}
}

function getRecordFromLocation(id, loc, callback) {
	// get xml for the record we wantt to retrieve
	xml = recordCache[id];
	marcxml = xslTransform.loadString(xml);

	Prefs.remoteILS[loc].instance.retrieveHandler = callback;
	Prefs.remoteILS[loc].instance.retrieve(marcxml);
}

function getPazRecord(recId, offset, callback, callbackParamObject) {
	if( recordCache[recId] ) {
		if(debug) { console.info('retreiving record from cache')}
		// call the callback with record from record cache
		callback.call(this, recordCache[recId], callbackParamObject);
	}
	// if the record isn't in the cache, ask pazpar2 for it with the supplied callback for record retrieval
	else {
		if(debug) { console.info('retreiving record from pazpar2')}
        try {
		 	$.ajax({
				url: pazpar2url,
				data: {
					session: paz.sessionID,
					command: 'record',
					id: recId,
					offset: offset
				},
				type: 'GET',
				dataType: 'xml',
				recId: recId,
				callback: callback,
				callbackParamObject: callbackParamObject,
				success: function(data, textStatus) {
					var id = this.recId;
					var callback = this.callback;
					var callbackParamObject = this.callbackParamObject;
					callback.call(this, data, callbackParamObject);
				}
			});
		}
        catch(ex) {
         	ext.MessageBox.alert('Pazpar2 error', ex.message);
        }
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
		case 'subject':
			return 'su';
			break;
		case 'publication-name':
			return 'pub';
			break;
	}
}
function limitSearch() {
	// start w/ original query and build from there
	var query = biblios.app.currQuery;
	for( name in UI.searchLimits ) {
		query += ' and ' + term2searchterm(UI.searchLimits[name]) + '="' + name + '"';
	}
	paz.search(query);
	paz.show();
	biblios.app.displaySearchView();
}
