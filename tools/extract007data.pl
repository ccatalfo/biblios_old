#!/usr/bin/perl
use strict;
use warnings;
use IO::File;
use XML::Writer;

my $output = new IO::File('>007defs.xml');
my $writer = new XML::Writer(OUTPUT => $output, DATA_MODE => 1, DATA_INDENT => 3);
my $mattype = '';

$writer->startTag('fields', 'tag' => '007');
while(<>) {
	if(/<h2>.*007--((\w+\b)*)/) {
			if( $writer->in_element('value') ) {
				$writer->endTag('value');
			}
			if( $writer->in_element('field') ) {
				$writer->endTag('field');
			}
			$writer->startTag('field', 'mattype' => $1);
	}
	if( /<li>.*(\d{2}) - (\w+)\s(.*)/ ) {
		if( $writer->in_element('value') ) {
			$writer->endTag('value');
		}
		$writer->startTag('value', 'name' => $2, position => $1);
	}
	if ( /(\w)+\s-\s(\w+)\s(.*)/ ) {
		$writer->dataElement('option', $1);
	}
}

$writer->end();
$output->close();
