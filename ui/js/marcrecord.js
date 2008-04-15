function MarcRecord(fieldlist) {
	var fields = new Array();
	if(fieldlist) {
		fields = fieldlist;
	}
	var numfields = fields.length;	

	this.fields = function() {
		return fields;
	};

	this._field = function(fieldno) {
		for(var i=0; i<fields.length; i++){
			if( fields[i].tagnumber() == fieldno ) {
				return fields[i];
			}
		}
		return false;
	};

	this._addField = function(field) {
		fields.push(field);
		return true;
	};

	this._removeField = function(fieldno) {
		for(var i=0; i<fields.length; i++){
			if( fields[i].tagnumber() == fieldno ) {
				fields.splice(i, 1);
				return true;
			}
		}
		return false;
	};

	this._hasField = function(fieldno) {
		for(var i=0; i<fields.length; i++){
			if( fields[i].tagnumber() == fieldno ) {
				return true;
			}
		}
		return false;
	}

	this._XML = function() {
		// fixme this isn't working correctly: it's failing on trying to add xml fragment 
		// returned from fields[i].XML()
		//var xml = Sarissa.getDomDocument("", "record");
		//for(var i=0; i<fields.length; i++){
		//	xml.appendChild( fields[i].XML() );
		//}
		//return xml;
		return xslTransform.loadString( this._XMLString() );
	};

	this._XMLString = function() {
		var xml = '<record xmlns="http://www.loc.gov/MARC21/slim">';
		for(var i=0; i<fields.length; i++){
			xml += fields[i].XMLString();
		}
		xml += '</record>';
		return xml;
	};
	this._loadMarcXml = function(xmldoc) {
		fields.length = 0;
		var leader = $('leader', xmldoc).text();
		fields.push( new Field('000', '', '', [{code: '', value: leader}]) );
		$('controlfield', xmldoc).each( function(i) {
			val = $(this).text();
			tagnum = $(this).attr('tag');
			fields.push( new Field(tagnum, '', '', [{code: '', value: val}]) );
		});
		$('datafield', xmldoc).each(function(i) {
			var value = $(this).text();
			var tagnum = $(this).attr('tag');
			var ind1 = $(this).attr('ind1') || ' ';
			var ind2 = $(this).attr('ind2') || ' ';
			var subfields = new Array();
			$('subfield', this).each(function(j) {
				var sfval = $(this).text();
				var sfcode = $(this).attr('code');
				subfields.push( new Subfield(sfcode, sfval) );
			});
			fields.push( new Field(tagnum, ind1, ind2, subfields) );
		});
	}
}

MarcRecord.prototype.field = function(fieldno) {
	return this._field(fieldno);
};
 
MarcRecord.prototype.fields = function() {
	return this.fields();
};

MarcRecord.prototype.addField = function(field) {
	return this._addField(field);
};

MarcRecord.prototype.removeField = function(fieldno) {
	return this._removeField(fieldno);
};

MarcRecord.prototype.hasField = function(fieldno) {
	return this._hasField(fieldno);
}

MarcRecord.prototype.XML = function() {
	return this._XML();
};

MarcRecord.prototype.XMLString = function() {
	return this._XMLString();
};

MarcRecord.prototype.loadMarcXml = function(xmldoc) {
	return this._loadMarcXml(xmldoc);
}
function Field(tagnumber, indicator1, indicator2, subfields) {
	var that = this;
	var tagnumber = tagnumber;
	var indicators = new Array(indicator1, indicator2);
	var subfields = subfields;

	this._tagnumber = function() {
		return tagnumber;
	};

	this._indicator = function(num, val) {
		if( !Ext.isEmpty(val) ) {
			indicators[num] = val;
		}
		return indicators[num];
	};

	this._indicators = function() {
		return indicators;
	};

	this._hasSubfield = function(code) {
		for(var i = 0; i<subfields.length; i++) {
			if( subfields[i].code == code ) {	
				return true;
			}
		}
		return false;
	};

	this._removeSubfield = function(code) {
		for(var i = 0; i<subfields.length; i++) {
			if( subfields[i].code == code ) {	
				subfields.splice(i,1);
				return true;
			}
		}
		return false;
	}
		
	this._subfields = function() {
		return subfields;
	};

	this._addSubfield = function(sf) {
		subfields.push(sf);
		return true;
	}

	this._subfield = function(code, val) {
		var sf = '';
		for(var i = 0; i<subfields.length; i++) {
			if( subfields[i].code == code ) {
				sf = subfields[i];
                if( !Ext.isEmpty(val) ) {
                    sf.value = val;
                }
                return sf;
			}
		}
        return false;
	};

	this._XML = function() {
		var marcxml = Sarissa.getDomDocument('', '');
		// decide if it's controlfield of datafield	
		if( tagnumber == '000') {
			var leader = marcxml.createElement('leader');
			var lv = marcxml.createTextNode( subfields[0].value );
			leader.appendChild(lv);
			marcxml.appendChild(leader);
			return leader;
		}
		else if( tagnumber < '010' ) {
			var cf = marcxml.createElement('controlfield'); 
			cf.setAttribute('tag', tagnumber);
			var text = marcxml.createTextNode( subfields[0].value );
			cf.appendChild(text);
			return cf;
		}
		// datafield
		else {
			var df = marcxml.createElement('datafield');
			var tagAttr = marcxml.createAttribute('tag');		
			tagAttr.nodeValue = tagnumber;
			df.setAttributeNode(tagAttr);
			df.setAttribute('ind1', indicators[0]);
			df.setAttribute('ind2', indicators[1]);
			for( var i = 0; i< subfields.length; i++) {
				var sf = marcxml.createElement('subfield');
				sf.setAttribute('code', subfields[i].code);
				var text = marcxml.createTextNode( subfields[i].value );
				sf.appendChild(text);
				df.appendChild(sf);	
			}
			return df;
		}
	};

	this._XMLString = function() {
		return xslTransform.serialize( this.XML() );
	};
}

Field.prototype.XML = function() {
	return this._XML();
};

Field.prototype.XMLString = function() {
	return this._XMLString();
};

Field.prototype.subfields = function() {
	return this._subfields();	
};

Field.prototype.subfield = function(code, val) {
	return this._subfield(code, val);
};

Field.prototype.hasSubfield = function(code) {
	return this._hasSubfield(code);
};

Field.prototype.removeSubfield = function(code) {
	return this._removeSubfield(code);
}

Field.prototype.addSubfield = function(sf) {
	return this._addSubfield(sf);
}

Field.prototype.tagnumber = function() {
	return this._tagnumber();
};

Field.prototype.indicator = function(num, val) {
	return this._indicator(num, val);
};

Field.prototype.indicators = function() {
	return this._indicators();
};


function Subfield(code, value) {
	var that = this;
	that.code = code;
	that.value = value;
}

Subfield.prototype.setCode = function(code) {
	this.code = code;
};

Subfield.prototype.getCode = function(code) {
	return this.code;
};

Subfield.prototype.setValue = function(value) {
	this.value = value;
};

Subfield.prototype.getValue = function(value) {
	return this.value;
};


