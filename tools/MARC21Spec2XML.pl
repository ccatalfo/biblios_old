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
	if( $text =~ /(\d{3})--(.*)/ ) {
		if( $writer->in_element('value')) {
			$writer->endTag('value');
		}
		if( $writer->in_element('field')) {
			$writer->endTag('field');
		}
		$writer->startTag('field', code => $1, type=>$2);
	}
	elsif( $text =~ /(\d{2}(?:-\d{2})?)\s-\s(.*)/ ) {
		if( $writer->in_element('value')) {
			$writer->endTag('value');
		}
		my $position = $1;
		my $description = $2;
		my $length = 1;
		# see if we have a position like 06-08; if so compute its length
		if( $position =~ /(\d{2})-(\d{2})/ ) {
			my $endpoint = $2;
			$position = $1;
			$endpoint = removeLeadingZero($endpoint);
			$length = $endpoint - $position +1;
			print "computed length = $length\n";
		}
		$position = removeLeadingZero($position);
		my $details = $p->get_trimmed_text('ul');
		$writer->startTag('value', position => $position, description => $description, length => $length, details => $details);
	}
	elsif( $text =~ /(\S+) - (.*)/ ) {
		$writer->dataElement('option', $1, description => $2);

	}
}

if( $writer->in_element('value')) {
	$writer->endTag('value');
}
if( $writer->in_element('field')) {
	$writer->endTag('field');
}
if( $writer->in_element('fields')) {
	$writer->endTag('fields');
}
$writer->end();
$output->close();


sub removeLeadingZero {
	my $str = shift(@_);
	$str =~ s/^0//;
	return $str;
}
