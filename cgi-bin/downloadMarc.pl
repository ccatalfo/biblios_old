#!/usr/bin/perl
use strict;
use warnings;
use CGI qw(:all);
use CGI::Carp;
use MARC::Record;
use MARC::File::XML;
use File::Temp qw(tempfile);
use File::Basename;


my $cgi = CGI->new();
my $format = $cgi->param('format') || 'MARC21';
my $xml = $cgi->param('xml');
my $encoding = $cgi->param('encoding') || 'utf-8';

#warn $format;
#warn $xml;
#warn $encoding;

my @records = split(/<!-- end of record -->/, $xml);
foreach my $record (@records) {
  warn "got a record: " . $record;
}

#print $cgi->header('Content-Description: File Transfer');
#print $cgi->header( 'Content-Type: application/force-download' );
#print $cgi->header( 'Content-Disposition: attachment; filename="marc.xml"');
if( $format eq 'MARCXML' ) {
  print $cgi->header( -type => 'text/plain');
  my ($fh, $filepath) = tempfile(UNLINK => 0, SUFFIX=>'.xml', DIR=>"/tmp/") or die "$!";
  binmode $fh, ":utf8";
  print $fh MARC::File::XML::header();
  my $xml_recs = "";
  foreach my $rec (@records) {
    my $record = MARC::Record->new_from_xml( $rec, $encoding, $format );
    print $fh MARC::File::XML::record( $record );
    warn "output record with title: " . $record->title();
  }
  print $fh MARC::File::XML::footer();
  close $fh;
  my $filename = fileparse($filepath);
  print $filename;
}
elsif( $format eq 'MARC21' ) {
  print $cgi->header( -type => 'text/plain');
  my ($fh, $filepath) = tempfile(UNLINK => 0, SUFFIX=>'.mrc', DIR=>"/tmp/") or die "$!";
  binmode $fh, ":utf8";
  foreach my $rec (@records) {
    my $record = MARC::Record->new_from_xml( $rec, $encoding, $format );
    print $fh $record->as_usmarc();
    warn "output record with title: " . $record->title();
  }
    close $fh;
  my $filename = fileparse($filepath);
  print $filename;
}
