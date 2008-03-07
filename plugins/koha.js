var koha = function() {
	var that = this;
	// auth stuff
	this.url = '';
	this.user = '';
	this.password = '';
	this.cgisessid = '';
	this.initHandler = function(){};
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
	this.embedded = false; 
	this.savedBiblionumber = '';
	this.retrieveHandler = function() {};
	this.saveHandler = function() {};
};

koha.prototype = {	
		init: function(url, user, password) {
			this.url = url;
			this.user = user;
			this.password = password;
			if ( embeddedUrl + '/' == this.url ) {
				this.embedded = true;
			}
			else {
				this.embedded = false;
			}
			this.auth();
		}, // end init

		auth: function() {
			if( this.embedded ) {
				// if CGISESSID has already been set, we've already authenticated to koha
				$.ajax({
						url: this.url + 'cgi-bin/koha/svc/authentication',
						method: 'post',
						that: this,
						success: function(xml, status) {
							var sessionStatus = $('status', xml).text();
							this.that.sessionStatus = sessionStatus;
							this.that.initHandler(sessionStatus);
						},
						beforeSend: function(req) {
						},
						complete: function(req, textStatus) {
							this.that.cgisessid = req.getResponseHeader('Set-Cookie').substr(10, 32);
							createCookie('CGISESSID', 'CGISESSID=' + this.that.cgisessid);
							this.that.bibprofile();
						}
				});
			}
			else {
				$.ajax({
						url: this.url + 'cgi-bin/koha/svc/authentication',
						method: 'post',
						data: {	
								userid: this.user,
								password: this.password
						},
						that: this,
						success: function(xml, status) {
							var sessionStatus = $('status', xml).text();
							this.that.sessionStatus = sessionStatus;
							this.that.initHandler(sessionStatus);
						},
						beforeSend: function(req) {
						},
						complete: function(req, textStatus) {
							eraseCookie('CGISESSID');
							this.that.cgisessid = req.getResponseHeader('Set-Cookie').substr(10, 32);
							this.that.bibprofile();
						}
				});
			}
		},

		bibprofile: function() {
			eraseCookie('CGISESSID');
			$.ajax({
				url: this.url + 'cgi-bin/koha/svc/bib_profile',
				method: 'get',
				dataType: 'xml',
				that: this,
				success: function(xml, status) {
					this.bibprofilexml = xml;
					// construct record id xpath expression from bib profile
					var tag = $('bib_number tag', xml).text();
					var subfield = $('bib_number subfield', xml).text();
					this.that.recidXpath = 'datafield[@tag='+tag+'] subfield[@code='+subfield+']';
					this.that.mandatory_tags = $('mandatory_tags', xml).children();
					this.that.mandatory_subfields = $('mandatory_subfields', xml).children();
					this.that.reserved_tags = $('reserved_tags', xml).children();
					this.that.special_entries = $('special_entry', xml);
					this.that.bibprofileHandler( xml );
				},
				beforeSend: function(req) {
					req.setRequestHeader('Cookie', 'CGISESSID=' + this.that.cgisessid);
				},
				complete: function(req, textStatus) {
					eraseCookie('CGISESSID');
					if( this.that.embedded ) {
						createCookie('CGISESSID', this.that.cgisessid);
					}
				}
			});
		},

		retrieve: function(xmldoc, callback) {
			eraseCookie('CGISESSID');
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
				},
				beforeSend: function(req) {
					req.setRequestHeader('Cookie', 'CGISESSID=' + this.that.cgisessid);
				},
				complete: function(req, textStatus) {
					eraseCookie('CGISESSID');
					if( this.that.embedded ) {
						createCookie('CGISESSID', this.that.cgisessid);
					}
				}
			});
		},

		save: function(xmldoc) {
			eraseCookie('CGISESSID');
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
				contentType: 'text/xml',
				processData: false,
				data: xmldoc,
				dataType: 'xml',
				url: this.url + 'cgi-bin/koha/svc/' + savepath,
				type: 'POST',
				that: this,
				id: recid,
				success: function(data, textStatus) {
					// check response is ok
					var status = $('status', data).text();
					if( status == 'failed' ) {
						this.scope.saveStatus = 'failed';
					}
					else if( status == 'ok' ) {
						this.that.saveStatus = 'ok';
						var biblionumber = $('biblionumber', data).text();
						this.that.savedBiblionumber = biblionumber;
						// replace marcxml in recordcache	
						var marcxml = $('record', data).get(0);
						this.that.recordCache[ this.id ] = marcxml;
					}
					this.that.saveHandler( marcxml , status);
				},
				error: function(req, textStatus, error) {
					Ext.MessageBox.alert('Error', textStatus);
				},
				beforeSend: function(req) {
					req.setRequestHeader('Cookie', 'CGISESSID=' + this.that.cgisessid);
				},
				complete: function(req, textStatus) {
					eraseCookie('CGISESSID');
					if( this.that.embedded ) {
						createCookie('CGISESSID', this.that.cgisessid);
					}
				}
			});
		}
}; // end public properties


