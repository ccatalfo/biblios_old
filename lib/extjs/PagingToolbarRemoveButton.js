Ext.PagingToolbar.prototype.removeButton = function(text) {
  if( $(this.tr).children().contains(text).length > 0 ) {
    var button = $(this.tr).children().contains(text).get(0);
    this.tr.removeChild( button );
  }
};
