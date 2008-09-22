/*
   Function: openRecord

   Display the record whose id is passed in in the marc editor for editing.

   Parameters:

   id: id of the record to edit.

   Returns:

   None.

*/
function openRecord(xml, recid, syntax) {
	// we need to display record view first since editors are lazily rendered
	UI.lastWindowOpen = openState;
	openState = 'editorPanel';
	biblios.app.displayRecordView();
    var editorid = Ext.id();
    Ext.getCmp('editorTabPanel').add({ 
        title: '', 
        closable:true, 
        html:{ tag: 'div', id: editorid, class: 'marceditor' },
    }).show()
    UI.editor[editorid] = {
        id: recid,
        ffed: '',
        vared : '',
        savedRemote : {},
        savefileid: '',
        record : '',
        comboboxes : new Array(),
        location: ''
    };

    var editor = DB.Editors.select('syntax=?', [syntax]).getOne();
    var editor_plugin = DB.Plugins.select('name=?', [editor.name]).getOne();
    var editor_init = editor_plugin.initcall;
    try {
        UI.editor[editorid].record = eval( editor_init );
    }
    catch(ex) {
        Ext.MessageBox.alert('Editor error', 'Unable to create editor. Please check your configuration');
    }
	var xmldoc;
	if( Ext.isIE ) {
		xmldoc = new ActiveXObject("Microsoft.XMLDOM"); 
		xmldoc.async = false; 
		xmldoc.loadXML(xml);
	}
	else {
		xmldoc = (new DOMParser()).parseFromString(xml, "text/xml");  
	}
	html = UI.editor[editorid].record.loadXml( xmldoc );
    Ext.get(editorid).update(html);
    var tabTitle = UI.editor[editorid].record.getTitle();
    if(tabTitle == '' || tabTitle == undefined) {
        tabTitle = '    ';
    }
    Ext.getCmp('editorTabPanel').getActiveTab().setTitle( tabTitle );
    UI.editor[editorid].record.postProcess();

	// setup remote ils-controlled fields
	if( Prefs.remoteILS[ UI.editor[editorid].location ] ) {
        UI.editor[editorid].record.processForLocation(UI.editor[editorid].location);
	}
    // disable Revert, Duplicate buttons if record is coming from search results 
    /*
    if( UI.editor[editorid].id == '') {
        Ext.getCmp(editorid + 'DuplicateBtn').disable();
        Ext.getCmp(editorid + 'RevertBtn').disable();
    }*/
	clearStatusMsg();
}
