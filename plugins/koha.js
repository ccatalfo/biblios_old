var koha = function() {
	var that = this;
	// auth stuff
	this.url = '';
	this.user = '';
	this.password = '';
	// bib profile
	this.bibprofileHandler = '';
	this.bibprofilexml = '';
	this.mandatory_subfields = new Array();
	this.mandatory_tags = new Array();
	this.reserved_tags = new Array();
	this.sessionStatus = 'uninitialized';
	this.recidXpath = '';
	// record save and retrieval
	this.recordCache = {};
	this.saveStatus = '';
	this.savedBiblionumber = '';
	this.retrieveHandler = '';
	this.saveHandler = '';
};

koha.prototype = {	
		init: function(url, user, password) {
			this.url = url;
			this.user = user;
			this.password = password;
			this.auth();
		}, // end init

		auth: function() {
			Ext.Ajax.on('requestcomplete', function(conn, resp, options) {
				options.scope.sessionStatus = $('status', resp.responseXML).text();
				Ext.Ajax.purgeListeners();
			});

			Ext.Ajax.request({
					url: this.url + 'cgi-bin/koha/biblios/authentication',
					method: 'post',
					params: {	
							userid: this.user,
							password: this.password
					},
					scope: this
				});
		},

		bibprofile: function() {
			Ext.Ajax.on('requestcomplete', function(conn, resp, options) {
				xml = resp.responseXML;
				options.scope.bibprofilexml = xml;
				// construct record id xpath expression from bib profile
				var tag = $('bib_number/tag', xml).text();
				var subfield = $('bib_number/subfield', xml).text();
				options.scope.recidXpath = 'datafield[@tag='+tag+'] subfield[@code='+subfield+']';
				options.scope.mandatory_tags = $('mandatory_tags', xml).children();
				options.scope.mandatory_subfields = $('mandatory_subfields', xml).children();
				options.scope.reserved_tags = $('reserved_tags', xml).children();
				options.scope.special_entries = $('special_entry', xml);
				options.scope.bibprofileHandler( xml );
				Ext.Ajax.purgeListeners();
			});
			Ext.Ajax.request({
				url: this.url + 'cgi-bin/koha/biblios/bib_profile',
				method: 'get',
				scope: this
			});
		},

		retrieve: function(xmldoc, callback) {
			//alert('retrieving record from koha!');	
			var recid = $(this.recidXpath, xmldoc).text();
			Ext.Ajax.on('requestcomplete', function(conn, resp, options) {
				options.scope.recordCache[ options.id ] = resp.responseXML;
				options.scope.retrieveHandler(resp.responseXML);
				Ext.Ajax.purgeListeners();
			});
			Ext.Ajax.request({
				url: this.url + 'cgi-bin/koha/biblios/bib/' + recid,
				method: 'get',
				scope: this,
				id: recid
			});
		},

		save: function(xmldoc) {
			// if we have a bib number, replace. Otherwise, new bib
			var recid = $(this.recidXpath, xmldoc).text();
			var savepath = '';
			if(recid != '') {
				savepath = 'bib/'+recid;
			}
			else {
				savepath = 'new_bib';
			}
			Ext.Ajax.on('requestcomplete', function(conn, resp, options) {
				// check response is ok
				var status = $('status', resp.responseXML).text();
				if( status == 'failed' ) {
					options.scope.saveStatus = 'failed';
				}
				else if( status == 'ok' ) {
					options.scope.saveStatus = 'ok';
					var biblionumber = $('biblionumber', resp.responseXML).text();
					options.scope.savedBiblionumber = biblionumber;
					// replace marcxml in recordcache	
					var marcxml = $('record', resp.responseXML);
					options.scope.recordCache[ options.id ] = marcxml;
				}
				options.scope.saveHandler( marcxml );
				Ext.Ajax.purgeListeners();
			});
			Ext.Ajax.request({
				url: this.url + 'cgi-bin/koha/biblios/' + savepath,
				method: 'post',
				id: recid,
				xmlData: xmldoc,
				scope: this,
				params: {}
			});
		}
}; // end public properties


