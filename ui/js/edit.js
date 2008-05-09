/*
   Function: openRecord

   Display the record whose id is passed in in the marc editor for editing.

   Parameters:

   id: id of the record to edit.

   Returns:

   None.

*/
function openRecord(xml, editorelem) {
	UI.editor.progress = Ext.MessageBox.progress('Loading record', '');
	// we need to display record view first since editors are lazily rendered
	UI.lastWindowOpen = openState;
	openState = 'editorPanel';
	biblios.app.displayRecordView();
	if( editorelem == 'editortwo') {
		Ext.getCmp('editortwo').expand();
	}
	var ffed =	$('#'+editorelem).find(".ffeditor");
	$(ffed).empty();
	var vared = $('#'+editorelem).find(".vareditor");
	$(vared).empty();

	UI.editor[editorelem].record = new MarcEditor(ffed, vared, editorelem);
	var xmldoc;
	if( Ext.isIE ) {
		xmldoc = new ActiveXObject("Microsoft.XMLDOM"); 
		xmldoc.async = false; 
		xmldoc.loadXML(xml);
	}
	else {
		xmldoc = (new DOMParser()).parseFromString(xml, "text/xml");  
	}
	html = UI.editor[editorelem].record.loadXml( xmldoc );
	Ext.get('marc'+editorelem).update(html);
	var ffed =	$('#'+editorelem).find(".ffeditor");
	var vared = $('#'+editorelem).find(".vareditor");

	UI.editor[editorelem].ffed = ffed;
	UI.editor[editorelem].vared = vared;

	UI.editor.progress.updateProgress(.9, 'Setting up editor hot keys');
    setupEditorHotkeys(editorelem);
	UI.editor.progress.updateProgress(.9, 'Setting up authority control');
	setupMarc21AuthorityLiveSearches(editorelem);

	// setup comboboxes for ctry and lang fixed fields
	//setupFFEditorLangCombo(editorelem);
	//setupFFEditorCtryCombo(editorelem);

	// setup remote ils-controlled fields
	if( Prefs.remoteILS[ UI.editor[editorelem].location ] ) {
		setupReservedTags( UI.editor[editorelem].location, editorelem);
		setupSpecialEntries( UI.editor[editorelem].location, editorelem);
	}
	// show fixed field editor, hide ldr and 008 divs
	$(ffed).show();
	// hide fixed field controlfields
	$('#'+editorelem).find("#000, #008, #006, #007").css('display', 'none');
	UI.editor.lastFocusedEl = $('#'+editorelem).find('#000').get(0);
	UI.editor[editorelem].lastFocusedEl = $('#'+editorelem).find('#000').get(0);
	UI.editor.progress.updateProgress(1, 'MarcEditor loaded');
	UI.editor.progress.hide();
	clearStatusMsg();
}
