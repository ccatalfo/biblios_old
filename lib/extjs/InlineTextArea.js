Ext.form.InlineTextArea = function(config) {
	Ext.form.InlineTextArea.superclass.constructor.call(this, config);
 
	this.on('specialkey', function(f, e) {
		if (e.getKey() == e.ESC) {
			f.setValue(this.startValue);
			f.blur();
		}
	}, this);
};
 
Ext.extend(Ext.form.InlineTextArea, Ext.form.TextArea, {
	inlineClass: 'x-form-inline-field',
	disabledClass: 'x-form-inline-field-disabled',
	saveOnlyOnChange: true,
	confirmSave: false,
	confirmText: 'The data has been successfully saved.',
 
	doSave : function() {
		var cfg = this.autoSave;
 
		this.params = (this.name || this.id) + '=' + this.getValue();
 
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
	},
 
	reset : function() {
		Ext.form.TextField.superclass.reset.call(this);
 
		if (this.value) {
			this.setRawValue(this.value);
		}
		else if (this.emptyText && this.getRawValue().length < 1) {
			this.setRawValue(this.emptyText);
			this.el.addClass(this.emptyClass);
		}
	}
});
 
Ext.override(Ext.form.InlineTextArea, {
	onRender : Ext.form.TextArea.prototype.onRender.createSequence(function() {
		this.el.addClass(this.inlineClass);
 
		if (this.editable === false) {
			this.disabled = true;
		}
	}),
 
	onFocus : Ext.form.TextArea.prototype.onFocus.createSequence(function() {
		if (this.editable !== false) {
			this.el.removeClass(this.inlineClass);
		}
	}),
 
	onBlur : Ext.form.TextArea.prototype.onBlur.createSequence(function() {
		if (this.isValid() && !this.el.hasClass(this.inlineClass)) {
			this.el.addClass(this.inlineClass);
 
			if (this.autoSave && (this.saveOnlyOnChange === false || this.getValue() != this.startValue)) {
				this.doSave();
			}
		}
	})
});
