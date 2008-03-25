Ext.namespace('Ext.ux');

Ext.ux.PagingToolbarInfoRow = function(msg) {
	this.msg = msg;


};

Ext.extend( Ext.ux.PagingToolbarInfoRow, Ext.Toolbar, {
	init: function(tbar, pageSize, id) {
		tbar.autoCreate.html = '<table cellspacing="0"><tr></tr><tr id="searchtbarinfo">';
		if( this.msg) {
			tbar.autoCreate.html += '<td>' + this.msg + '</td>';
		}
		tbar.autoCreate.html += '</tr></table>';
	}
});
