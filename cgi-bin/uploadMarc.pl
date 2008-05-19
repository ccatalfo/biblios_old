#!/usr/bin/perl
use strict;
use warnings;
use CGI qw(:all);
use CGI::Carp;
use MARC::Record;
use MARC::Batch;
use MARC::File::XML;
use File::Basename;
use File::Slurp qw(slurp);
use File::Temp qw(tempfile);
use JSON;

my $cgi = CGI->new();
my ($returnfh, $returnfilepath) = tempfile(UNLINK => 0, SUFFIX=>'.xml', DIR=>"/tmp/") or die "$!";
my $response = {};
my $records = '';

my $filepath = $cgi->param('file');
my $format = $cgi->param('format');
my $fh = $cgi->upload("file");
my ($filename, $directories, $suffix) = fileparse($filepath, , qr/\.[^.]*/);
#warn "uploadMarc.pl got filename: " . $filename . " with suffix: " . $suffix;
#warn "uploadMarc.pl got format: $format";
print $cgi->header( -type => 'text/html' );

if( $format eq 'marc21' ) {
    my $batch = MARC::Batch->new('USMARC', $fh) or warn "can't open $filename in marc::batch";
    $records .= MARC::File::XML::header();
    #warn MARC::File::XML::header();
    while(my $record = $batch->next() ){
      #warn "got record with title: " . $record->title();
      $records .= MARC::File::XML::record($record);
      #warn "xml: " . MARC::File::XML::record($record);
    $records .= MARC::File::XML::footer();
    }
}
elsif ( $format eq 'marcxml') {
    $records = slurp($fh) or die "can't open $filename for reading";
}
#warn MARC::File::XML::footer();
else {
    $response->{success} = "false";
}

print $returnfh $records;
close $returnfh;
$response->{success} = "true";
$response->{filepath} = fileparse($returnfilepath);
#warn to_json($response);
print to_json($response);

