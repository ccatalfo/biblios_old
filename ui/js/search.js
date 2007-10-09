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

var pazpar2Session = {};

function pazpar2Init() {
	$.ajax({
		type: 'GET',
		url: pazpar2url,
		data: {command: 'init'},
		dataType: 'text/xml',
		success: function(data) {
			console.info(data);
			if( $("status", data).text() == 'OK') {
				pazpar2Session.sessionid = $("session", data).text();
				var pingintervalid = setInterval(pazpar2Ping, 30000);
				pazpar2Session.pingintervalid = pingintervalid;
			}
			else {
				console.error('PazPar2 error', $("error", data).text() );
			}
		},
		error: function(data) {
			console.error(data);
		}
		});
}

function pazpar2Ping() {
	$.ajax({
		type: 'GET',
		dataType: 'text/xml',
		url: pazpar2url,
		data:{command: 'ping', session: pazpar2Session.sessionid},
		success: function(data) {
			console.info(data);
		},
		error: function(data) {
			console.error(data);
		}
	});
}

function pazpar2Search(ccl) {
	$.ajax({
		url: pazpar2url,
		dataType: 'text/xml',
		data: { command: 'search', session: pazpar2Session.sessionid, query: ccl},
		success: function(data) {
			pazpar2Session.searchresp = data;
		},
		error: function(data) {
			console.error(data);
		}
	});
}

function pazpar2ShowSearchResults() {
	$.ajax({
		url: pazpar2url,
		dataType: 'text/xml',
		data: { command: 'show', session: pazpar2Session.sessionid},
		success: function(data) {
			pazpar2Session.showresp = data;
		},
		error: function(data) {
			console.error(data);
		}
	});
}

function pazpar2ShowRecordMetadata(recid) {
	$.ajax({
		url: pazpar2url,
		dataType: 'text/xml',
		data: { command: 'record', session: pazpar2Session.sessionid, id: recid},
		success: function(data) {
			pazpar2Session.record = data;
		},
		error: function(data) {
			console.error(data);
		}
	});
}
function pazpar2ShowRecordMarcXML(recid, offset) {
	$.ajax({
		url: pazpar2url,
		dataType: 'text/xml',
		data: { command: 'record', session: pazpar2Session.sessionid, id: recid, offset: offset},
		success: function(data) {
			pazpar2Session.recordxml = data;
		},
		error: function(data) {
			console.error(data);
		}
	});
}
