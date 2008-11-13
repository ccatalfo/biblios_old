#!/usr/bin/perl
use strict;
use warnings;

use CGI;
use LWP::UserAgent;

my $debug=1;
my $ua = LWP::UserAgent->new();
my $cgi = CGI->new();

my $sruurl = $cgi->param('sruurl');

my $resp = $ua->post( $sruurl, {
    version => $cgi->param('version'), 
    query => $cgi->param('query'),
    operation=>$cgi->param('operation'),
    recordSchema=>$cgi->param('recordSchema'),
    maximumRecords=>$cgi->param('maximumRecords')
});

print $cgi->header( -type=>'text/xml', -status=>$resp->code);
print $resp->content;
