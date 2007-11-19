// keep prefs in memory
var Prefs = {};
Prefs.remoteILS = {};

function initPrefs() {
	setPazPar2Targets(paz);
	setILSTargets();
}

function setILSTargets() {
	var rs;
	// get all of the pluginlocations from Prefs
	try {
		rs = db.execute('select value from Prefs where name="ilspluginlocation"');
		while(rs.isValidRow() ){
			// retrieve and execute plugin script
			$.getScript( rs.fieldByName('value') );
			rs.next();
		}
	}
	catch(ex) {
		alert(ex.message);
	}
	// get remote ILS location names so we know when to ask remote ILS for record
	try {
		rs = db.execute('select type from Prefs where name="remoteILS"');
		while( rs.isValidRow() ) {
			var ils = rs.fieldByName('type');
			// add to hash of remoteILS locations
			Prefs.remoteILS[ ils ] = {};
			// get params for this ils
			var rs2 = db.execute('select value from Prefs where name="remoteILS" and type="'+ils+'"');
			Prefs.remoteILS[ils].location = rs2.fieldByName('value');
			var rs2 = db.execute('select value from Prefs where name="remoteUser" and type="'+ils+'"');
			Prefs.remoteILS[ils].user = rs2.fieldByName('value');
			var rs2 = db.execute('select value from Prefs where name="remotePassword" and type="'+ils+'"');
			Prefs.remoteILS[ils].pw = rs2.fieldByName('value');
			var rs2 = db.execute('select value from Prefs where name="remoteUrl" and type="'+ils+'"');
			Prefs.remoteILS[ils].url = rs2.fieldByName('value');
			rs.next();
		}
	}
	catch(ex) {
		alert(ex.message);
	}
}


function getTargetAuthStrings() {
  // z39.50 search servers authorization strings 
  var rs;
  var authstrings = '';
  try {
    rs = db.execute('select hostname, port, dbname, userid, password from Targets where enabled = 1;');
    while( rs.isValidRow() ) {
      var hostname = rs.fieldByName('hostname');
      var port = rs.fieldByName('port');
      var dbname = rs.fieldByName('dbname');
      var userid = rs.fieldByName('userid');
      var password = rs.fieldByName('password');
      var authstring = hostname + ":" + port + "/" + dbname + "-login-" + userid + "-pass-" + password + "-";
      authstrings += authstring + " ";
      rs.next();
    }
  }
  catch(ex) {
    Ext.MessageBox.alert('db error', ex.message);
  }
  return authstrings;
}

function getTargetNameByAuthString(teststring) {
  try {
    rs = db.execute('select hostname, name, port, dbname, userid, password from Targets;');
    while( rs.isValidRow() ) {
      var hostname = rs.fieldByName('hostname');
      var name = rs.fieldByName('name');
      var port = rs.fieldByName('port');
      var dbname = rs.fieldByName('dbname');
      var userid = rs.fieldByName('userid');
      var password = rs.fieldByName('password');
      var authstring = hostname + ":" + port + "/" + dbname;
      if( teststring == authstring ) {
        return name;
      }
      rs.next();
    }
  }
  catch(ex) {
    Ext.MessageBox.alert('db error', ex.message);
  }
}

function getTargets() {
  var targets = new Array();
  try {
    rs = db.execute('select * from Targets;');
    while( rs.isValidRow() ) {
      var data = {};
      data.id = rs.fieldByName('id');
      data.hostname = rs.fieldByName('hostname');
      data.port = rs.fieldByName('port');
      data.dbname = rs.fieldByName('dbname');
      data.userid = rs.fieldByName('userid');
      data.password = rs.fieldByName('password');
      data.name = rs.fieldByName('name');
      data.enabled = rs.fieldByName('enabled');
      data.rank = rs.fieldByName('rank');
      data.description = rs.fieldByName('description');
      data.syntax = rs.fieldByName('syntax');
      data.icon = rs.fieldByName('icon');
      data.position = rs.fieldByName('position');
      data.type = rs.fieldByName('type');
      targets.push(data);
      rs.next();
    }
  }
  catch(ex) {
    Ext.MessageBox.alert('db error', ex.message);
  }
  return targets;
}

function setEnableTargets() {
  // loop through search targets.  If checked, set enable in Targets table to true. Otherwise set to false.
  var targetnodes = searchRoot.childNodes;
  for( var i = 0; i < targetnodes.length; i++) {
    var id = targetnodes[i].attributes.id;
    var enabled = 0; // assume not checked
    if( targetnodes[i].attributes.checked == true ) {
        enabled = 1;
    }
    var rs;
    try {
       if(debug) { console.info('setting enabled to ' + enabled + ' for target ' + id); }
       rs = db.execute('update Targets set enabled = ? where id = ?', [enabled, id]); 
       rs.close();
    }
    catch(ex) {
      Ext.MessageBox.alert('db error', ex.message);
    }
  }
}
