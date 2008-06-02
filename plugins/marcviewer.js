MarcViewer = function(editorelem, editorid) {
    var editorid = editorid;
    var editorelem = editorelem;

}
MarcViewer.prototype.loadXml = function( marcXmlDoc ) {
    return xslTransform.serialize( marcXmlDoc );
}

MarcViewer.prototype.postProcess = function( ) {
    return true;
}

