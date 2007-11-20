var koha = function() {
	var that = this;
	this.url = '';
	this.user = '';
	this.password = '';
	this.bibprofilexml = '';
	this.sessionStatus = 'uninitialized';
	this.recidXpath = 'datafield[@tag=999] subfield[@code=c]';
	this.recordCache = {};
};

koha.prototype = {	
		init: function(url, user, password) {
			this.url = url;
			this.user = user;
			this.password = password;
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
				options.scope.bibprofilexml = resp.responseXML;
				Ext.Ajax.purgeListeners();
			});
			Ext.Ajax.request({
				url: this.url + 'cgi-bin/koha/biblios/bib_profile',
				method: 'get',
				scope: this
			});
		},

		retrieve: function koharetrieve(xml) {
			//alert('retrieving record from koha!');	
			var recid = $(this.recidXpath, xml).text();
			Ext.Ajax.on('requestcomplete', function(conn, resp, options) {
				options.scope.recordCache[ options.id ] = resp.responseXML;
			});
			Ext.Ajax.request({
				url: this.url + 'cgi-bin/koha/biblios/bib/' + recid,
				method: 'get',
				scope: this,
				id: recid
			});
		},

		save: function save() {

		}
}; // end public properties


