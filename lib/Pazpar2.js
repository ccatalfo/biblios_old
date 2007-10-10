function Pazpar2() {
	var self = this;
	this.sessionid = '';
	this.url = '';
	this.errors = new Array();
	this.records = {};
	this.marc = {};
	this.showUrl = '';
	this.record = '';
	this.recordMetadata = '';

	this.handleInit = function handleInit(data) {
		if( this != self ) {
			return handleInit.apply(self, arguments);
		}
		console.info(data);
		if( $("status", data).text() == 'OK') {
			this.sessionid = $("session", data).text();
			this.showUrl = this.url + '?command=show&session=' + this.sessionid;
		}
		else {
			console.error('PazPar2 error', $("error", data).text() );
		}
	}

	this.init = function(url) {
		this.url = url;
		$.ajax({
			type: 'GET',
			url: url,
			data: {command: 'init'},
			dataType: 'text/xml',
			success: this.handleInit,
			error: this.handleInit 
			});
	} 
	this.ping = function ping() { 
			if( this != self ) {
				return ping.apply(self, arguments);
			}
			$.ajax({
			type: 'GET',
			dataType: 'text/xml',
			url: this.url,
			data:{command: 'ping', session: this.sessionid},
			success: function(data) {
				console.info(data);
			},
			error: function(data) {
				console.error(data);
			}
		});
	}

	this.pingAtInterval = function(interval) {
		var pingId = setInterval( this.ping, interval );
		this.pingId = pingId;
	}

	this.clearPing = function() {
		clearInterval( this.pingId );
	}

	this.handleStat = function handleStat(data) {
		if( this != self ) {
			return handleStat.apply(self, arguments);
		}
		this.stat = data;
	}

	this.getStat = function getStat() {
		$.ajax({
			url: this.url,
			data:{command: 'stat', session: this.sessionid},
			dataType: 'text/xml',
			method: 'GET',
			success: this.handleStat
		});
	}

	this.search = function search(ccl) {
		if( this != self ) {
			return search.apply(self, arguments);
		}
		$.ajax({
			url: this.url,
			dataType: 'text/xml',
			data: { command: 'search', session: this.sessionid, query: ccl},
			success: function(data) {
				this.searchresp = data;
			},
			error: function(data) {
				console.error(data);
			}
		});
	}

	this.getShowUrl = function getShowUrl(o) {
		// set up default values or use passed object literal's values
		var start = '0';
		var num = '20';
		var block = '0';
		var sort = 'title:1';
		if(o) {
			start = o.start ? o.start : '0';
			num = o.num ? o.num : '20';
			block = o.block ? o.block : '0';
			sort = o.sort ? o.sort : 'title:1';
		}
		return this.url + '?command=show&session=' + this.sessionid + '&start=' + start + '&num=' + num + '&block=' + block + '&sort=' + sort;
	}

	this.handleShow = function handleShow(data) {
		if( this != self ) {
			return handleShow.apply(self, arguments);
		}
		this.showResp = data;
	}

	this.show = function show(o) {
		if( this != self ) {
			return show.apply(self, arguments);
		}
		// set up default values or use passed object literal's values
		var start = '0';
		var num = '20';
		var block = '0';
		var sort = 'title:1';
		if(o) {
			start = o.start ? o.start : '0';
			num = o.num ? o.num : '20';
			block = o.block ? o.block : '0';
			sort = o.sort ? o.sort : 'title:1';
		}
		$.ajax({
			url: this.url,
			dataType: 'text/xml',
			data: { 
				command: 'show', 
				session: this.sessionid,
				start: start,
				num: num,
				block: block,
				sort: sort
			},
			success: this.handleShow,
			error: function(data) {
				console.error(data);
			}
		});
	}

	this.handleRecordMetaData = function handleRecordMetaData(data) {
		if( this != self ) {
			return handleRecordMetaData.apply(self, arguments);
		}
		this.recordMetadata = data;
	}

	this.getRecordMetadata = function getRecordMetaData(recid) {
		if( this != self ) {
			return getRecordMetaData.apply(self, arguments);
		}
		$.ajax({
			url: this.url,
			dataType: 'text/xml',
			data: { command: 'record', session: this.sessionid, id: recid},
			success: this.handleRecordMetaData,
			error: function(data) {
				console.error(data);
			}
		});
	}

	this.handleGetRecordMarc = function handleGetRecordMarc(data) {
		if( this != self ) {
			return handleGetRecordMarc.apply(self, arguments);
		}
		this.record = data;
	}

	this.getRecordMarc = function getRecordMarc(o) {
		if( this != self ) {
			return getRecordMarc.apply(self, arguments);
		}
		var recid = o.recid;
		var offset = o.offset ? o.offset : '0';
		$.ajax({
			url: this.url,
			dataType: 'text/xml',
			data: { command: 'record', session: this.sessionid, id: recid, offset: offset},
			success: this.handleGetRecordMarc,
			error: function(data) {
				console.error(data);
			}
		});
	}

	this.handleTermList = function handleTermList(data) {
		if( this != self ) {
			return handleTermList.apply(self,arguments);
		}
		this.termList = data;
	}

	this.getTermlist = function getTermList() {
		$.ajax({
			method: 'GET',
			url: this.url,
			data: { command: 'termlist', session: this.sessionid },
			dataType: 'text/xml',
			success: this.handleTermList
		});
	}
	
	this.handleByTarget = function handleByTarget(data) {
		if( this != self ) {
			return handleByTarget.apply(self, arguments);
		}
		self.byTarget = data;
	}
	
	this.getByTarget = function getByTarget(targetid) {
		$.ajax({
			method: 'GET',
			url: this.url,
			data: { command: 'bytarget', session: this.sessionid, id: targetid },
			dataType: 'text/xml',
			success: this.handleByTarget
		});
	}
} // PazPar2 Class

