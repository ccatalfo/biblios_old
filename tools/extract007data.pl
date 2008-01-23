#!/usr/bin/perl
use strict;
use warnings;
use IO::File;
use XML::Writer;
use HTML::Strip;
use Text::Trim;

my $output = new IO::File('>007defs.xml');
my $writer = new XML::Writer(OUTPUT => $output, DATA_MODE => 1, DATA_INDENT => 3);
my $hs = new HTML::Strip();
my $mattype = '';

$writer->startTag('fields', 'tag' => '007');
while(<>) {
	if(/<h2>.*007--(\w+\b)+/) {
			if( $writer->in_element('value') ) {
				$writer->endTag('value');
			}
			if( $writer->in_element('field') ) {
				$writer->endTag('field');
			}
			$writer->startTag('field', 'mattype' => $1);
	}
	# Undefined appears in 007 spec and the next value always appears right after it
	elsif( /<li>(\d{2})\s-\s(Undefined)<br>([\w+\b]*)/g ) {
		if( $writer->in_element('value') ) {
			$writer->endTag('value');
		}
		$writer->startTag('value', 'name' => trim($hs->parse($2)), description => trim($hs->parse($3)), position => trim($hs->parse($1)));
		$writer->dataElement('option', ' ',  description=>'Blank');
		$writer->dataElement('option', '|',  description=>'Fill Character');
		$writer->endTag('value');
		if( /\G(.*)<li>(\d{2})\s-\s(\w+)<br>(.*)/ ) {
			$writer->startTag('value', 'name' => trim($hs->parse($3)), position => trim($hs->parse($2)));
		}
		next;	
	}
	elsif( /<li>(\d{2})\s-\s(\S+)(.*)/ ) {
		if( $writer->in_element('value') ) {
			$writer->endTag('value');
		}
		$writer->startTag('value', 'name' => trim($hs->parse($2)), position => trim($hs->parse($1)));
	}
	elsif ( /^<li>(\S)\s-\s(.*)/ ) {
		$writer->dataElement('option', trim($hs->parse($1)), description=>trim($hs->parse($2)));
	}
}

if( $writer->in_element('value') ) {
	$writer->endTag('value');
}
if( $writer->in_element('field') ) {
	$writer->endTag('field');
}

$writer->endTag('fields');
$writer->end();
$output->close();

