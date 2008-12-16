/*
   Function: openRecord

   Display the record whose id is passed in in the marc editor for editing.

   Parameters:

   id: id of the record to edit.

   Returns:

   None.

*/
function openRecord(xml, recid, syntax, savefileid, searchtarget) {
    if(bibliosdebug) {
	console.debug('openRecord: xml: ' + xml);
	console.debug('recid: ' + recid);
	console.debug('savefileid: ' + savefileid);
	console.debug('searchtarget: ' + searchtarget);
    }
	// we need to display record view first since editors are lazily rendered
	UI.lastWindowOpen = openState;
	openState = 'editorPanel';
    if( Ext.getCmp('editorTabPanel').getActiveTab() ) {
        var sending = Ext.getCmp('editorTabPanel').getActiveTab().sending;
    }
    if( sending ) {
	if(bibliosdebug) {
	    console.debug('openRecord sending: ' + sending);
	}
        var editorid = Ext.getCmp('editorTabPanel').getActiveTab().editorid;
        Ext.getCmp('editorTabPanel').getActiveTab().sending = false;
    }
    else {
        var editorid = Ext.id();
        var tabid = Ext.id();
        UI.editor[editorid] = {
            id: recid,
            tabid: tabid,
            ffed: '',
            vared : '',
            savedRemote : {},
            savefileid: savefileid,
            record : '',
            comboboxes : new Array(),
            loc:searchtarget || ''
        };
        Ext.getCmp('editorTabPanel').add({ 
            title: '', 
            id: tabid,
            editorid: editorid,
            closable:true, 
            html:{ tag: 'div', id: editorid, cls: 'marceditor' },
            listeners: {
                activate: function(tab) {
                    biblios.app.currentEditor = UI.editor[tab.editorid].record;
                    biblios.app.currentTabId = tab.id;
                }
            },
            tbar: MarcEditor.getToolbar(editorid)
        }).show();

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
    try {
	if( Ext.isIE ) {
	    xmldoc = new ActiveXObject("Microsoft.XMLDOM"); 
	    xmldoc.async = false; 
	    xmldoc.loadXML(xml);
	}
	else {
	    xmldoc = xslTransform.loadString(xml);
	}
    }
    catch(ex) {
	UI.editor.progress.hide();
	Ext.Msg.alert('Error', 'Error loading editor: ' + ex);
    }
    UI.editor[editorid].record.loadXml( xmldoc, handle_html );
}

function handle_html(html, editorid) {
    if(bibliosdebug) {
	console.debug('handle_html: ' + html.substr(40));
    }
    Ext.get(editorid).update(html);
    var tabTitle = UI.editor[editorid].record.getTitle();
    if(tabTitle == '' || tabTitle == undefined) {
        tabTitle = '    ';
    }
    Ext.getCmp('editorTabPanel').getItem(UI.editor[editorid].tabid).setTitle( tabTitle );
    UI.editor[editorid].record.postProcess();
    var searchtargetid = DB.SearchTargets.select('SearchTargets.name=?',[UI.editor[editorid].loc]).getOne().rowid;
    var sendtarget = DB.SendTargets.select('searchtarget=?',[searchtargetid]).getOne();

    if(bibliosdebug) {
	console.debug('handle_html searchtarget setting' + searchtargetid + ' send target matches ' + sendtarget );
    }
	// setup remote ils-controlled fields
    if( sendtarget ) {
	if(bibliosdebug) {
	    console.debug('setting up ils controlled fields');
	}
        UI.editor[editorid].record.processForLocation(sendtarget.name);
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
