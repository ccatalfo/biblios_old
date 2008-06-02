MarcViewer = function(editorelem, editorid) {
    var editorid = editorid;
    var editorelem = editorelem;

}
MarcViewer.prototype.loadXml = function( marcXmlDoc ) {
    var processor = new XSLTProcessor();
    processor.importStylesheet( marcxsl );
    var editorDoc = processor.transformToDocument( marcXmlDoc );
    return (new XMLSerializer().serializeToString( editorDoc ));
}

MarcViewer.prototype.postProcess = function( ) {
    return true;
}

