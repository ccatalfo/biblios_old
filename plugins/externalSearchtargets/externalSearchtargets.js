var searchtargetsdburl = $('searchtargetsdburl', configDoc).text();
var searchtargetsproxyscripturl = cgiDir + 'externalSearchtargetsproxy.pl';
var searchtargettesturl = cgiDir + 'searchtargetTest.pl';
var ds = new Ext.data.Store({
    baseParams: {
	dburl: searchtargetsdburl+'search/'
    },
    proxy: new Ext.data.HttpProxy({
        url: searchtargetsproxyscripturl
    }),
    reader : new Ext.data.JsonReader({
	    root: 'targets'
	    ,totalProperty:'total'
    }, [
      'name','hostname','dbname','port','description','remoteID','pazpar2settings','librarytype','country','reliability'])
      ,listeners: {
    load: function(store, records, options) {
      Ext.getCmp('externalSearchTargetscombo').onTriggerClick();
    }

    ,beforeload: function(store, options) {
      var librarytype = Ext.getCmp('librarytypecombo').getValue();
      var country = Ext.getCmp('countriescombo').getValue();
      if( librarytype != '' ) {
        store.baseParams.librarytype = librarytype;
      }
      if( country != '') {
        store.baseParams.country = country;
      }
      if( store.baseParams.query == '' ) {
        store.baseParams.query = 'all';
      }
    }
      }
});
var searchSearchTargetsdb = new Ext.form.ComboBox({
    id: 'externalSearchTargetscombo',
    store: ds,
    displayField: 'name',
    valueFied: 'hostname',
    typeAhead: false,
    loadText: 'Searching...',
    width: 300,
    pageSize: 10,
    hideTrigger: true,
    triggerAction: 'all',
    onSelect: function(record) {
        if(bibliosdebug) {
            console.debug(record);
        }
        record.json.allowDelete = 1;
        record.json.allowModify = 1;
        record.json.user = '';
        record.json.password = '';
        record.json.enabled = 1;
        DB.SearchTargets.load( record.json, true);
        Ext.getCmp('searchtargetsgrid').store.reload();
	Ext.getCmp('searchtargetsgrid').getSelectionModel().clearSelections();
        Ext.getCmp('TargetsTreePanel').root.reload();
        setPazPar2Targets();
    },
    listeners: {
    }
});
var librarytypesds = new Ext.data.Store({
    baseParams: {
	dburl: searchtargetsdburl+'librarytypes/'
    },
    proxy: new Ext.data.HttpProxy({
        url: searchtargetsproxyscripturl
    }),
    reader : new Ext.data.JsonReader({
	    root: 'librarytypes'
	    ,totalProperty:'total'
    }, [
      'display', 'value'
    ])
});

var librarytypecombo = new Ext.form.ComboBox({
					       id:'librarytypecombo'
					       ,store: librarytypesds
					       ,displayField:'display'
					       ,valueField:'value'
					       ,typeAhead:true
					       ,triggerAction:'all'
					       ,mode:'remote'
					       ,forceSelection:false
					       ,emptyText:'Select a library type'
					     });
var countriesds = new Ext.data.Store({
    baseParams: {
	dburl: searchtargetsdburl+'countries/'
    },
    proxy: new Ext.data.HttpProxy({
        url: searchtargetsproxyscripturl
    }),
    reader : new Ext.data.JsonReader({
	    root: 'countries'
	    ,totalProperty:'total'
    }, [
      'display', 'value'
    ])
});
  var countriescombo = new Ext.form.ComboBox({
					       id:'countriescombo'
					       ,store: countriesds
					       ,displayField:'display'
					       ,valueField:'value'
					       ,typeAhead:true
					       ,triggerAction:'all'
					       ,mode:'remote'
					       ,forceSelection:false
					       ,emptyText:'Select a country'
					     });
// in search targets grid, make country and library type columns editable with combobox
// library type is col 12
var libtypeditor = new Ext.grid.GridEditor(
							     new Ext.form.ComboBox({
							       store: librarytypesds

							       ,displayField:'display'
							       ,valueField:'value'
							       ,typeAhead:true
							       ,triggerAction:'all'
							       ,forceSelection:false
							       ,emptyText:'Select Library Type'

							     }), {
							       listeners: {
								 beforeedit: function(editor) {
								   if(bibliosdebug) {
								     console.info(editor);
								   }
								   editor.field.row = editor.row;
								   editor.field.col = editor.col;
								   editor.field.record = editor.record;
								   return true;
								 } // afteredit list
								 ,afteredit: function(editor) {
								   console.info(editor);
								   return true;
								 }
							       } // listeners
							     });
Ext.getCmp('searchtargetsgrid').getColumnModel().setEditor(12, libtypeditor );

// country is col 13
Ext.getCmp('searchtargetsgrid').getColumnModel().setEditor(13,
							   new Ext.grid.GridEditor(
							     new Ext.form.ComboBox({
							       store: countriesds
							       ,displayField:'display'
							       ,valueField:'value'
							       ,typeAhead:true
							       ,triggerAction:'all'
							       ,forceSelection:false
							       ,emptyText:'Select a country'
							     })
							   )
							  );

var searchTargetsSearchButton = new Ext.Button({
						 id:'searchtargetsSearchButton'
						 ,text: 'Search'
						 ,handler: function(btn) {
						   var query = Ext.getCmp('externalSearchTargetscombo').getValue();
						   if( query == '' ) {
						     query = 'all';
						   }
						   Ext.getCmp('externalSearchTargetscombo').store.load({
													 params: {
													   start:0
													   ,limit:10
													   ,query:query
													   }
												       });
						 }
				  });
// add new tbar to searchtargetsgrid
Ext.getCmp('searchtargetsgrid').add(
    new Ext.Toolbar({
        renderTo:this.tbar,
        items:[
	       {
		   text: 'Find a search target'
	       },
          searchSearchTargetsdb,
	  {
	    text: 'Library Type:'
	  },
	  librarytypecombo,
	  {
	    text: 'Country'
	  },
	  countriescombo,
	  searchTargetsSearchButton
        ]}));

Ext.getCmp('searchtargetsgridtbar').on('render', function(tbar) {
                                         tbar.addButton({
                text: 'Share Target'
		,handler: function(btn) {
		    var target = Ext.getCmp('searchtargetsgrid').getSelectionModel().getSelections()[0].data;
		      // encode json
		      var targetjson = Ext.util.JSON.encode(target);
		    // test this target to make sure we can at least connect
			$.ajax({
			   url: searchtargettesturl,
			   method: 'POST',
			   data: {target:targetjson},
			   dataType: 'json',
			   error: function(req, textStatus, errorThrown) {
			     Ext.Msg.alert('Share Target Error', 'An error ocurred contacting the search targets registry.  Please contact the system administrator.  Error: ' + errorThrown + textStatus);
			   },
			   success: function(response, textStatus) {

			    if(bibliosdebug) {
			      console.debug('testing target before sharing');
			      console.info(response);
			    }

			    if( response.success == 'true' ) {
			      if(bibliosdebug) {
				console.debug('externalsearchtargetsplugin test successful.  prepating to send');
			      }
			      if(bibliosdebug) {
				console.info(this);
			      }
			      var target = response.target;
			      if(bibliosdebug) {
				console.info(target);
			      }
			      // remove from db as we will recreate with remoteID
			      DB.SearchTargets.remove('Searchtargets.rowid=?',[target.rowid]);
			      // remote rowid field
			      delete target['rowid'];
			      target['allowDelete'] = 1;
			      target['allowModify'] = 1;
			      try {
				var targetjson = Ext.util.JSON.encode([target]);
			      }
			      catch(ex){
				if(bibliosdebug){
				  console.info(ex);
				}
			      }

			      if(bibliosdebug) {
				console.info(targetjson);
			      }

			      // update
			      if( target.source == 'externalDB' ) {
				if(bibliosdebug) {
				  console.debug('updating external db');
				}
				$.ajax({
					 url: searchtargetsproxyscripturl,
					 data: {action: 'update', target: targetjson, dburl: searchtargetsdburl},
					 success: function(data, textStatus) {
					   var targetjson = Ext.util.JSON.decode(data);
					   DB.SearchTargets.load(targetjson.targets,true);
					   Ext.getCmp('searchtargetsgrid').store.reload;
					   Ext.Msg.alert('Search Targets Database', 'Your target has been shared.');
					 } // update registry success
					 ,error: function(req, textStatus, errorThrown) {
					   Ext.Msg.alert('Share Target Error', 'An error occurred in trying to share this target.  Please alert the system administrator.  Error: ' + textStatus, errorThrown);
					 }
				       }); // post to update
			      } // add to external db
			      // adding new target to external db
			      else {
				if(bibliosdebug) {
				  console.debug('adding to external db');
				}
				// remove any existing remoteID so external db doesn't get confused
				delete target['remoteID'];
				$.ajax({
					 url: searchtargetsproxyscripturl,
					 data: {action: 'create', target: targetjson, dburl: searchtargetsdburl},
					 success: function(data, textStatus) {
					  var targetjson = Ext.util.JSON.decode(data);
					  DB.SearchTargets.load(targetjson.targets,true);

					  Ext.getCmp('searchtargetsgrid').store.reload();
					  Ext.Msg.alert('Search Targets Database', 'Your target has been shared.');
					} // add to registry success handler
					 ,error: function(req, textStatus, errorThrown) {
					   Ext.Msg.alert('Share target error', 'An error occurred trying to share this target.  Please alert the system administrator.  Error: ' + textStatus + errorThrown);
					 } // add to registry error handler
					});
			      } // add
			    } // if successful test
			    else {
			      Ext.Msg.alert('Share Target Error', 'Error: ' + response.message);
			    }
			   } // $.ajax success handler
			 }); // $.ajax call to share target
		} // share handler
	      }); //add share button
	    tbar.add({
		       text:'Test Target'
		       ,handler: function(btn) {
			 var target = Ext.getCmp('searchtargetsgrid').getSelectionModel().getSelections()[0].data;
			 var targetjson = Ext.util.JSON.encode( target );
			 $.ajax({
				  url: searchtargettesturl,
				  data: {target: targetjson},
				  dataType:'json',
				  error: function(req, textStatus, errorThrown) {
				    Ext.Msg.alert('Test Target Error', 'An error occurred in testing this target.  Error: ' + errorThrown);
				  },
				  success: function(response, textStatus) {
				   if( response.success == 'true' ) {
				     Ext.Msg.alert('Test Target','Target test successful');
				   }
				   else {
				     Ext.Msg.alert('Test Target', 'Target test failed ' + response.message);
				   }
				 } // $.ajax success
				}); // $.ajax to test target
			 } // test handler
		     });
	    }); // tb.on('render')
biblios.app.viewport.doLayout();
