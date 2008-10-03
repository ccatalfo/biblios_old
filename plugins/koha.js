var koha = function() {
	var that = this;
	// auth stuff
	this.url = '';
	this.name = '';
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
		init: function(url, name, user, password, embedded) {
			this.url = url;
            // add trailing slash if missing
            if( this.url[ this.url.length-1] != '/') {
                this.url += '/';
            }
			this.name = name;
			this.user = user;
			this.password = password;
            this.embedded = embedded;
            if( embedded ) {
                if( $.cookie('CGISESSID') ) {
                    this.cgisessid = $.cookie('CGISESSID');
                }
                else {
                    throw {
                        msg: 'Biblios is embedded but cookie from Koha not found'
                    }
                }
            }
            if( user == '' || !user || password == '' || !password) {
                throw {
                    msg: 'No username or password!'
                }
            }
            if( url == '' || !url ) {
                throw {
                    msg: 'No url!'
                }
            }
			this.auth();
		}, // end init

		auth: function() {
            $.ajax({
                    url: cgiDir + 'kohaws.pl',
                    method: 'post',
                    data:{ 
                        kohaurl: this.url,
                        userid: this.user,
                        password: this.password,
                        action:'auth'
                    },
                    that: this,
                    dataType:'json',
                    success: function(json, status) {
                        var sessionStatus = $('status', json.resp).text();
                        var cookie = json.cookie;
                        this.that.cookie = cookie;
                        this.that.sessionStatus = sessionStatus;
                        if( sessionStatus == 'ok') {
                            this.that.bibprofile();
                        }
                        this.that.initHandler(sessionStatus);
                    },
                    error: function(req, textStatus, errorThrown) {
                        var sessionStatus = $('status', json.resp).text();
                        this.that.sessionStatus = sessionStatus;
                        this.that.initHandler(sessionStatus);
                    },
                    beforeSend: function(req) {
                    },
                    complete: function(req, textStatus) {
                    }
            });
		},

		bibprofile: function() {
			$.ajax({
				url: cgiDir + 'kohaws.pl',
				method: 'get',
				dataType: 'xml',
                data: { action:'bibprofile', cookie:this.cookie, kohaurl:this.url},
				that: this,
				success: function(xml, status) {
					this.that.bibprofilexml = xml;
					var bibprofileStatus = $('auth_status', xml).text();
					// construct record id xpath expression from bib profile
					var tag = $('bib_number tag', xml).text();
					var subfield = $('bib_number subfield', xml).text();
					this.that.recidXpath = 'datafield[@tag='+tag+'] subfield[@code='+subfield+']';
					this.that.mandatory_tags = $('mandatory_tags', xml).children();
					this.that.mandatory_subfields = $('mandatory_subfields', xml).children();
					this.that.reserved_tags = $('reserved_tags', xml).children();
					this.that.special_entries = $('special_entry', xml);
					this.that.bibprofileHandler( xml , bibprofileStatus);
				},
				beforeSend: function(req) {
				},
				complete: function(req, textStatus) {
				},
                error: function(req, textStatus, errorThrown) {
					var bibprofileStatus = $('auth_status', req.responseXML).text();
					this.that.bibprofileHandler( req.responseXML , bibprofileStatus);
                }
			});
		},

		retrieve: function(recid, callback) {
			$.ajax({
				url: cgiDir+'kohaws.pl',
				method: 'get',
				that: this,
				dataType: 'xml',
                data:{cookie:this.cookie,action:'retrieve',recid:recid, kohaurl:this.url},
				id: recid,
				success: function(xml, status) {
					this.that.recordCache[ this.id ] = xml;
					this.that.retrieveHandler(xml);
				},
				beforeSend: function(req) {
				},
				complete: function(req, textStatus) {
				}
			});
		},

		save: function(xmldoc) {
			// if we have a bib number, replace. Otherwise, new bib
            if( this.recidXpath == '' || this.recidXpath === undefined) {
                throw {
                    msg: 'Unable to retrieve record id (xpath not set).  Please check your Koha connection.'
                }
            }
			var recid = $(this.recidXpath, xmldoc).text();
			var savepath = '';
			if(recid != '') {
				savepath = 'bib/'+recid;
			}
			else {
				savepath = 'new_bib';
			}
            var xml = xslTransform.serialize(xmldoc);
			$.ajax({
                dataType: 'xml',
				data: {
                    xml:xml,
                    kohaurl:this.url, 
                    saveurl:savepath,
                    action:'save',
                    cookie:this.cookie
                },
				url: cgiDir+'kohaws.pl',
				type: 'POST',
				that: this,
				id: recid,
                scope: this,
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
                error: function(req, textStatus, errorThrown) {
                    this.that.saveStatus = 'failed';
                    this.that.saveHandler( req.responseXML, textStatus);
                },
				beforeSend: function(req) {
				},
				complete: function(req, textStatus) {
				}
			});
		}
}; // end public properties


