#!/usr/bin/perl
use strict;
use warnings;
use CGI;
use File::Temp qw(tempfile);
use File::Basename;
use JSON;

my $cgi = CGI->new();

my $db = $cgi->param('db');
warn $db;
my $jsontext = from_json( $db );

my ($fh, $filepath) = tempfile(UNLINK => 0, SUFFIX=>'.js', DIR=>"/tmp/") or die "$!";
print $fh $db;
close $fh;

print $cgi->header( -type => 'text/plain' );
my $filename = fileparse($filepath);
print $filename;


