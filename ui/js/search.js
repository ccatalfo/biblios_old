function initializePazPar2(pazpar2url, options) {
if(!options) { options = {} }
paz = new pz2({ 
					"errorhandler": pazPar2Error,
					"oninit": options.initCallback || function() {},
					"onping": options.pingCallback || function(){},
					"onshow": function(data){ 
						searchds.reload(); 
						if(data.activeclients == 0 ) {
							// remove 'Searching' status msg
							clearStatusMsg();
						}
					},
					"termlist": "subject,author,date,publication-name",
					"onterm": function(data) { 
						removeFacets();
						displaySearchFacets(data, 'subject', 'su'); 
						displaySearchFacets(data, 'author', 'au'); 
						displaySearchFacets(data, 'date', 'date'); 
						displaySearchFacets(data, 'publication-name', 'pub'); 
						//hideDisabledFacets();
					},
                    "showtime": 500,            //each timer (show, stat, term, bytarget) can be specified this way
                    "pazpar2path": pazpar2url,
                    "termlist": "subject,author",
					"usesessions" : true,
					"clear": 1
				});
	// HACK: set paz.termKeys manually or else pz2.js doesn't seem to accept date in termlist
	paz.termKeys = 'subject,author,date,publication-name';
	return paz;
}

function setPazPar2Targets(paz) {
	var targets = getTargets();
	$.each( targets, function(i, n){
		if( targets[i].enabled == 1 ) {
			var db = n.hostname+":"+n.port+"/"+n.dbname;
			$.get( paz.pz2String + "?command=settings&session="+paz.sessionID+"&pz:name["+db+"]="+n.name+"&pz:requestsyntax["+db+"]=marc21&pz:elements["+db+"]=F&pz:nativesyntax["+db+"]=iso2709&pz:xslt["+db+"]=marc21.xsl");		
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
					searchds.proxy.conn.url = paz.pz2String + "?command=show&session=" + paz.sessionID;
					setPazPar2Targets(paz);
					if(options) {
						if(debug) { console.info("re-running search with pazpar2") }
						paz.search( options.currQuery );
						paz.show(options.currStart, options.currNum);
						getPazRecord(options.currRecId);
					}
				}
			}
	});
}

function pazPar2Error(data) {
		if(debug){ console.info('pazpar2 error: ' + data.code)}
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

function doPazPar2Search() {
	//get rid of old facets from previous searches
	if( UI.search.currQuery != '') {
		removeFacets();
	}
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
	UI.search.currQuery = searchquery;
	// reset search ds's proxy url to get rid of old sort params
	searchds.proxy.conn.url = paz.pz2String + '?command=show&session=' + paz.sessionID;
    paz.search( searchquery );
    displaySearchView();
}

function getRemoteRecord(callback) {
		showStatusMsg('Opening record...');
		var id = searchgrid.getSelections()[0].id;
		var loc = searchgrid.getSelections()[0].data.location;
		// if this location is in our Prefs.remoteILS hash, retrieve it specially
		if( Prefs.remoteILS[loc] ) {
			getRecordFromLocation(id, loc);
		}
		else {
			UI.editor.id = '';
			paz.recordCallback = callback;
			var xml = getPazRecord(id);
			if( xml ) {
			  openRecord(xml);
			}
		}
}

function getRecordFromLocation(id, loc) {
	// get xml for the record we wantt to retrieve
	xml = recordCache[id];
	marcxml = xslTransform.loadString(xml);

	Prefs.remoteILS[loc].instance.retrieve(marcxml);
}

function getPazRecord(recId) {
	if( recordCache[recId] ) {
		if(debug) { console.info('retreiving record from cache')}
		return recordCache[recId];
	}
	else {
		if(debug) { console.info('retreiving record from pazpar2')}
        try {
          paz.record(recId, 0);
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
		if( UI.search.limitby[data[type][i].name] ) {
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
				UI.search.limitby[node.attributes.name] = node.attributes.searchtype;
			}
			else {
				delete UI.search.limitby[node.attributes.name];
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
		root.expand();
		facetsRoot.expandChildNodes(true);
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
	facetsRoot.setText("Facets <img src='ui/images/ajax-loader.gif'>");
}

function limitSearch() {
	// start w/ original query and build from there
	var query = UI.search.currQuery;
	for( name in UI.search.limitby ) {
		query += ' and ' + UI.search.limitby[name] + '="' + name + '"';
	}
	paz.search(query);
	paz.show();
	displaySearchView();
}
