/*
   Function: openRecord

   Display the record whose id is passed in in the marc editor for editing.

   Parameters:

   id: id of the record to edit.

   Returns:

   None.

*/
function openRecord(xml, editorid, syntax) {
	// we need to display record view first since editors are lazily rendered
	UI.lastWindowOpen = openState;
	openState = 'editorPanel';
	biblios.app.displayRecordView();
	if( editorid == 'editortwo') {
		Ext.getCmp('editortwo').expand();
	}
	var ffed =	$('#'+editorid).find(".ffeditor");
	$(ffed).empty();
	var vared = $('#'+editorid).find(".vareditor");
	$(vared).empty();
    var editorelem = $('#'+editorid);
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
	Ext.get('marc'+editorid).update(html);

	var ffed =	$('#'+editorid).find(".ffeditor");
	var vared = $('#'+editorid).find(".vareditor");
	UI.editor[editorid].ffed = ffed;
	UI.editor[editorid].vared = vared;

    UI.editor[editorid].record.postProcess();

	// setup remote ils-controlled fields
	if( Prefs.remoteILS[ UI.editor[editorid].location ] ) {
        UI.editor[editorid].record.processForLocation(UI.editor[editorid].location);
	}
	clearStatusMsg();
}
