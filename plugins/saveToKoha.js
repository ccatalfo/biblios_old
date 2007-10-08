var saveToKohaScript = '/cgi-bin/saveToKoha.pl';


function doSaveZ3950() {
	var tab = tabs.getActiveTab();
	var id = tab.recid;
	try {
		var rs = db.execute('select xml from Records where id=?', [id]);
	} catch(ex) {
		console.error('db error: ' + ex.message);
	}
	var xml = rs.field(0);	
	console.info("saving record id: " + id + " with xml: " + xml);

	Ext.Ajax.request({
		method: 'POST',
		params: {
			'record': xml,
			'host': 'localhost:9999',
			'login': "admin",
			'pass': "admin",
			'marcflavour': marcflavour,
			'encoding': 'utf-8'	
			}, 
		url: saveToKohaScript,
		callback: Ext.MessageBox.alert('Status', 'Attempted to save to Koha.')
	});
}

