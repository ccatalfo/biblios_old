#!/usr/bin/perl
use strict;
use warnings;
use CGI;
use JSON;
use File::Slurp qw(slurp);
use File::Basename;
use File::Temp qw(tempfile);

my $cgi = CGI->new();
my $filepath = $cgi->param('file');
my $fh = $cgi->upload('file');
my ($filename, $directories, $suffix) = fileparse($filepath, , qr/\.[^.]*/);
my ($returnfh, $returnfilepath) = tempfile(UNLINK => 0, SUFFIX=>'.js', DIR=>"/tmp/") or die "$!";

my $dbtext = slurp($fh);

print $returnfh $dbtext;

my $response = {};
$response->{success} = "true";
$response->{filepath} = fileparse($returnfilepath);

print $cgi->header( -type => 'text/html' );
print to_json($response);

