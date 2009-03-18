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
use HTML::Entities;

my $debug=1;

my $cgi = CGI->new();
my ($returnfh, $returnfilepath) = tempfile(UNLINK => 0, SUFFIX=>'.xml', DIR=>"/tmp/") or die "$!";
binmode $returnfh, ":utf8";
my $response = {};
my $records = [];

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
    while(my $record = $batch->next() ){
	$record->encoding('UTF-8');
    my $format = detect_format( $record->leader() );
	my $r = {};
	my $unencodedxml = MARC::File::XML::record($record);
        # add xmlns to <record>
        $unencodedxml =~ s/<record>/<record xmlns="http:\/\/www.loc.gov\/MARC21\/slim">/;
        # encode " so html::entities doesn't replace.  then replace with encoding acceptable to exjs
        $r->{'xml'} = $unencodedxml;
        $r->{'xml'} =~ s/"/|quot|/g;
        $r->{'xml'} = encode_entities($r->{'xml'});
        $r->{'xml'} =~ s/\|quot\|/\"/g;
	if($debug) {
	    #warn 'uploadMarc.pl: encoded marcxml: ' . $encodedxml;
	}
	  #$r->{'title'} = encode_entities($record->title());
        $r->{'title'} = $record->title();
        $r->{'title'} =~ s/"/|quot|/g;
        $r->{'title'} = encode_entities($r->{'title'});
        $r->{'title'} =~ s/\|quot\|/\"/g;

        if($debug ) {
            warn 'encoded title ' . $r->{'title'};
        }

	  #$r->{'author'} = encode_entities($record->author());
        $r->{'author'} = $record->author();
        $r->{'author'} =~ s/"/|quot|/g;
        $r->{'author'} = encode_entities($r->{'author'});
        $r->{'author'} =~ s/\|quot\|/\"/g;
	if( $record->field('260') and $record->field('260')->subfield('b') ){
	    #$r->{'publisher'} = encode_entities($record->field('260')->subfield('b'));
          $r->{'publisher'} = $record->field('260')->subfield('b');
        $r->{'publisher'} = $record->field('260')->subfield('b');
        $r->{'publisher'} =~ s/"/|quot|/g;
        $r->{'publisher'} = encode_entities($r->{'publisher'});
        $r->{'publisher'} =~ s/\|quot\|/\"/g;

	}
	else {
	    $r->{'publisher'} = '';
	}
	  $r->{'date'} = $record->publication_date();
	  $r->{'medium'} = $format;
        $r->{'xmlformat'} = 'marcxml';
        $r->{'Savefiles_id'} = 4;
        $r->{'status'} = 'uploaded';
	push @{$records}, $r;
    }

    $response->{success} = "true";
    $response->{records} = $records;
    if($debug) {
	warn "uploadMarc.pl returning success";
    }
}
else {
    $response->{success} = "false";
}

#warn to_json($response);
binmode STDOUT, ':utf8';
if($debug) {
    #warn to_json($response);
}
print $cgi->header( -type => 'text/html; charset=utf-8' );
print to_json($response,{utf8=>1});

if( $debug ) {
    open F, ">/tmp/json.json";
    print F to_json($response,{utf8=>1});
    close F;
}


sub detect_format {
   my $leader = shift;
   my $leader6 = substr $leader, 6,1;
   my $leader7 = substr $leader, 7,1;
   my $format;
   if ($leader6 eq 'a') {
       if ($leader7 eq 'a' or $leader7 eq 'c' or $leader7 eq 'd' or $leader7 eq 'm') {
               $format = "BKS";        }
       elsif ($leader7 eq 'b' or $leader7 eq 'i' or $leader7 eq 's') {
               $format = "CNR";
       }
   }
   elsif ($leader6 eq 't') { $format = "BKS"; }
   elsif ($leader6 eq 'p') { $format = "MIX"; }
   elsif ($leader6 eq 'm') { $format = "COM"; }
   elsif ($leader6 eq 'c' or $leader6 eq 'd') { $format = "SCO"; }
   elsif ($leader6 eq 'e' or $leader6 eq 'f') { $format = "MAP"; }
   elsif ($leader6 eq 'g' or $leader6 eq 'k' or $leader6 eq 'o' or
$leader6 eq 'r') { $format = "VIS"; }
   elsif ($leader6 eq 'i' or $leader6 eq 'j') { $format = "REC"; }
   # TODO: Archival Materials and Internet Resources
   return $format;
}
