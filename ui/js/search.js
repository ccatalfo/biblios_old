function doSearch(form) {
	if( $('#searchloc').val() == 'All' ) {
		doPazPar2Search();
		//doLocalFolderSearch();
	}
	else if( $('#searchloc').val() == 'SearchTargets' ) {
		doPazPar2Search();
	}
	else if( $('#searchloc').val() == 'LocalFolders') {
		//doLocalFolderSearch();
	}
	return false;
}

function doLocalFolderSearch() {
	//Ext.MessageBox.alert('Error', 'Not yet implemented');
}

function doVendorSearch() {
	var vendors = getVendors();
	var searchtype = $('#searchtype').val();
	var query = $('#query').val();
	Ext.ComponentMgr.get('acqsearchgrid').dataSource.load(
		{params: {
			start: 0,
			limit: 20,
			vendors: vendors,
			searchtype: searchtype,
			query: query
		}
	});
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
						Ext.getCmp('facetsTreePanel').root.reload();
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
		if( targets[i].enabled == 'true' ) {
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

function displaySearchFacets(data, type, searchtype) {
	var root = facetsRoot.findChild('name', type+'Root');
	var newnode;
	for( var i = 0; i < data[type].length; i++) {
		var html = '<span class="limit"">'
					+ data[type][i].name
					+ '</span><span> ('
					+ data[type][i].freq
					+ ')</span>'
					+ '<br/>';
		if( searchLimits[data[type][i].name] ) {
			newnode = new Ext.tree.TreeNode({
				leaf: true,
				name: data[type][i].name,
				freq: data[type][i].freq,
				searchtype: searchtype,
				text: html,
				checked: true
			});
		}
		else {
			newnode = new Ext.tree.TreeNode({
				leaf: true,
				name: data[type][i].name,
				freq: data[type][i].freq,
				searchtype: searchtype,
				text: html,
				checked: false
			});
		}
		root.appendChild(newnode);
		newnode.on('checkchange', function(node, checked) {
			if( checked ) {
				searchLimits[node.attributes.name] = node.attributes.searchtype;
			}
			else {
				delete searchLimits[node.attributes.name];
			}
			limitSearch();	
		}); // checkchange handler
		//var oldchild = root.findChild('name', data[type][i].name);
		//if( oldchild ) {
	//		oldchild.enable();
	//		oldchild.attributes.freq = data[type][i].freq;	
	//		oldchild.setText(html);
	//	}
	}
	if(data.activeclients == 0 ) {
		facetsRoot.setText("Facets");
		facetsRoot.enable();
		facetsRoot.expand();
	}
}

function removeOldFacets() {
	var subjectRoot = facetsRoot.findChild('name', 'subjectRoot');
	var authorRoot = facetsRoot.findChild('name', 'authorRoot');
	var dateRoot = facetsRoot.findChild('name', 'dateRoot');
	var pubRoot = facetsRoot.findChild('name', 'publisher-nameRoot');
	facetsRoot.removeChild(subjectRoot);
	facetsRoot.removeChild(authorRoot);
	facetsRoot.removeChild(dateRoot);
	facetsRoot.removeChild(pubRoot);
	// re-add them
	var subjectRoot =  new Ext.tree.TreeNode({
		name: 'subjectRoot',
		text: "<b>Subjects</b>",
		leaf: false
	});
	var authorRoot =  new Ext.tree.TreeNode({
		name: 'authorRoot',
		text: "<b>Authors</b>",
		leaf: false
	});
	var dateRoot =  new Ext.tree.TreeNode({
		name: 'dateRoot',
		text: "<b>Dates</b>",
		leaf: false
	});
	var pubRoot =  new Ext.tree.TreeNode({
		name: 'publication-nameRoot',
		text: "<b>Publisher</b>",
		leaf: false
	});
	facetsRoot.appendChild(subjectRoot, authorRoot, dateRoot, pubRoot);
}

function disableFacets() {
	var facets = new Array('subject', 'author', 'date', 'publication-name');
	$.each(facets, function(i,n) {	
		var root = facetsRoot.findChild('name', n+'Root');
		var facets = root.childNodes;
		for(var i=0; i<facets.length; i++) {
			facets[i].disable();
		}
	});
}
function hideDisabledFacets() {
	var facets = new Array('subject', 'author', 'date', 'publication-name');
	$.each(facets, function(i,n) {	
		var root = facetsRoot.findChild('name', n+'Root');
		var facets = root.childNodes;
		for(var i=0; i<facets.length; i++) {
			if( facets[i].disabled == true && facets[i].rendered == true) {
				$(facets[i].getUI().elNode).hide();
			}
		}
	});
}

function removeFacets() {
	var facets = new Array('subject', 'author', 'date', 'publication-name');
	$.each(facets, function(i,n) {	
		var root = facetsRoot.findChild('name', n+'Root');
		var facets = root.childNodes;
		while( facets.length > 0 ) {
			root.removeChild(facets[0]);
		}
	});
	facetsRoot.collapseChildNodes(true);
	facetsRoot.setText("Facets <img src='"+libPath+"ui/images/ajax-loader.gif'>");
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
