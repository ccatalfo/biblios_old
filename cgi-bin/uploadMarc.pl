#!/usr/bin/perl
use strict;
use warnings;
use CGI qw(:all);
use CGI::Carp;
use MARC::Record;
use MARC::Batch;
use MARC::File::XML;
use File::Basename;

my $cgi = CGI->new();

my $filepath = $cgi->param('fileToUpload');
my $fh = $cgi->upload("fileToUpload");
my $filename = fileparse($filepath);
warn "uploadMarc.pl got filename: " . $filename;

print $cgi->header( -type => 'text/xml' );

my $batch = MARC::Batch->new('USMARC', $fh) or warn "can't open $filename in marc::batch";
print MARC::File::XML::header();
warn MARC::File::XML::header();
while(my $record = $batch->next() ){
  warn "got record with title: " . $record->title();
  print MARC::File::XML::record($record);
  warn "xml: " . MARC::File::XML::record($record);
}
print MARC::File::XML::footer();
warn MARC::File::XML::footer();

