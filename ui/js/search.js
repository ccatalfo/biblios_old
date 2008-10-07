function doSearch(form) {
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
        searchquery = searchtype + '=' + query;
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
	var query = $('#query').val();
	var searchtype  = $("#searchtype").val();
	var selectSql = 'SELECT Records.rowid as Id, Records.title as Title, Records.author as Author, Records.date as DateOfPub, Records.location as Location, Records.publisher as Publisher, Records.medium as Medium, Records.xml as xml, Records.status as Status, Records.date_added as DateAdded, Records.date_modified as DateModified, Records.xmlformat as xmlformat, Records.marcflavour as marcflavour, Records.template as template, Records.marcformat as marcformat, Records.Savefiles_id as Savefiles_id, Records.SearchTargets_id as SearchTargets_id FROM Records';
	var sql = ' where ';
	var col = '';
	switch(searchtype) {
		case '': 
			col = 'title or author or xml or publisher ';
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

function initPazPar2(pazurl) {
	$.get(pazcgiurl, {action:'init', pazpar2url:pazurl}, function(data) {
        biblios.app.paz.sessionID = data;
        setPazPar2Targets();
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
	
	settings['pz:cclmap:term=['+db+']'] = 'u=1016 t=1,r s=al';
	
	settings['pz:cclmap:au['+db+']']  = 'u=1004 s=al';
	
	settings['pz:cclmap:ti['+db+']'] = 'u=4 s=al';
	
	settings['pz:cclmap:su['+db+']'] = 'u=21 s=al';
	
	settings['pz:cclmap:isbn['+db+']'] = 'u=7';
	
	settings['pz:cclmap:issn['+db+']'] = 'u=8';
	
	settings['pz:cclmap:date['+db+']'] = 'u=30 r=r';
	
	settings['pz:cclmap:pub['+db+']'] = 'u=1018 s=al';
    
    settings['pz:cclmap:group['+db+']'] = 'u=9015 s=al';
    
    settings['pz:cclmap:createdby['+db+']'] = 'u=9013 s=al';
    
    settings['pz:cclmap:editedby['+db+']'] = 'u=9012 s=al';
   
    settings['pz:cclmap:lasteditedby['+db+']'] = 'u=9014 s=al';
    if( target.userid != '') {
        settings['pz:authentication['+db+']'] = target.userid+'/'+target.password; 
    }
    if( biblios.app.pazpar2debug == 1 ) {
        settings['pz:apdulog['+db+']'] = 1;
    }
	return settings;
}

function setPazPar2Targets() {
	var targets = getTargets();
	var settings = new Array();
	for (var i = 0; i < targets.length; i++) {
		if (targets[i].enabled == 1) {
			// load this target into pazpar2 as search target
			if (targets[i].pazpar2settings != '' && targets[i].pazpar2settings != null) {
				var s = Ext.util.JSON.decode(targets[i].pazpar2settings);
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
	$.post(pazcgiurl, {action:'settings', settings: Ext.util.JSON.encode(settings)});
}

function changePazPar2TargetStatus(o) {
		$.get( biblios.app.paz.pz2String + "?command=settings&session="+biblios.app.paz.sessionID+"&pz:allow["+o.db+"]="+o.allow );
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

function runSearch(query, filter) {
    if(filter) {
        $.get(pazcgiurl, {action:'search', query:query, filter:filter}, function(data) {
                Ext.getCmp('searchgrid').store.reload();
                //Ext.getCmp('facetsTreePanel').root.reload();
        });
    }
    else {
        $.get(pazcgiurl, {action:'search', query:query}, function(data) {
                Ext.getCmp('searchgrid').store.reload();
                //Ext.getCmp('facetsTreePanel').root.reload();
        });
    }
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
					action: 'recid',
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

function refreshTargetHits(){
	$.getJSON(pazcgiurl, {
		action: 'bytarget'
	}, function(data){
		var nodes = Ext.getCmp('TargetsTreePanel').root.childNodes;
		for (var i = 0; i < data.targets.length; i++) {
			for (var j = 0; j < nodes.length; j++) {
				var pazid = nodes[j].attributes.pazid;
				if (pazid == data.targets[i].id) {
					if (nodes[j]) {
						nodes[j].setText(nodes[j].attributes.servername + ' (' + data.targets[i].records + ')');
					}
				}
			}
		}
	});
}
