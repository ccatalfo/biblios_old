var koha = function() {
	var that = this;
	this.url = '';
	this.user = '';
	this.password = '';
	this.bibprofilexml = '';
	this.sessionStatus = 'uninitialized';
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
				optios.scope.bibprofilexml = resp.responseXML;
			});
			Ext.Ajax.request({
				url: this.url + 'cgi-bin/koha/biblios/bib_profile',
				method: 'get',
			});
		},

		retrieve: function koharetrieve(xml) {
			alert('retrieving record from koha!');	
			// var recid = $('datafield[@tag=999] subfield[@code=a]', marcxml).text();
			// $.get(  + '/cgi-bin/koha/biblios/bib/' + recid , function(data) {
			// 	openRecord(data);
			// });
		},

		save: function save() {

		}
}; // end public properties


