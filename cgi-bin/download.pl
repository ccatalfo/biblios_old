#!/usr/bin/perl
use strict;
use warnings;
use CGI qw(:all);
use CGI::Carp;

my $dir = "/tmp/";
my $cgi = CGI->new();
my $filename = $cgi->param('filename');
if( $filename =~ /mrc/ ) {
  print $cgi->header( -type => 'application/octet-stream', -attachment=>'marc.mrc');
}
elsif( $filename =~ /xml/ ) {
  print $cgi->header( -type => 'application/octet-stream', -attachment=>'marc.xml');
}
    
warn "opening $dir$filename to send to browser as download";
open FILE, $dir.$filename or die "can't open $dir$filename for reading";

while(<FILE>) {
  print $_;
}

#warn "deleting $dir . $filename from uploads dir";
#unlink($dir . $filename);

