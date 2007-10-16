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


function initializePazPar2(pazpar2url) {
paz = new pz2({ 
					"onshow": function(data){ searchds.reload() },
                    "showtime": 500,            //each timer (show, stat, term, bytarget) can be specified this way
                    "pazpar2path": pazpar2url,
                    "onstat": function(data){ console.info(data)},
                    "onterm": function(data){ console.info(data)},
                    "termlist": "subject,author",
                    "onbytarget": function(data) { console.info(data)},
					"usesessions" : true,
                    "onrecord": function(data) {console.info(data) } 
				});
	return paz;
}

function resetPazPar2(paz) {
	paz.stop();
	paz.reset();
	paz = new pz2({ 
					"oninit": function(data) { searchds.proxy.conn.url = pazpar2url + '?command=show&session=' + paz.sessionID;},
					"onshow": function(data){ searchds.reload() },
                    "showtime": 500,            //each timer (show, stat, term, bytarget) can be specified this way
                    "pazpar2path": pazpar2url,
                    "onstat": function(data){ console.info(data)},
                    "onterm": function(data){ console.info(data)},
                    "termlist": "subject,author",
                    "onbytarget": function(data) { console.info(data)},
					"usesessions" : true,
                    "onrecord": function(data) {console.info(data) } 
				});
}

function doPazPar2Search(searchstring) {
    paz.search( searchstring );
    displaySearchView();
}

function getPazRecord(recId) {
	if( recordCache.recId ) {
		if(debug) { console.info('retreiving record from cache')}
		return recordCache.recId;
	}
	else {
		if(debug) { console.info('retreiving record from pazpar2')}
		paz.record(recId, {syntax: 'marcxml'});
	}
}
