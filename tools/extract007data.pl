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
	# if we have a material type designation
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
		my $position = removeLeadingZero(trim($hs->parse($1)));
		my $length = '1';
		$writer->startTag('value', 'name' => trim($hs->parse($2)), description => trim($hs->parse($3)), position => $position, 'length' => $length);
		$writer->dataElement('option', ' ',  description=>'Blank');
		$writer->dataElement('option', '|',  description=>'Fill Character');
		$writer->endTag('value');
		# extract the next value directy following the last Undefined match
		if( /\G(.*)<li>(\d{2})\s-\s(\w+)<br>(.*)/ ) {
			my $position = removeLeadingZero(trim($hs->parse($2)));
			my $length = '1';
			$writer->startTag('value', 'name' => trim($hs->parse($3)), position => $position, 'length' => $length);
		}
		next;	
	}
	# if we have a normal character position definition
	elsif( /<li>(\d{2}(?:-\d{2})?)\s-\s(\S+)(.*)/ ) {
		if( $writer->in_element('value') ) {
			$writer->endTag('value');
		}
		my $position = trim($hs->parse($1));
		print "position = $position\n";
		my $length = '1';
		# see if we have a position like 06-08; if so compute its length
		if( $position =~ /(\d{2})-(\d{2})/ ) {
			my $endpoint = $2;
			$position = $1;
			$endpoint = removeLeadingZero($endpoint);
			$length = $endpoint - $position;
			print "computed length = $length\n";
		}
		$position = removeLeadingZero($position);
		$writer->startTag('value', 'name' => trim($hs->parse($2)), 'position' => $position, 'length' => $length);
	}
	# if we have a possible valid value
	elsif ( /^<li>(\S*)\s-\s(.*)<\/ul>/ ) {
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

sub removeLeadingZero {
	my $str = shift(@_);
	$str =~ s/^0//;
	return $str;
}
