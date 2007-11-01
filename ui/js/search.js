/*
Function: doSearchZ3950

  Initiate a z39.50 query on a perl script backend (script name defined in var searchScript).
  
Parameters:

  None.

Returns:

  None.
*/
var doSearchZ3950 = function() {
  var wait; // wait progress box to display while searching
        Ext.Ajax.on('beforerequest', function() {
          wait = Ext.MessageBox.wait('Searching...');
        });
        Ext.Ajax.on('requestcomplete', function() {
         wait.hide(); 
        });
        Ext.Ajax.on('requestexception', function(conn, resp, options) {
          Ext.MessageBox.alert('Error with search', resp.responseText);
        });
	    Ext.Ajax.request({
		url: searchScript,
		method: 'GET',
		params: {   
		    'searchtype': Ext.ComponentMgr.get('searchtype').getValue(), 
		    'query': Ext.ComponentMgr.get('query').getValue(),
		    'encoding': encoding,
		    'cclfile': cclfile,
		    'servers': z3950serversSearch
		},
		callback: handleSearch,
        timeOut: 50000
		});
	    //dlg.hide();
}

function handleSearch(options, isSuccess, resp) {
   var response = resp.responseText;
   var srchResults = (new DOMParser()).parseFromString(response, "text/xml");
    var servers = $("//server", srchResults).attr('name');
  var query = Ext.ComponentMgr.get('query').getValue();
  var searchtype = Ext.ComponentMgr.get('searchtype').getValue();
   //console.info("response is: " + response);
    // insert this search into Searches table
    try {
        db.execute('insert into Searches (id, xml, query, servers, date_added, searchname) values (null, ?, ?, ?, date("now", "localtime"), "")', [srchResults, query, servers]); 
    }
    catch(ex) {
        Ext.MessageBox.alert('Error', 'Database error: ' + ex.message);
    }
    var servers = srchResults.getElementsByTagName('server');
    var data = new Array();
    var totalRecords = 0;
    for( var j = 0; j < servers.length; j++) {
        var records = servers[j].getElementsByTagName('record');
        if(debug==1) {console.info("ProcessSearchResults got: " + records.length + " records to insert into db");}
        for (var i = 0; i < records.length; i++) {
            var server = servers[j].getAttribute("name");
            var currRecord = records[i];
            // get the xml for this record as string to save to db
            var recordAsString = (new XMLSerializer().serializeToString(currRecord));
            var title = $('[@tag="245"]/subfield[@code="a"]', currRecord).text();
            var author = $('[@tag="245"]/subfield[@code="c"]', currRecord).text();
            var publisher = $('[@tag="260"]/subfield[@code="b"]', currRecord).text();
            var dateofpub = $('[@tag="260"]/subfield[@code="c"]', currRecord).text();
            //console.info('ProcessSearchResults: got record with title: ' + title + ' to save');
            try {
                db.execute('insert into Records (id, xml, status, date_added, date_modified, server, savefile) values (null, ?, ?, date("now", "localtime"), date("now", "localtime"), ?, null)', [recordAsString, '', server]);
                if(debug == 1 ) {console.info('inserting record with title: ' + title);}
            } catch(ex) {
                Ext.Msg.alert('Error', 'db error: ' + ex.message);
            }
            var lastId = getLastRecId();	
            var dateadded = '';
            try {
              var rs = db.execute('select date_added from Records where id = ?', [lastId]);
              dateadded = rs.field(0);
            }
            catch(ex) {
              Ext.Msg.alert( 'Error', ex.message );
            }
            var dateadded = rs.field(0);
            // get target name from the authstring
            var targetname = getTargetNameByAuthString(server);
            var recArray = new Array(lastId, title, author, publisher, dateofpub, targetname);
            data[totalRecords] = recArray;
            recordNum++; // update number of records we've saved
            totalRecords++;
        }
    }
    displaySearchView();
    createSearchResultsGrid(data);
}


function initializePazPar2(pazpar2url, options) {
if(!options) { options = {} }
paz = new pz2({ 
					"errorhandler": pazPar2Error,
					"oninit": options.initCallback || function() {},
					"onping": options.pingCallback || function(){},
					"onshow": function(data){ searchds.reload() },
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
		//root.expand();
		//facetsRoot.expandChildNodes(true);
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
