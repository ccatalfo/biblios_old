/*
** $Id: pz2.js,v 1.59 2007/09/28 10:14:09 jakub Exp $
** pz2.js - pazpar2's javascript client library.
*/

//since explorer is flawed
if (!window['Node']) {
    window.Node = new Object();
    Node.ELEMENT_NODE = 1;
    Node.ATTRIBUTE_NODE = 2;
    Node.TEXT_NODE = 3;
    Node.CDATA_SECTION_NODE = 4;
    Node.ENTITY_REFERENCE_NODE = 5;
    Node.ENTITY_NODE = 6;
    Node.PROCESSING_INSTRUCTION_NODE = 7;
    Node.COMMENT_NODE = 8;
    Node.DOCUMENT_NODE = 9;
    Node.DOCUMENT_TYPE_NODE = 10;
    Node.DOCUMENT_FRAGMENT_NODE = 11;
    Node.NOTATION_NODE = 12;
}

// prevent execution of more than once
if(typeof window.pz2 == "undefined") {
window.undefined = window.undefined;

var pz2 = function ( paramArray )
{
    
    // at least one callback required
    if ( !paramArray )
        throw new Error("Pz2.js: An array with parameters has to be suplied when instantiating a class");
    
    //for convenience
    __myself = this;

    //supported pazpar2's protocol version
    __myself.suppProtoVer = '1';
    if (typeof paramArray.pazpar2path != "undefined")
        __myself.pz2String = paramArray.pazpar2path;
    else
        __myself.pz2String = "/pazpar2/search.pz2";
    __myself.useSessions = true;
    
    __myself.stylesheet = paramArray.detailstylesheet || null;
    //load stylesheet if required in async mode
    if( __myself.stylesheet ) {
        var request = new pzHttpRequest( __myself.stylesheet );
        request.get( {}, function ( doc ) { __myself.xslDoc = doc; } );
    }
    
    __myself.errorHandler = paramArray.errorhandler || null;
    
    // function callbacks
    __myself.initCallback = paramArray.oninit || null;
    __myself.pingCallback = paramArray.onping || null;
    __myself.statCallback = paramArray.onstat || null;
    __myself.showCallback = paramArray.onshow || null;
    __myself.termlistCallback = paramArray.onterm || null;
    __myself.recordCallback = paramArray.onrecord || null;
    __myself.bytargetCallback = paramArray.onbytarget || null;
    __myself.resetCallback = paramArray.onreset || null;

    // termlist keys
    __myself.termKeys = paramArray.termlist || "subject";
    
    // some configurational stuff
    __myself.keepAlive = 50000;
    
    if ( paramArray.keepAlive < __myself.keepAlive )
        __myself.keepAlive = paramArray.keepAlive;

    __myself.sessionID = null;
    __myself.initStatusOK = false;
    __myself.pingStatusOK = false;
    __myself.searchStatusOK = false;
    
    // for sorting
    __myself.currentSort = "relevance";

    // where are we?
    __myself.currentStart = 0;
    __myself.currentNum = 20;

    // last full record retrieved
    __myself.currRecID = null;
    
    // current query
    __myself.currQuery = null;

    //timers
    __myself.statTime = paramArray.stattime || 1000;
    __myself.statTimer = null;
    __myself.termTime = paramArray.termtime || 1000;
    __myself.termTimer = null;
    __myself.showTime = paramArray.showtime || 1000;
    __myself.showTimer = null;
    __myself.showFastCount = 4;
    __myself.bytargetTime = paramArray.bytargettime || 1000;
    __myself.bytargetTimer = null;

    // counters for each command and applied delay
    __myself.dumpFactor = 500;
    __myself.showCounter = 0;
    __myself.termCounter = 0;
    __myself.statCounter = 0;
    __myself.bytargetCounter = 0;

    // active clients, updated by stat and show
    // might be an issue since bytarget will poll accordingly
    __myself.activeClients = 1;

    // if in proxy mode no need to init
    if (paramArray.usesessions != undefined) {
         __myself.useSessions = paramArray.usesessions;
        __myself.initStatusOK = true;
    }
    // else, auto init session or wait for a user init?
    if (__myself.useSessions && paramArray.autoInit !== false) {
        __myself.init();
    }
};

pz2.prototype = 
{
    //error handler for async error throws
   throwError: function (errMsg, errCode)
   {
        var err = new Error(errMsg);
        if (errCode) err.code = errCode;
                
        if (__myself.errorHandler) {
            __myself.errorHandler(err);
        }
        else {
            throw err;
        }
   },

    // stop activity by clearing tiemouts 
   stop: function ()
   {
       clearTimeout(__myself.statTimer);
       clearTimeout(__myself.showTimer);
       clearTimeout(__myself.termTimer);
       clearTimeout(__myself.bytargetTimer);
    },
    
    // reset status variables
    reset: function ()
    {   
        if ( __myself.useSessions ) {
            __myself.sessionID = null;
            __myself.initStatusOK = false;
            __myself.pingStatusOK = false;
        }
        __myself.searchStatusOK = false;
        __myself.stop();
            
        if ( __myself.resetCallback )
                __myself.resetCallback();
    },

    init: function ( sessionId ) 
    {
        __myself.reset();
        
        // session id as a param
        if ( sessionId != undefined && __myself.useSessions ) {
            __myself.initStatusOK = true;
            __myself.sessionID = sessionId;
            __myself.ping();
			  // old school direct pazpar2 init
        } else if (__myself.useSessions) {
            var request = new pzHttpRequest(__myself.pz2String, __myself.errorHandler);
            request.get(
                { "command": "init" },
                function(data) {
                    if ( data.getElementsByTagName("status")[0].childNodes[0].nodeValue == "OK" ) {
                        if ( data.getElementsByTagName("protocol")[0].childNodes[0].nodeValue 
                            != __myself.suppProtoVer )
                            throw new Error("Server's protocol not supported by the client");
                        __myself.initStatusOK = true;
                        __myself.sessionID = data.getElementsByTagName("session")[0].childNodes[0].nodeValue;
                        setTimeout("__myself.ping()", __myself.keepAlive);
								__myself.initCallback(__myself.initStatusOK);
                    }
                    else
                        // if it gets here the http return code was 200 (pz2 errors are 417)
                        // but the response was invalid, it should never occur
                        // setTimeout("__myself.init()", 1000);
                        __myself.throwError('Init failed. Malformed WS resonse.', 110);
                }
            );
        // when through proxy no need to init
        } else {
            __myself.initStatusOK = true;
	}
    },
    // no need to ping explicitly
    ping: function () 
    {
        // pinging only makes sense when using pazpar2 directly
        if( !__myself.initStatusOK || !__myself.useSessions )
            throw new Error('Pz2.js: Ping not allowed (proxy mode) or session not initialized.');
            // session is not initialized code here
        
        var request = new pzHttpRequest(__myself.pz2String, __myself.errorHandler);
        request.get(
            { "command": "ping", "session": __myself.sessionID },
            function(data) {
                if ( data.getElementsByTagName("status")[0].childNodes[0].nodeValue == "OK" ) {
                    __myself.pingStatusOK = true;
                    setTimeout("__myself.ping()", __myself.keepAlive);
                    __myself.pingCallback(__myself.pingStatusOK);
                }
                else
                    // if it gets here the http return code was 200 (pz2 errors are 417)
                    // but the response was invalid, it should never occur
                    // setTimeout("__myself.ping()", 1000);
                    __myself.throwError('Ping failed. Malformed WS resonse.', 111);
            }
        );
    },
    search: function (query, num, sort, filter, showfrom)
    {
        clearTimeout(__myself.statTimer);
        clearTimeout(__myself.showTimer);
        clearTimeout(__myself.termTimer);
        clearTimeout(__myself.bytargetTimer);
        
        __myself.showCounter = 0;
        __myself.termCounter = 0;
        __myself.bytargetCounter = 0;
        __myself.statCounter = 0;
        
        // no proxy mode
        if( !__myself.initStatusOK )
            throw new Error('Pz2.js: session not initialized.');
        
        if( query !== undefined )
            __myself.currQuery = query;
        else
            throw new Error("Pz2.js: no query supplied to the search command.");
        
        if ( showfrom !== undefined )
            var start = showfrom;
        else
            var start = 0;

	var searchParams = { "command": "search", "query": __myself.currQuery, "session": __myself.sessionID };
	
        if (filter !== undefined)
	    searchParams["filter"] = filter;
        
        var request = new pzHttpRequest(__myself.pz2String, __myself.errorHandler);
        request.get(
            searchParams,
            function(data) {
                if ( data.getElementsByTagName("status")[0].childNodes[0].nodeValue == "OK" ) {
                    __myself.searchStatusOK = true;
                    //piggyback search
                    __myself.show(start, num, sort);
                    if ( __myself.statCallback )
                        __myself.stat();
                        //__myself.statTimer = setTimeout("__myself.stat()", __myself.statTime / 4);
                    if ( __myself.termlistCallback )
                        __myself.termlist();
                        //__myself.termTimer = setTimeout("__myself.termlist()", __myself.termTime / 4);
                    if ( __myself.bytargetCallback )
                        __myself.bytarget();
                        //__myself.bytargetTimer = setTimeout("__myself.bytarget()", __myself.bytargetTime / 4);
                }
                else
                    // if it gets here the http return code was 200 (pz2 errors are 417)
                    // but the response was invalid, it should never occur
                    // setTimeout("__myself.search(__myself.currQuery)", 500);
                    __myself.throwError('Search failed. Malformed WS resonse.', 112);
            }
        );
    },
    stat: function()
    {
        if( !__myself.initStatusOK )
            throw new Error('Pz2.js: session not initialized.');
        
        // if called explicitly takes precedence
        clearTimeout(__myself.statTimer);
        
        var request = new pzHttpRequest(__myself.pz2String, __myself.errorHandler);
        request.get(
            { "command": "stat", "session": __myself.sessionID },
            function(data) {
                if ( data.getElementsByTagName("stat") ) {
                    var activeClients = Number( data.getElementsByTagName("activeclients")[0].childNodes[0].nodeValue );
                    __myself.activeClients = activeClients;
                    var stat = {
                    "activeclients": activeClients,
                    "hits": Number( data.getElementsByTagName("hits")[0].childNodes[0].nodeValue ),
                    "records": Number( data.getElementsByTagName("records")[0].childNodes[0].nodeValue ),
                    "clients": Number( data.getElementsByTagName("clients")[0].childNodes[0].nodeValue ),
                    "initializing": Number( data.getElementsByTagName("initializing")[0].childNodes[0].nodeValue ),
                    "searching": Number( data.getElementsByTagName("searching")[0].childNodes[0].nodeValue ),
                    "presenting": Number( data.getElementsByTagName("presenting")[0].childNodes[0].nodeValue ),
                    "idle": Number( data.getElementsByTagName("idle")[0].childNodes[0].nodeValue ),
                    "failed": Number( data.getElementsByTagName("failed")[0].childNodes[0].nodeValue ),
                    "error": Number( data.getElementsByTagName("error")[0].childNodes[0].nodeValue )
                    };
                    
                    __myself.statCounter++;
		    var delay = __myself.statTime + __myself.statCounter * __myself.dumpFactor;
                    if ( activeClients > 0 )
                        __myself.statTimer = setTimeout("__myself.stat()", delay);
                    __myself.statCallback(stat);
                }
                else
                    // if it gets here the http return code was 200 (pz2 errors are 417)
                    // but the response was invalid, it should never occur
                    //__myself.statTimer = setTimeout("__myself.stat()", __myself.statTime / 4);
                    __myself.throwError('Stat failed. Malformed WS resonse.', 113);
            }
        );
    },
    show: function(start, num, sort)
    {
        if( !__myself.searchStatusOK && __myself.useSessions )
            throw new Error('Pz2.js: show command has to be preceded with a search command.');
        
        // if called explicitly takes precedence
        clearTimeout(__myself.showTimer);
        
        if( sort !== undefined )
            __myself.currentSort = sort;
        if( start !== undefined )
            __myself.currentStart = Number( start );
        if( num !== undefined )
            __myself.currentNum = Number( num );

        var request = new pzHttpRequest(__myself.pz2String, __myself.errorHandler);
        var context = this;
        request.get(
            { "command": "show", "session": __myself.sessionID, "start": __myself.currentStart,
              "num": __myself.currentNum, "sort": __myself.currentSort, "block": 1 },
            function(data) {
                if ( data.getElementsByTagName("status")[0].childNodes[0].nodeValue == "OK" ) {
                    // first parse the status data send along with records
                    // this is strictly bound to the format
                    var activeClients = Number( data.getElementsByTagName("activeclients")[0].childNodes[0].nodeValue );
                    __myself.activeClients = activeClients; 
                    var show = {
                    "activeclients": activeClients,
                    "merged": Number( data.getElementsByTagName("merged")[0].childNodes[0].nodeValue ),
                    "total": Number( data.getElementsByTagName("total")[0].childNodes[0].nodeValue ),
                    "start": Number( data.getElementsByTagName("start")[0].childNodes[0].nodeValue ),
                    "num": Number( data.getElementsByTagName("num")[0].childNodes[0].nodeValue ),
                    "hits": []
                    };
                    // parse all the first-level nodes for all <hit> tags
                    var hits = data.getElementsByTagName("hit");
                    var hit = new Array();
                    for (i = 0; i < hits.length; i++) {
                        show.hits[i] = new Array();
			show.hits[i]['location'] = new Array();
                        for ( j = 0; j < hits[i].childNodes.length; j++) {
			    var locCount = 0;
                            if ( hits[i].childNodes[j].nodeType == Node.ELEMENT_NODE ) {
				if (hits[i].childNodes[j].nodeName == 'location') {
				    var locNode = hits[i].childNodes[j];
				    var id = locNode.getAttribute('id');
				    show.hits[i]['location'][id] = {
					"id": locNode.getAttribute("id"),
					"name": locNode.getAttribute("name")
				    };
				}
				else {
				    var nodeName = hits[i].childNodes[j].nodeName;
                                    var nodeText = 'ERROR'
                                    if ( hits[i].childNodes[j].firstChild )
                                        nodeText = hits[i].childNodes[j].firstChild.nodeValue;
				    show.hits[i][nodeName] = nodeText;
				}
                            }
                        }
                    }
                    __myself.showCounter++;
		    var delay = __myself.showTime;
		    if (__myself.showCounter > __myself.showFastCount)
                            delay += __myself.showCounter * __myself.dumpFactor;
                    if ( activeClients > 0 )
                        __myself.showTimer = setTimeout("__myself.show()", delay);

                    __myself.showCallback(show);
                }
                else
                    // if it gets here the http return code was 200 (pz2 errors are 417)
                    // but the response was invalid, it should never occur
                    // __myself.showTimer = setTimeout("__myself.show()", __myself.showTime / 4);
                    __myself.throwError('Show failed. Malformed WS resonse.', 114);
            }
        );
    },
    record: function(id, offset, params)
    {
        // we may call record with no previous search if in proxy mode
        if( !__myself.searchStatusOK && __myself.useSessions)
           throw new Error('Pz2.js: record command has to be preceded with a search command.'); 

        if ( params == undefined )
            params = {};

        if ( params.callback != undefined ) {
            callback = params.callback;
        } else {
            callback = __myself.recordCallback;
        }
        
        // what is that?
        if ( params['handle'] == undefined )
            handle = {};
        else
            handle = params['handle'];

        if( id !== undefined )
            __myself.currRecID = id;
        
        var request = new pzHttpRequest(__myself.pz2String, __myself.errorHandler);

	var recordParams = { "command": "record", 
                            "session": __myself.sessionID,
                            "id": __myself.currRecID };
	
        if (offset !== undefined) {
	    recordParams["offset"] = offset;
	}

        if (params.syntax != undefined) {
            recordParams['syntax'] = params.syntax;
        }

	__myself.currRecOffset = offset;

        request.get(
	    recordParams,
            function(data) {
                var recordNode;
                var record = new Array();
                record['xmlDoc'] = data;
		if (__myself.currRecOffset !== undefined) {
                    record['offset'] = __myself.currRecOffset;
                    callback(record, handle);
                } else if ( recordNode = data.getElementsByTagName("record")[0] ) {
                    // if stylesheet was fetched do not parse the response
                    if ( __myself.xslDoc ) {
                        record['recid'] = recordNode.getElementsByTagName("recid")[0].firstChild.nodeValue;
                        record['xslDoc'] = __myself.xslDoc;
                    } else {
                        for ( i = 0; i < recordNode.childNodes.length; i++) {
                            if ( recordNode.childNodes[i].nodeType == Node.ELEMENT_NODE
                                    && recordNode.childNodes[i].nodeName != 'location' ) {
                                var nodeName = recordNode.childNodes[i].nodeName;
                                var nodeText = recordNode.childNodes[i].firstChild.nodeValue;
                                record[nodeName] = nodeText;                            
                            }
                        }
                        // the location might be empty!!
                        var locationNodes = recordNode.getElementsByTagName("location");
                        record["location"] = new Array();
                        for ( i = 0; i < locationNodes.length; i++ ) {
                            record["location"][i] = {
                                "id": locationNodes[i].getAttribute("id"),
                                "name": locationNodes[i].getAttribute("name")
                            };
                            
                            for ( j = 0; j < locationNodes[i].childNodes.length; j++) {
                                if ( locationNodes[i].childNodes[j].nodeType == Node.ELEMENT_NODE ) {
                                    var nodeName = locationNodes[i].childNodes[j].nodeName;
                                    var nodeText = '';
                                    if (locationNodes[i].childNodes[j].firstChild)
                                            nodeText = locationNodes[i].childNodes[j].firstChild.nodeValue;
                                    record["location"][i][nodeName] = nodeText;                            
                                }
                            }
                        }
                    }
                    
                    callback(record, handle);
                }
                else
                    // if it gets here the http return code was 200 (pz2 errors are 417)
                    // but the response was invalid, it should never occur
                    // setTimeout("__myself.record(__myself.currRecID)", 500);
                    __myself.throwError('Record failed. Malformed WS resonse.', 115);
            }
        );
    },

    termlist: function()
    {
        if( !__myself.searchStatusOK && __myself.useSessions )
            throw new Error('Pz2.js: termlist command has to be preceded with a search command.');

        // if called explicitly takes precedence
        clearTimeout(__myself.termTimer);
        
        var request = new pzHttpRequest(__myself.pz2String, __myself.errorHandler);
        request.get(
            { "command": "termlist", "session": __myself.sessionID, "name": __myself.termKeys },
            function(data) {
                if ( data.getElementsByTagName("termlist") ) {
                    var activeClients = Number( data.getElementsByTagName("activeclients")[0].childNodes[0].nodeValue );
                    __myself.activeClients = activeClients;
                    var termList = { "activeclients":  activeClients };
                    var termLists = data.getElementsByTagName("list");
                    //for each termlist
                    for (i = 0; i < termLists.length; i++) {
                	var listName = termLists[i].getAttribute('name');
                        termList[listName] = new Array();
                        var terms = termLists[i].getElementsByTagName('term');
                        //for each term in the list
                        for (j = 0; j < terms.length; j++) { 
                            var term = {
                                "name": (terms[j].getElementsByTagName("name")[0].childNodes.length 
                                                ? terms[j].getElementsByTagName("name")[0].childNodes[0].nodeValue
                                                : 'ERROR'),
                                "freq": terms[j].getElementsByTagName("frequency")[0].childNodes[0].nodeValue || 'ERROR'
                            };

                            var termIdNode = terms[j].getElementsByTagName("id");
                            if(terms[j].getElementsByTagName("id").length)
                                term["id"] = termIdNode[0].childNodes[0].nodeValue;

                            termList[listName][j] = term;
                        }
                    }

                    __myself.termCounter++;
                    var delay = __myself.termTime + __myself.termCounter * __myself.dumpFactor;
                    if ( activeClients > 0 )
                        __myself.termTimer = setTimeout("__myself.termlist()", delay);
                   
                   __myself.termlistCallback(termList);
                }
                else
                    // if it gets here the http return code was 200 (pz2 errors are 417)
                    // but the response was invalid, it should never occur
                    // __myself.termTimer = setTimeout("__myself.termlist()", __myself.termTime / 4); 
                    __myself.throwError('Termlist failed. Malformed WS resonse.', 116);
            }
        );

    },
    bytarget: function()
    {
        if( !__myself.initStatusOK && __myself.useSessions )
            throw new Error('Pz2.js: bytarget command has to be preceded with a search command.');
        
        // no need to continue
        if( !__myself.searchStatusOK )
            return;

        // if called explicitly takes precedence
        clearTimeout(__myself.bytargetTimer);
        
        var request = new pzHttpRequest(__myself.pz2String, __myself.errorHandler);
        request.get(
            { "command": "bytarget", "session": __myself.sessionID },
            function(data) {
                if ( data.getElementsByTagName("status")[0].childNodes[0].nodeValue == "OK" ) {
                    var targetNodes = data.getElementsByTagName("target");
                    var bytarget = new Array();
                    for ( i = 0; i < targetNodes.length; i++) {
                        bytarget[i] = new Array();
                        for( j = 0; j < targetNodes[i].childNodes.length; j++ ) {
                            if ( targetNodes[i].childNodes[j].nodeType == Node.ELEMENT_NODE ) {
                                var nodeName = targetNodes[i].childNodes[j].nodeName;
                                var nodeText = targetNodes[i].childNodes[j].firstChild.nodeValue;
                                bytarget[i][nodeName] = nodeText;
                            }
                        }
                    }
                    
                    __myself.bytargetCounter++;
                    var delay = __myself.bytargetTime + __myself.bytargetCounter * __myself.dumpFactor;
                    if ( __myself.activeClients > 0 )
                        __myself.bytargetTimer = setTimeout("__myself.bytarget()", delay);

                    __myself.bytargetCallback(bytarget);
                }
                else
                    // if it gets here the http return code was 200 (pz2 errors are 417)
                    // but the response was invalid, it should never occur
                    // __myself.bytargetTimer = setTimeout("__myself.bytarget()", __myself.bytargetTime / 4);
                    __myself.throwError('Bytarget failed. Malformed WS resonse.', 117);
            }
        );
    },
    
    // just for testing, probably shouldn't be here
    showNext: function(page)
    {
        var step = page || 1;
        __myself.show( ( step * __myself.currentNum ) + __myself.currentStart );     
    },

    showPrev: function(page)
    {
        if (__myself.currentStart == 0 )
            return false;
        var step = page || 1;
        var newStart = __myself.currentStart - (step * __myself.currentNum );
        __myself.show( newStart > 0 ? newStart : 0 );
    },

    showPage: function(pageNum)
    {
        //var page = pageNum || 1;
        __myself.show(pageNum * __myself.currentNum);
    }
};

/*
*********************************************************************************
** AJAX HELPER CLASS ************************************************************
*********************************************************************************
*/
var pzHttpRequest = function ( url, errorHandler ) {
        this.request = null;
        this.url = url;
        this.errorHandler = errorHandler || null;
        this.async = true;
        
        if ( window.XMLHttpRequest ) {
            this.request = new XMLHttpRequest();
        } else if ( window.ActiveXObject ) {
            try {
                this.request = new ActiveXObject( 'Msxml2.XMLHTTP' );
            } catch (err) {
                this.request = new ActiveXObject( 'Microsoft.XMLHTTP' );
            }
        }
};

pzHttpRequest.prototype = 
{
    get: function ( params, callback ) 
    {
        this._send( 'GET', params, '', callback );
    },

    post: function ( params, data, callback )
    {
        this._send( 'POST', params, data, callback );
    },

    load: function ()
    {
        this.async = false;
        this.request.open( 'GET', this.url, this.async );
        this.request.send('');
        if ( this.request.status == 200 )
            return this.request.responseXML;
    },

    _send: function ( type, params, data, callback )
    {
        this.callback = callback;
        var context = this;
        this.async = true;
        this.request.open( type, this._urlAppendParams(params), this.async );
        this.request.onreadystatechange = function () {
            context._handleResponse();
        }
        this.request.send(data);
    },

    _urlAppendParams: function (params)
    {
        var getUrl = this.url;

	var sep = '?';
        var el = params;
        for (var key in el) {
            if (el[key] != null) {
                getUrl += sep + key + '=' + encodeURIComponent(el[key]);
                sep = '&';
            }
        }
        return getUrl;
    },

    _handleResponse: function ()
    {
        if ( this.request.readyState == 4 ) { 
            // pick up pazpr2 errors first
            if ( this.request.responseXML 
                && this.request.responseXML.documentElement.nodeName == 'error'
                && this.request.responseXML.getElementsByTagName("error").length ) {
                var errAddInfo = '';
                if ( this.request.responseXML.getElementsByTagName("error")[0].childNodes.length )
                    errAddInfo = ': ' + this.request.responseXML.getElementsByTagName("error")[0].childNodes[0].nodeValue;
                var errMsg = this.request.responseXML.getElementsByTagName("error")[0].getAttribute("msg");
                var errCode = this.request.responseXML.getElementsByTagName("error")[0].getAttribute("code");
            
                var err = new Error(errMsg + errAddInfo);
                err.code = errCode;
	    
                if (this.errorHandler) {
                    this.errorHandler(err);
                }
                else {
                    throw err;
                }
            } else if ( this.request.status == 200 ) {
                this.callback( this.request.responseXML );
            } else {
                var err = new Error("Pz2.js: HTTP request error (AJAX). Code: " 
                            + this.request.status + " Info: " 
                            + this.request.statusText );
                err.code = 'HTTP';
                
                if (this.errorHandler) {
                    this.errorHandler(err);
                }
                else {
                    throw err;
                }
            }
        }
    }
};

/*
*********************************************************************************
** XML HELPER CLASS ************************************************************
*********************************************************************************
*/

// DOMDocument

if ( window.ActiveXObject) {
    var DOMDoc = document;
} else {
    var DOMDoc = Document.prototype;
}

DOMDoc.newXmlDoc = function ( root )
{
    var doc;

    if (document.implementation && document.implementation.createDocument) {
        doc = document.implementation.createDocument('', root, null);
    } else if ( window.ActiveXObject ) {
        doc = new ActiveXObject("MSXML2.DOMDocument");
        doc.loadXML('<' + root + '/>');
    } else {
        throw new Error ('No XML support in this browser');
    }

    return doc;
}

   
DOMDoc.parseXmlFromString = function ( xmlString ) 
{
    var doc;

    if ( window.DOMParser ) {
        var parser = new DOMParser();
        doc = parser.parseFromString( xmlString, "text/xml");
    } else if ( window.ActiveXObject ) {
        doc = new ActiveXObject("MSXML2.DOMDocument");
        doc.loadXML( xmlString );
    } else {
        throw new Error ("No XML parsing support in this browser.");
    }

    return doc;
}

DOMDoc.transformToDoc = function (xmlDoc, xslDoc)
{
    if ( window.XSLTProcessor ) {
        var proc = new XSLTProcessor();
        proc.importStylesheet( xslDoc );
        return proc.transformToDocument(xmlDoc);
    } else if ( window.ActiveXObject ) {
        return document.parseXmlFromString(xmlDoc.transformNode(xslDoc));
    } else {
        alert( 'Unable to perform XSLT transformation in this browser' );
    }
}
 
// DOMElement

Element_removeFromDoc = function (DOM_Element)
{
    DOM_Element.parentNode.removeChild(DOM_Element);
}

Element_emptyChildren = function (DOM_Element)
{
    while( DOM_Element.firstChild ) {
        DOM_Element.removeChild( DOM_Element.firstChild )
    }
}

Element_appendTransformResult = function ( DOM_Element, xmlDoc, xslDoc )
{
    if ( window.XSLTProcessor ) {
        var proc = new XSLTProcessor();
        proc.importStylesheet( xslDoc );
        var docFrag = false;
        docFrag = proc.transformToFragment( xmlDoc, DOM_Element.ownerDocument );
        DOM_Element.appendChild(docFrag);
    } else if ( window.ActiveXObject ) {
        DOM_Element.innerHTML = xmlDoc.transformNode( xslDoc );
    } else {
        alert( 'Unable to perform XSLT transformation in this browser' );
    }
}
 
Element_appendTextNode = function (DOM_Element, tagName, textContent )
{
    var node = DOM_Element.ownerDocument.createElement(tagName);
    var text = DOM_Element.ownerDocument.createTextNode(textContent);

    DOM_Element.appendChild(node);
    node.appendChild(text);

    return node;
}

Element_setTextContent = function ( DOM_Element, textContent )
{
    if (typeof DOM_Element.textContent !== "undefined") {
        DOM_Element.textContent = textContent;
    } else if (typeof DOM_Element.innerText !== "undefined" ) {
        DOM_Element.innerText = textContent;
    } else {
        throw new Error("Cannot set text content of the node, no such method.");
    }
}

Element_getTextContent = function (DOM_Element)
{
    if ( typeof DOM_Element.textContent != 'undefined' ) {
        return DOM_Element.textContent;
    } else if (typeof DOM_Element.text != 'undefined') {
        return DOM_Element.text;
    } else {
        throw new Error("Cannot get text content of the node, no such method.");
    }
}

/*
*********************************************************************************
** QUERY CLASS ******************************************************************
*********************************************************************************
*/

var pzFilter = function()
{
    this.filterHash = new Array();
    this.filterNums = 0;
};

pzFilter.prototype = 
{
    addFilter: function(name, value)
    {
        var filter = {"name": name, "id": value };
        this.filterHash[this.filterHash.length] = filter;
        this.filterNums++
        return  this.filterHash.length - 1;
    },
    
    setFilter: function(name, value)
    {
        this.filterHash = new Array();
        this.filterNums = 0;
        this.addFilter(name, value);
    },
    
    getFilter: function(index)
    {
        return this.filterHash[index].id;
    },
    
    getFilterName: function(index)
    {
        return this.filterHash[index].name;
    },
    
    removeFilter: function(index)
    {
        delete this.filterHash[index];
        this.filterNums--;
    },
    
    clearFilter: function()
    {
        this.filterHash = new Array();
        this.filterNums = 0;
    },
    
    getFilterString: function()
    { 
        if( this.filterNums <= 0 ) {
            return undefined;
        }

        var filter = 'pz:id=';
        for(var i = 0; i < this.filterHash.length; i++)
        {
            if (this.filterHash[i] == undefined) continue;
            if (filter > 'pz:id=') filter = filter + '|';            
            filter += this.filterHash[i].id; 
        }
        return filter;
    }
};

var mkState = function()
{
    this.sort = 'relevance';
    this.perPage = 20;
    this.page = 0;
    this.simpleQuery = '';
    this.singleFilter = null;
    this.advTerms = new Array();
    this.numTerms = 0;
    this.action = '';
};

mkState.prototype = 
{
    reset: function()
    {
        this.simpleQuery = '';
        this.advTerms = new Array();
        this.simpleFilter = null;
        this.numTerms = 0;
    },
    
    clearSimpleQuery: function()
    {
        this.simpleQuery = '';
    },
    
    addTerm: function(field, value)
    {
        var term = {"field": field, "value": value};
        this.advTerms[this.numTerms] = term;
        this.numTerms++;
    },
    
    getTermValueByIdx: function(index)
    {
        return this.advTerms[index].value;
    },
    
    getTermFieldByIdx: function(index)
    {
        return this.advTerms[index].field;
    },
    
    /* semicolon separated list of terms for given field*/
    getTermsByField: function(field)
    {
        var terms = '';
        for(var i = 0; i < this.advTerms.length; i++)
        {
            if( this.advTerms[i].field == field )
                terms = terms + this.queryHas[i].value + ';';
        }
        return terms;
    },
    
    addTermsFromList: function(inputString, field)
    {
        var inputArr = inputString.split(';');
        for(var i=0; i < inputArr.length; i++)
        {
            if(inputArr[i].length < 3) continue;
            this.advTerms[this.numTerms] 
                = {"field": field, "value": inputArr[i] };
            this.numTerms++;
        }
    },
    
    removeTermByIdx: function(index)
    {
        this.advTerms.splice(index, 1);
        this.numTerms--;
    },
    
    toCCL: function()
    {   
        var ccl = '';
        if( this.simpleQuery != '')
            ccl = this.simpleQuery;
        for(var i = 0; i < this.advTerms.length; i++)
        {
            if (ccl != '') ccl = ccl + ' and ';
            ccl = ccl + this.advTerms[i].field
                +'="'+this.advTerms[i].value+'"';
        }
        return ccl;
    },
    
    totalLength: function()
    {
        var simpleLength = this.simpleQuery != '' ? 1 : 0;
        return this.advTerms.length + simpleLength;
    },
    
    clearSingleFilter: function()
    {
        this.singleFilter = null;
    },
    
    setSingleFilter: function(name, value)
    {
        this.singleFilter = {"name": name, "id": value };
    },
    
    getSingleFilterName: function()
    {
        return this.singleFilter.name;
    },

    getSingleFilterString: function()
    {
        if( this.singleFilter != null ) {
            return 'pz:id='+this.singleFilter.id;
        } else {
            return undefined;
        }
    }
};
}
