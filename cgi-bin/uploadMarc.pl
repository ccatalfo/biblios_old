#!/usr/bin/perl
use strict;
use warnings;
use CGI qw(:all);
use CGI::Carp;
use MARC::Record;
use MARC::Batch;
use MARC::File::XML( BinaryEncoding => 'utf8', RecordFormat => 'MARC21' );
use File::Basename;
use File::Slurp qw(slurp);
use File::Temp qw(tempfile);
use JSON;

my $debug=1;

my $cgi = CGI->new();
my ($returnfh, $returnfilepath) = tempfile(UNLINK => 0, SUFFIX=>'.xml', DIR=>"/tmp/") or die "$!";
binmode $returnfh, ":utf8";
my $response = {};
my $records = '';

my $filepath = $cgi->param('file');
my ($dev, $ino, $mode, $nlink, $uid, $gid, $rdev, $size, $atime, $mtime, $ctime, $blksize, $blocks) = stat($filepath);
if($debug) {
    warn 'uploadMarc.pl: file size: ' . $size;
}
my $format = $cgi->param('format');
my $fh = $cgi->upload("file");
binmode $fh,":utf8";
my ($filename, $directories, $suffix) = fileparse($filepath, , qr/\.[^.]*/);
#warn "uploadMarc.pl got filename: " . $filename . " with suffix: " . $suffix;
#warn "uploadMarc.pl got format: $format";
print $cgi->header( -type => 'text/html' );

my $success = 0;
my $batch;
if( $format eq 'marc21' ) {
    $batch = MARC::Batch->new('USMARC', $fh) or warn "can't open $filename in marc::batch";
    $success = 1;
}
elsif ( $format eq 'marcxml') {
    $batch = MARC::Batch->new('XML', $fh) or warn "can't open $filename in marc::batch";
    $success = 1;
}
if( $success == 1 ) {
    $records .= MARC::File::XML::header();
    while(my $record = $batch->next() ){
      #warn "got record with title: " . $record->title();
      my $format = detect_format( $record->leader() );
        # add extra 1000 field with medium detected to be used by biblios in assigning medium.  biblios will strip that out.
        $record->add_fields(999, '', '', a => $format);
      $records .= MARC::File::XML::record($record);
      #warn "xml: " . MARC::File::XML::record($record);
    }
    $records .= MARC::File::XML::footer();
    print $returnfh $records;
    close $returnfh;
    $response->{success} = "true";
    $response->{filepath} = fileparse($returnfilepath);
}
else {
    $response->{success} = "false";
}

#warn to_json($response);
print to_json($response);


sub detect_format {
   my $leader = shift;
   my $leader6 = substr $leader, 6,1;
   my $leader7 = substr $leader, 7,1;
   my $format;
   if ($leader6 eq 'a') {
       if ($leader7 eq 'a' or $leader7 eq 'c' or $leader7 eq 'd' or $leader7 eq 'm') {
               $format = "book";        }
       elsif ($leader7 eq 'b' or $leader7 eq 'i' or $leader7 eq 's') {
               $format = "continuing";
       }
   }
   elsif ($leader6 eq 't') { $format = "book"; }
   elsif ($leader6 eq 'p') { $format = "mixed"; }
   elsif ($leader6 eq 'm') { $format = "computer file"; }
   elsif ($leader6 eq 'c' or $leader6 eq 'd') { $format = "score"; }
   elsif ($leader6 eq 'e' or $leader6 eq 'f') { $format = "map"; }
   elsif ($leader6 eq 'g' or $leader6 eq 'k' or $leader6 eq 'o' or
$leader6 eq 'r') { $format = "visual"; }
   elsif ($leader6 eq 'i' or $leader6 eq 'j') { $format = "recording"; }
   # TODO: Archival Materials and Internet Resources
   return $format;
}
