Ext.grid.GridView.override({
    
    syncFocus : false,
    
    removeRow : function(row){
        Ext.removeNode(this.getRow(row));
        this.syncFocusEl(row);
    },
    removeRows : function(firstRow, lastRow){
        var bd = this.mainBody.dom;
        for(var rowIndex = firstRow; rowIndex <= lastRow; rowIndex++){
            Ext.removeNode(bd.childNodes[firstRow]);
        }
        this.syncFocusEl(firstRow);
    },
    insertRows : function(dm, firstRow, lastRow, isUpdate){
        if(!isUpdate && firstRow === 0 && lastRow == dm.getCount()-1){
            this.refresh();
        }else{
            if(!isUpdate){
                this.fireEvent("beforerowsinserted", this, firstRow, lastRow);
            }
            var html = this.renderRows(firstRow, lastRow);
            var before = this.getRow(firstRow);
            if(before){
                Ext.DomHelper.insertHtml('beforeBegin', before, html);
            }else{
                Ext.DomHelper.insertHtml('beforeEnd', this.mainBody.dom, html);
            }
            if(!isUpdate){
                this.fireEvent("rowsinserted", this, firstRow, lastRow);
                this.processRows(firstRow);
            }
        }
        this.syncFocusEl(firstRow);
    },
    onDataChange : function(){
        this.refresh();
        this.updateHeaderSortState();
        this.syncFocusEl(0);
    },
    onClear : function(){
        this.refresh();
        this.syncFocusEl(0);
    },
    focusCell : function(row, col, hscroll){
        this.syncFocusEl(row, col, hscroll, true)
        if(Ext.isGecko){
            this.focusEl.focus();
        }else{
            this.focusEl.focus.defer(1, this.focusEl);
        }
    },
    syncFocusEl : function(row, col, hscroll, /*private*/ force){
        if(force || this.syncFocus){
            row = Math.min(row, Math.max(0, this.getRows().length-1));
            var xy = this.ensureVisible(row, col, hscroll);
            this.focusEl.setXY(xy||this.scroller.getXY());
        }
    }
});
