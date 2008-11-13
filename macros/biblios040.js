
if( record.hasField('040') ) {
       record.field('040').addSubfield( new Subfield('d', 'BIBLIOS') );
}
else {
        record.addField( new Field('040', '', '', [ new Subfield('a', 'BIBLIOS') ]) )
}
