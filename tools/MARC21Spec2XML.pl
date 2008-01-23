#!/usr/bin/perl
use strict;
use warnings;
use HTML::TokeParser;
use XML::Writer;
use IO::File;

my $p = HTML::TokeParser->new(shift);
my $outfile = shift;
my $output = new IO::File(">$outfile");
my $writer = new XML::Writer(OUTPUT => $output, DATA_MODE => 1, DATA_INDENT => 3);

$writer->startTag('fields');
while( my $token = $p->get_tag("title", "li", "a")) {
	my $text = $p->get_trimmed_text();
	print "trimmed text: $text\n\n";
	print "-----\n";
	if( $text =~ /(\d{3})/ ) {

	}
	elsif( $text =~ /(\d{2}(?:-\d{2})?)\s-\s(.*)/ ) {
		if( $writer->in_element('value')) {
			$writer->endTag('value');
		}
		$writer->startTag('value', position => $1, description => $2);
	}
	elsif( $text =~ /(\S+) - (.*)/ ) {
		$writer->dataElement('option', $1, description => $2);

	}
}

$writer->endTag('value');
$writer->endTag('fields');
$writer->end();
$output->close();
