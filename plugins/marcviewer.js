MarcViewer = function(editorelem, editorid) {
    var editorid = editorid;
    var editorelem = editorelem;
    var xmldoc = null;
    
    this._XMLString = function() {
        return (new XMLSerializer().serializeToString( xmldoc ));
    };

    this._loadXml = function(marcXmlDoc) {
        xmldoc = marcXmlDoc;
        var processor = new XSLTProcessor();
        processor.importStylesheet( marcxsl );
        var editorDoc = processor.transformToDocument( marcXmlDoc );
        return (new XMLSerializer().serializeToString( editorDoc ));
    };
}

MarcViewer.prototype.loadXml = function( marcXmlDoc ) {
    return this._loadXml(marcXmlDoc);
}


MarcViewer.prototype.postProcess = function( ) {
    return true;
}

MarcViewer.prototype.update = function() {
    return true;
}
MarcViewer.prototype.XMLString = function() {
    return this._XMLString(); 
}
MarcViewer.prototype.getToolsMenu = function() {
    return new Array();
}
