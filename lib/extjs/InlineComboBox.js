Ext.form.InlineComboBox = function(config) {
	Ext.form.InlineComboBox.superclass.constructor.call(this, config);
};
 
Ext.extend(Ext.form.InlineComboBox, Ext.form.ComboBox, {
	inlineClass: 'x-form-inline-field',
	disabledClass: 'x-form-inline-field-disabled',
	saveOnlyOnChange: true,
	confirmSave: false,
	confirmText: 'The data has been successfully saved.',
 
	doSave : function() {
		var cfg = this.autoSave;
 
		this.params = (this.name || this.id) + '=' + this.getRawValue();
 
		if (this.hiddenName) {
			this.params += '&' + this.hiddenName + '=' + this.hiddenField.value;
		}
 
		if (typeof cfg == 'object') {
			this.method = cfg.method || 'POST';
			this.callback = (!cfg.callback) ? {success: Ext.emptyFn, failure: Ext.emptyFn} :
				{success: cfg.callback.success || cfg.callback, failure: cfg.callback.failure || Ext.emptyFn};
			this.scope = cfg.scope || this.callback;
 
			if (this.confirmSave === true) {
				var success = function() {
					Ext.MessageBox.alert('Success', this.confirmText);
				}.createDelegate(this);
 
				this.callback.success = success.createSequence(this.callback.success);
			}
 
			var p = (cfg.params) ? cfg.params : '';
 
			if (p) {
				if (typeof p == 'object') {
					this.params += '&' + Ext.urlEncode(p);
				}
				else if (typeof p == 'string' && p.length) {
					this.params += '&' + p;
				}
			}
 
			this.url = (this.method == 'POST') ? cfg.url : cfg.url + '?' + this.params;
		}
		else if (typeof cfg == 'string') {
			this.method = 'POST';
			this.url = (this.method == 'POST') ? cfg : cfg + '?' + this.params;
		}
 
		Ext.Ajax.request({
			url: this.url,
			method: this.method,
			success: this.callback.success,
			failure: this.callback.failure,
			params: this.params,
			scope: this.scope
		});
	}
});
 
Ext.override(Ext.form.InlineComboBox, {
	onRender : Ext.form.ComboBox.prototype.onRender.createSequence(function() {
		this.lastValue = '';
		this.lastRawValue = '';
		this.el.addClass(this.inlineClass);
		this.trigger.setDisplayed(false);
	}),
 
	onFocus : Ext.form.ComboBox.prototype.onFocus.createSequence(function() {
		this.el.removeClass(this.inlineClass);
		this.trigger.setDisplayed(true);
	}),
 
	triggerBlur : Ext.form.ComboBox.prototype.triggerBlur.createSequence(function() {
		if (this.isValid() && !this.el.hasClass(this.inlineClass)) {
			this.el.addClass(this.inlineClass);
			this.trigger.setDisplayed(false);
 
			if (!this.store.getAt(this.view.getSelectedIndexes()[0]) || !this.getRawValue()) {
				this.selectedIndex = -1;
				if (this.hiddenField) {
					this.hiddenField.value = '';
				}
				this.value = '';
			}
 
			if (this.autoSave && (this.saveOnlyOnChange === false || this.getValue() != this.lastValue || this.getRawValue() != this.lastRawValue)) {
				this.doSave();
			}
 
			this.lastValue = this.getValue();
			this.lastRawValue = this.getRawValue();
		}
	})
});
