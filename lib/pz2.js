/*
** $Id: pz2.js,v 1.65 2007-11-01 10:59:32 marc Exp $
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
        throw new Error("Pz2.js: Array with parameters has to be suplied."); 

    //supported pazpar2's protocol version
    this.suppProtoVer = '1';
    if (typeof paramArray.pazpar2path != "undefined")
        this.pz2String = paramArray.pazpar2path;
    else
        this.pz2String = "/pazpar2/search.pz2";
    this.useSessions = true;
    
    this.stylesheet = paramArray.detailstylesheet || null;
    //load stylesheet if required in async mode
    if( this.stylesheet ) {
        var context = this;
        var request = new pzHttpRequest( this.stylesheet );
        request.get( {}, function ( doc ) { context.xslDoc = doc; } );
    }
    
    this.errorHandler = paramArray.errorhandler || null;
    
    // function callbacks
    this.initCallback = paramArray.oninit || null;
    this.statCallback = paramArray.onstat || null;
    this.showCallback = paramArray.onshow || null;
    this.termlistCallback = paramArray.onterm || null;
    this.recordCallback = paramArray.onrecord || null;
    this.bytargetCallback = paramArray.onbytarget || null;
    this.resetCallback = paramArray.onreset || null;

    // termlist keys
    this.termKeys = paramArray.termlist || "subject";
    
    // some configurational stuff
    this.keepAlive = 50000;
    
    if ( paramArray.keepAlive < this.keepAlive )
        this.keepAlive = paramArray.keepAlive;

    this.sessionID = null;
    this.initStatusOK = false;
    this.pingStatusOK = false;
    this.searchStatusOK = false;
    
    // for sorting
    this.currentSort = "relevance";

    // where are we?
    this.currentStart = 0;
    this.currentNum = 20;

    // last full record retrieved
    this.currRecID = null;
    
    // current query
    this.currQuery = null;

    //timers
    this.statTime = paramArray.stattime || 1000;
    this.statTimer = null;
    this.termTime = paramArray.termtime || 1000;
    this.termTimer = null;
    this.showTime = paramArray.showtime || 1000;
    this.showTimer = null;
    this.showFastCount = 4;
    this.bytargetTime = paramArray.bytargettime || 1000;
    this.bytargetTimer = null;

    // counters for each command and applied delay
    this.dumpFactor = 500;
    this.showCounter = 0;
    this.termCounter = 0;
    this.statCounter = 0;
    this.bytargetCounter = 0;

    // active clients, updated by stat and show
    // might be an issue since bytarget will poll accordingly
    this.activeClients = 1;

    // if in proxy mode no need to init
    if (paramArray.usesessions != undefined) {
         this.useSessions = paramArray.usesessions;
        this.initStatusOK = true;
    }
    // else, auto init session or wait for a user init?
    if (this.useSessions && paramArray.autoInit !== false) {
        this.init();
    }
};

pz2.prototype = 
{
    //error handler for async error throws
   throwError: function (errMsg, errCode)
   {
        var err = new Error(errMsg);
        if (errCode) err.code = errCode;
                
        if (this.errorHandler) {
            this.errorHandler(err);
        }
        else {
            throw err;
        }
   },

    // stop activity by clearing tiemouts 
   stop: function ()
   {
       clearTimeout(this.statTimer);
       clearTimeout(this.showTimer);
       clearTimeout(this.termTimer);
       clearTimeout(this.bytargetTimer);
    },
    
    // reset status variables
    reset: function ()
    {   
        if ( this.useSessions ) {
            this.sessionID = null;
            this.initStatusOK = false;
            this.pingStatusOK = false;
        }
        this.searchStatusOK = false;
        this.stop();
            
        if ( this.resetCallback )
                this.resetCallback();
    },

    init: function ( sessionId ) 
    {
        this.reset();
        
        // session id as a param
        if ( sessionId != undefined && this.useSessions ) {
            this.initStatusOK = true;
            this.sessionID = sessionId;
            this.ping();
        // old school direct pazpar2 init
        } else if (this.useSessions) {
            var context = this;
            var request = new pzHttpRequest(this.pz2String, this.errorHandler);
            request.get(
                { "command": "init" },
                function(data) {
                    if ( data.getElementsByTagName("status")[0]
                            .childNodes[0].nodeValue == "OK" ) {
                        if ( data.getElementsByTagName("protocol")[0]
                                .childNodes[0].nodeValue 
                            != context.suppProtoVer )
                            throw new Error(
                                "Server's protocol not supported by the client"
                            );
                        context.initStatusOK = true;
                        context.sessionID = 
                            data.getElementsByTagName("session")[0]
                                .childNodes[0].nodeValue;
                        setTimeout(
                            function () {
                                context.ping();
                            },
                            context.keepAlive
                        );
                        if ( context.initCallback )
                            context.initCallback();
                    }
                    else
                        context.throwError('Init failed. Malformed WS resonse.',
                                            110);
                }
            );
        // when through proxy no need to init
        } else {
            this.initStatusOK = true;
	}
    },
    // no need to ping explicitly
    ping: function () 
    {
        // pinging only makes sense when using pazpar2 directly
        if( !this.initStatusOK || !this.useSessions )
            throw new Error(
            'Pz2.js: Ping not allowed (proxy mode) or session not initialized.'
            );
        var context = this;
        var request = new pzHttpRequest(this.pz2String, this.errorHandler);
        request.get(
            { "command": "ping", "session": this.sessionID },
            function(data) {
                if ( data.getElementsByTagName("status")[0]
                        .childNodes[0].nodeValue == "OK" ) {
                    context.pingStatusOK = true;
                    setTimeout(
                        function () {
                            context.ping();
                        }, 
                        context.keepAlive
                    );
                }
                else
                    context.throwError('Ping failed. Malformed WS resonse.',
                                        111);
            }
        );
    },
    search: function (query, num, sort, filter, showfrom)
    {
        clearTimeout(this.statTimer);
        clearTimeout(this.showTimer);
        clearTimeout(this.termTimer);
        clearTimeout(this.bytargetTimer);
        
        this.showCounter = 0;
        this.termCounter = 0;
        this.bytargetCounter = 0;
        this.statCounter = 0;
        
        // no proxy mode
        if( !this.initStatusOK )
            throw new Error('Pz2.js: session not initialized.');
        
        if( query !== undefined )
            this.currQuery = query;
        else
            throw new Error("Pz2.js: no query supplied to the search command.");
        
        if ( showfrom !== undefined )
            var start = showfrom;
        else
            var start = 0;

	var searchParams = { 
            "command": "search",
            "query": this.currQuery, 
            "session": this.sessionID 
        };
	
        if (filter !== undefined)
	    searchParams["filter"] = filter;
        
        var context = this;
        var request = new pzHttpRequest(this.pz2String, this.errorHandler);
        request.get(
            searchParams,
            function(data) {
                if ( data.getElementsByTagName("status")[0]
                        .childNodes[0].nodeValue == "OK" ) {
                    context.searchStatusOK = true;
                    //piggyback search
                    context.show(start, num, sort);
                    if ( context.statCallback )
                        context.stat();
                    if ( context.termlistCallback )
                        context.termlist();
                    if ( context.bytargetCallback )
                        context.bytarget();
                }
                else
                    context.throwError('Search failed. Malformed WS resonse.',
                                        112);
            }
        );
    },
    stat: function()
    {
        if( !this.initStatusOK )
            throw new Error('Pz2.js: session not initialized.');
        
        // if called explicitly takes precedence
        clearTimeout(this.statTimer);
        
        var context = this;
        var request = new pzHttpRequest(this.pz2String, this.errorHandler);
        request.get(
            { "command": "stat", "session": this.sessionID },
            function(data) {
                if ( data.getElementsByTagName("stat") ) {
                    var activeClients = 
                        Number( data.getElementsByTagName("activeclients")[0]
                                    .childNodes[0].nodeValue );
                    context.activeClients = activeClients;
                    var stat = {
                        "activeclients": activeClients,
                        "hits": 
                            Number( data.getElementsByTagName("hits")[0]
                                        .childNodes[0].nodeValue ),
                        "records": 
                            Number( data.getElementsByTagName("records")[0]
                                        .childNodes[0].nodeValue ),
                        "clients": 
                            Number( data.getElementsByTagName("clients")[0]
                                        .childNodes[0].nodeValue ),
                        "initializing": 
                            Number( data.getElementsByTagName("initializing")[0]
                                        .childNodes[0].nodeValue ),
                        "searching": 
                            Number( data.getElementsByTagName("searching")[0]
                                        .childNodes[0].nodeValue ),
                        "presenting": 
                            Number( data.getElementsByTagName("presenting")[0]
                                        .childNodes[0].nodeValue ),
                        "idle": 
                            Number( data.getElementsByTagName("idle")[0]
                                        .childNodes[0].nodeValue ),
                        "failed": 
                            Number( data.getElementsByTagName("failed")[0]
                                        .childNodes[0].nodeValue ),
                        "error": 
                            Number( data.getElementsByTagName("error")[0]
                                        .childNodes[0].nodeValue )
                    };
                    
                    context.statCounter++;
		    var delay = context.statTime 
                        + context.statCounter * context.dumpFactor;
                    
                    if ( activeClients > 0 )
                        context.statTimer = 
                            setTimeout( 
                                function () {
                                    context.stat();
                                },
                                delay
                            );
                    context.statCallback(stat);
                }
                else
                    context.throwError('Stat failed. Malformed WS resonse.',
                                        113);
            }
        );
    },
    show: function(start, num, sort)
    {
        if( !this.searchStatusOK && this.useSessions )
            throw new Error(
                'Pz2.js: show command has to be preceded with a search command.'
            );
        
        // if called explicitly takes precedence
        clearTimeout(this.showTimer);
        
        if( sort !== undefined )
            this.currentSort = sort;
        if( start !== undefined )
            this.currentStart = Number( start );
        if( num !== undefined )
            this.currentNum = Number( num );

        var context = this;
        var request = new pzHttpRequest(this.pz2String, this.errorHandler);
        request.get(
            { 
                "command": "show", 
                "session": this.sessionID, 
                "start": this.currentStart,
                "num": this.currentNum, 
                "sort": this.currentSort, 
                "block": 1 
            },
            function(data) {
                if ( data.getElementsByTagName("status")[0]
                        .childNodes[0].nodeValue == "OK" ) {
                    // first parse the status data send along with records
                    // this is strictly bound to the format
                    var activeClients = 
                        Number( data.getElementsByTagName("activeclients")[0]
                                    .childNodes[0].nodeValue );
                    context.activeClients = activeClients; 
                    var show = {
                        "activeclients": activeClients,
                        "merged": 
                            Number( data.getElementsByTagName("merged")[0]
                                        .childNodes[0].nodeValue ),
                        "total": 
                            Number( data.getElementsByTagName("total")[0]
                                        .childNodes[0].nodeValue ),
                        "start": 
                            Number( data.getElementsByTagName("start")[0]
                                        .childNodes[0].nodeValue ),
                        "num": 
                            Number( data.getElementsByTagName("num")[0]
                                        .childNodes[0].nodeValue ),
                        "hits": []
                    };
                    // parse all the first-level nodes for all <hit> tags
                    var hits = data.getElementsByTagName("hit");
                    var hit = new Array();
                    for (i = 0; i < hits.length; i++) {
                        show.hits[i] = new Array();
			show.hits[i]['location'] = new Array();
			var locCount = 0;
                        for ( j = 0; j < hits[i].childNodes.length; j++) {
                            if ( hits[i].childNodes[j].nodeType 
                                == Node.ELEMENT_NODE ) {
				if (hits[i].childNodes[j].nodeName 
                                    == 'location') {
				    var locNode = hits[i].childNodes[j];
				    var id = locNode.getAttribute('id');
				    show.hits[i]['location'][locCount] = {
					"id": locNode.getAttribute("id"),
					"name": locNode.getAttribute("name")
				    };
                                    locCount++;
				}
				else {
				    var nodeName = 
                                        hits[i].childNodes[j].nodeName;
                                    var nodeText = 'ERROR'
                                    if ( hits[i].childNodes[j].firstChild )
                                        nodeText = 
                                            hits[i].childNodes[j]
                                                .firstChild.nodeValue;
				    show.hits[i][nodeName] = nodeText;
				}
                            }
                        }
						show.hits[i].loccount = locCount;
                    }
                    context.showCounter++;
		    var delay = context.showTime;
		    if (context.showCounter > context.showFastCount)
                            delay += context.showCounter * context.dumpFactor;
                    if ( activeClients > 0 )
                        context.showTimer = setTimeout(
                            function () {
                                context.show();
                            }, 
                            delay);

                    context.showCallback(show);
                }
                else
                    context.throwError('Show failed. Malformed WS resonse.',
                                        114);
            }
        );
    },
    record: function(id, offset, params)
    {
        // we may call record with no previous search if in proxy mode
        if( !this.searchStatusOK && this.useSessions)
           throw new Error(
            'Pz2.js: record command has to be preceded with a search command.'
            ); 
        if ( params == undefined )
            params = {};

        if ( params.callback != undefined ) {
            callback = params.callback;
        } else {
            callback = this.recordCallback;
        }
        
        // what is that?
        if ( params['handle'] == undefined )
            handle = {};
        else
            handle = params['handle'];

        if( id !== undefined )
            this.currRecID = id;
        
        var context = this;
        var request = new pzHttpRequest(this.pz2String, this.errorHandler);

	var recordParams = { "command": "record", 
                            "session": this.sessionID,
                            "id": this.currRecID };
	
        if (offset !== undefined) {
	    recordParams["offset"] = offset;
	}

        if (params.syntax != undefined) {
            recordParams['syntax'] = params.syntax;
        }

	this.currRecOffset = offset;

        request.get(
	    recordParams,
            function(data) {
                var recordNode;
                var record = new Array();
                record['xmlDoc'] = data;
		if (context.currRecOffset !== undefined) {
                    record['offset'] = context.currRecOffset;
                    callback(record, handle);
                } else if ( recordNode = 
                    data.getElementsByTagName("record")[0] ) {
                    // if stylesheet was fetched do not parse the response
                    if ( context.xslDoc ) {
                        record['recid'] = 
                            recordNode.getElementsByTagName("recid")[0]
                                .firstChild.nodeValue;
                        record['xslDoc'] = 
                            context.xslDoc;
                    } else {
                        for ( i = 0; i < recordNode.childNodes.length; i++) {
                            if ( recordNode.childNodes[i].nodeType 
                                == Node.ELEMENT_NODE
                                && recordNode.childNodes[i].nodeName 
                                != 'location' ) {
                                var nodeName = 
                                    recordNode.childNodes[i].nodeName;
                                var nodeText = '';
                                if (recordNode.childNodes[i].firstChild)
                                    nodeText = recordNode.childNodes[i]
                                        .firstChild.nodeValue;
                                record[nodeName] = nodeText;                            
                            }
                        }
                        // the location might be empty!!
                        var locationNodes = 
                            recordNode.getElementsByTagName("location");
                        record["location"] = new Array();
                        for ( i = 0; i < locationNodes.length; i++ ) {
                            record["location"][i] = {
                                "id": locationNodes[i].getAttribute("id"),
                                "name": locationNodes[i].getAttribute("name")
                            };
                            
                            for (j = 0; 
                                j < locationNodes[i].childNodes.length; 
                                j++) {
                                if ( locationNodes[i].childNodes[j].nodeType 
                                    == Node.ELEMENT_NODE ) {
                                    var nodeName = 
                                        locationNodes[i].childNodes[j].nodeName;
                                    var nodeText = '';
                                    if (locationNodes[i].childNodes[j]
                                            .firstChild)
                                        nodeText = 
                                            locationNodes[i].childNodes[j]
                                                .firstChild.nodeValue;
                                    record["location"][i][nodeName] = nodeText;                            
                                }
                            }
                        }
                    }
                    
                    callback(record, handle);
                }
                else
                    context.throwError('Record failed. Malformed WS resonse.',
                                        115);
            }
        );
    },

    termlist: function()
    {
        if( !this.searchStatusOK && this.useSessions )
            throw new Error(
            'Pz2.js: termlist command has to be preceded with a search command.'
            );

        // if called explicitly takes precedence
        clearTimeout(this.termTimer);
        
        var context = this;
        var request = new pzHttpRequest(this.pz2String, this.errorHandler);
        request.get(
            { 
                "command": "termlist", 
                "session": this.sessionID, 
                "name": this.termKeys 
            },
            function(data) {
                if ( data.getElementsByTagName("termlist") ) {
                    var activeClients = 
                        Number( data.getElementsByTagName("activeclients")[0]
                                    .childNodes[0].nodeValue );
                    context.activeClients = activeClients;
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
                                "name": 
                                    (terms[j].getElementsByTagName("name")[0]
                                        .childNodes.length 
                                    ? terms[j].getElementsByTagName("name")[0]
                                        .childNodes[0].nodeValue
                                    : 'ERROR'),
                                "freq": 
                                    terms[j]
                                    .getElementsByTagName("frequency")[0]
                                    .childNodes[0].nodeValue || 'ERROR'
                            };

                            var termIdNode = 
                                terms[j].getElementsByTagName("id");
                            if(terms[j].getElementsByTagName("id").length)
                                term["id"] = 
                                    termIdNode[0].childNodes[0].nodeValue;
                            termList[listName][j] = term;
                        }
                    }

                    context.termCounter++;
                    var delay = context.termTime 
                        + context.termCounter * context.dumpFactor;
                    if ( activeClients > 0 )
                        context.termTimer = 
                            setTimeout(
                                function () {
                                    context.termlist();
                                }, 
                                delay
                            );
                   
                   context.termlistCallback(termList);
                }
                else
                    context.throwError('Termlist failed. Malformed WS resonse.',
                                        116);
            }
        );

    },
    bytarget: function()
    {
        if( !this.initStatusOK && this.useSessions )
            throw new Error(
            'Pz2.js: bytarget command has to be preceded with a search command.'
            );
        
        // no need to continue
        if( !this.searchStatusOK )
            return;

        // if called explicitly takes precedence
        clearTimeout(this.bytargetTimer);
        
        var context = this;
        var request = new pzHttpRequest(this.pz2String, this.errorHandler);
        request.get(
            { "command": "bytarget", "session": this.sessionID },
            function(data) {
                if ( data.getElementsByTagName("status")[0]
                        .childNodes[0].nodeValue == "OK" ) {
                    var targetNodes = data.getElementsByTagName("target");
                    var bytarget = new Array();
                    for ( i = 0; i < targetNodes.length; i++) {
                        bytarget[i] = new Array();
                        for( j = 0; j < targetNodes[i].childNodes.length; j++ ) {
                            if ( targetNodes[i].childNodes[j].nodeType 
                                == Node.ELEMENT_NODE ) {
                                var nodeName = 
                                    targetNodes[i].childNodes[j].nodeName;
                                var nodeText = 
                                    targetNodes[i].childNodes[j]
                                        .firstChild.nodeValue;
                                bytarget[i][nodeName] = nodeText;
                            }
                        }
                    }
                    
                    context.bytargetCounter++;
                    var delay = context.bytargetTime 
                        + context.bytargetCounter * context.dumpFactor;
                    if ( context.activeClients > 0 )
                        context.bytargetTimer = 
                            setTimeout(
                                function () {
                                    context.bytarget();
                                }, 
                                delay
                            );

                    context.bytargetCallback(bytarget);
                }
                else
                    context.throwError('Bytarget failed. Malformed WS resonse.',
                                        117);
            }
        );
    },
    
    // just for testing, probably shouldn't be here
    showNext: function(page)
    {
        var step = page || 1;
        this.show( ( step * this.currentNum ) + this.currentStart );     
    },

    showPrev: function(page)
    {
        if (this.currentStart == 0 )
            return false;
        var step = page || 1;
        var newStart = this.currentStart - (step * this.currentNum );
        this.show( newStart > 0 ? newStart : 0 );
    },

    showPage: function(pageNum)
    {
        //var page = pageNum || 1;
        this.show(pageNum * this.currentNum);
    }
};

/*
********************************************************************************
** AJAX HELPER CLASS ***********************************************************
********************************************************************************
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
                && this.request.responseXML.getElementsByTagName("error")
                    .length ) {
                var errAddInfo = '';
                if ( this.request.responseXML.getElementsByTagName("error")[0]
                        .childNodes.length )
                    errAddInfo = ': ' + 
                        this.request.responseXML
                            .getElementsByTagName("error")[0]
                            .childNodes[0].nodeValue;
                var errMsg = 
                    this.request.responseXML.getElementsByTagName("error")[0]
                        .getAttribute("msg");
                var errCode = 
                    this.request.responseXML.getElementsByTagName("error")[0]
                        .getAttribute("code");
            
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
********************************************************************************
** XML HELPER FUNCTIONS ********************************************************
********************************************************************************
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

/* do not remove trailing bracket */
}
