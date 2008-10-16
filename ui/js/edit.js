/*
   Function: openRecord

   Display the record whose id is passed in in the marc editor for editing.

   Parameters:

   id: id of the record to edit.

   Returns:

   None.

*/
function openRecord(xml, recid, syntax, savefileid) {
	// we need to display record view first since editors are lazily rendered
	UI.lastWindowOpen = openState;
	openState = 'editorPanel';
    if( Ext.getCmp('editorTabPanel').getActiveTab() ) {
        var sending = Ext.getCmp('editorTabPanel').getActiveTab().sending;
    }
    if( sending ) {
        var editorid = Ext.getCmp('editorTabPanel').getActiveTab().editorid;
        Ext.getCmp('editorTabPanel').getActiveTab().sending = false;
    }
    else {
        var editorid = Ext.id();
        var tabid = Ext.id();
        Ext.getCmp('editorTabPanel').add({ 
            title: '', 
            id: tabid,
            closable:true, 
            html:{ tag: 'div', id: editorid, cls: 'marceditor' },
            listeners: {
            }
        }).show()
        UI.editor[editorid] = {
            id: recid,
            tabid: tabid,
            ffed: '',
            vared : '',
            savedRemote : {},
            savefileid: savefileid,
            record : '',
            comboboxes : new Array(),
            loc: ''
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
	UI.editor[editorid].record.loadXml( xmldoc, handle_html );
}

function handle_html(html, editorid) {
    Ext.get(editorid).update(html);
    var tabTitle = UI.editor[editorid].record.getTitle();
    if(tabTitle == '' || tabTitle == undefined) {
        tabTitle = '    ';
    }
    Ext.getCmp('editorTabPanel').getItem(UI.editor[editorid].tabid).setTitle( tabTitle );
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
    updateEditorLoad();
    biblios.app.viewport.doLayout();
	clearStatusMsg();
}

function updateEditorLoad() {
    UI.editor.loading.numLoaded++;
    var ratio = UI.editor.loading.numLoaded / UI.editor.loading.numToLoad;
    UI.editor.progress.updateProgress(ratio, Math.round(100*ratio)+'% completed');
    if( ratio == 1 ) {
        UI.editor.progress.updateProgress(1, 'Loading complete');
        UI.editor.progress.hide();
        UI.editor.loading.numToLoad = 0;
        UI.editor.loading.numLoaded = 0;
        biblios.app.displayRecordView();
    }
}
