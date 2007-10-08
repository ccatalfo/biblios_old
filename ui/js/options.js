function showOptions() {
    var dlg = new Ext.BasicDialog("options-dlg", {
        height: 400,
        width: 400,
        minHeight: 100,
        minWidth: 150,
        modal: true,
        proxyDrag: true,
        shadow: true
    });
    dlg.addKeyListener(27, dlg.hide, dlg); // ESC can also close the dialog
    dlg.addButton('Cancel', dlg.hide, dlg);
    dlg.addButton(
	'Save', 
	function() {
	    searchScript = Ext.ComponentMgr.get('searchScript').getValue();
	    saveScript = Ext.ComponentMgr.get('saveScript').getValue();
	    marcFlavor = Ext.ComponentMgr.get('marcFlavor').getValue();
	    encoding = Ext.ComponentMgr.get('encoding').getValue();
	    z3950serversSearch = Ext.ComponentMgr.get('z3950serversSearch').getValue();
	    z3950serversSave = Ext.ComponentMgr.get('z3950serversSave').getValue();
	    dlg.hide();
	},
	dlg);

    var form = new Ext.form.Form({
	labelAlign: 'left'
    });
    form.add(
	new Ext.form.TextField({
	    fieldLabel: 'Search script location',
	    name: 'searchScript',
	    id: 'searchScript',
	    value: searchScript
	}),
	new Ext.form.TextField({
	    fieldLabel: 'Marc flavor',
	    name: 'marcFlavor',
	    id: 'marcFlavor',
	    value: marcFlavor
	}),
	new Ext.form.TextField({
	    fieldLabel: 'Save script location',
	    name: 'saveScript',
	    id: 'saveScript',
	    value: saveScript
	}),
	new Ext.form.TextField({
	    fieldLabel: 'Encoding',
	    name: 'encoding',
	    id: 'encoding',
	    value: encoding
	}),
	new Ext.form.TextField({
	    fieldLabel: 'Z39.50 Host for Searching',
	    name: 'z3950serversSearch',
	    id: 'z3950serversSearch',
	    value: z3950serversSearch
	}),
	new Ext.form.TextField({
	    fieldLabel: 'Z39.50 Host for Saving',
	    name: 'z3950serversSave',
	    id: 'z3950serversSave',
	    value: z3950serversSave
	})
    );
    dlg.body.dom.innerHTML = "<div id='optionsId'></div>";
    form.render('optionsId');
    dlg.show();	

}
