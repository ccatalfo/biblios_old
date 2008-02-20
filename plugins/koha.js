var koha = function() {
	var that = this;
	// auth stuff
	this.url = '';
	this.user = '';
	this.password = '';
	// bib profile
	this.bibprofileHandler = function(){};
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
	this.retrieveHandler = function() {};
	this.saveHandler = function() {};
};

koha.prototype = {	
		init: function(url, user, password) {
			this.url = url;
			this.user = user;
			this.password = password;
			this.auth();
		}, // end init

		auth: function() {
			$.ajax({
					url: this.url + 'cgi-bin/koha/svc/authentication',
					method: 'post',
					data: {	
							userid: this.user,
							password: this.password
					},
					that: this,
					success: function(xml, status) {
						this.that.sessionStatus = $('status', xml).text();
						this.that.bibprofile();
					}
			});
		},

		bibprofile: function() {
			$.ajax({
				url: this.url + 'cgi-bin/koha/svc/bib_profile',
				method: 'get',
				dataType: 'xml',
				that: this,
				success: function(xml, status) {
					this.that.bibprofilexml = xml;
					// construct record id xpath expression from bib profile
					var tag = $('bib_number tag', xml).text();
					var subfield = $('bib_number subfield', xml).text();
					this.that.recidXpath = 'datafield[@tag='+tag+'] subfield[@code='+subfield+']';
					this.that.mandatory_tags = $('mandatory_tags', xml).children();
					this.that.mandatory_subfields = $('mandatory_subfields', xml).children();
					this.that.reserved_tags = $('reserved_tags', xml).children();
					this.that.special_entries = $('special_entry', xml);
					this.that.bibprofileHandler( xml );
				}
			});
		},

		retrieve: function(xmldoc, callback) {
			//alert('retrieving record from koha!');	
			var recid = $(this.recidXpath, xmldoc).text();
			$.ajax({
				url: this.url + 'cgi-bin/koha/svc/bib/' + recid,
				method: 'get',
				that: this,
				dataType: 'xml',
				id: recid,
				success: function(xml, status) {
					this.that.recordCache[ this.id ] = xml;
					this.that.retrieveHandler(xml);
				}
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
			$.ajax({
				contentType: 'application/xml',
				processData: false,
				data: xmldoc,
				dataType: 'xml',
				url: this.url + 'cgi-bin/koha/svc/' + savepath,
				type: 'POST',
				scope: this,
				id: recid,
				success: function(data, textStatus) {
					// check response is ok
					var status = $('status', data).text();
					if( status == 'failed' ) {
						this.scope.saveStatus = 'failed';
					}
					else if( status == 'ok' ) {
						this.scope.saveStatus = 'ok';
						var biblionumber = $('biblionumber', data).text();
						this.scope.savedBiblionumber = biblionumber;
						// replace marcxml in recordcache	
						var marcxml = $('record', data).get(0);
						this.scope.recordCache[ this.id ] = marcxml;
					}
					this.scope.saveHandler( marcxml , status);
				},
				error: function(req, textStatus, error) {
					Ext.MessageBox.alert('Error', textStatus);
				}
			});
			/*Ext.Ajax.on('requestcomplete', function(conn, resp, options) {
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
					var marcxml = $('record', resp.responseXML).get(0);
					options.scope.recordCache[ options.id ] = marcxml;
				}
				options.scope.saveHandler( marcxml , status);
				Ext.Ajax.purgeListeners();
			});
			Ext.Ajax.request({
				url: this.url + 'cgi-bin/koha/svc/' + savepath,
				method: 'POST',
				id: recid,
				xmlData: xmldoc,
				scope: this,
				headers: { 'Content-Type': 'application/xml'},
				useDefaultHeader: false
			});*/
		}
}; // end public properties


