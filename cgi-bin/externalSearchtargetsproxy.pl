#!/usr/bin/perl
use strict;
use warnings;

use LWP::UserAgent;
use HTTP::Request;
use URI;
use URI::QueryParam;
use CGI;
use CGI::Carp;
use JSON;

my $debug = 1;

my $ua = LWP::UserAgent->new();
my $cgi = CGI->new();
my $resp;

my $query = $cgi->param('query');
my $start = $cgi->param('start');
my $limit = $cgi->param('limit');
my $librarytype = $cgi->param('librarytype');
my $country = $cgi->param('country');
my $action = $cgi->param('action');
my $dburl = $cgi->param('dburl');
my $dburi = URI->new($dburl);

if($debug) {
    warn "dburl: $dburl";
}
if( $dburl =~ /countries|librarytypes/ ) {
    warn 'countries or librarytypes req';
    $dburi->query_param(query=>$query);
    $resp = $ua->get( $dburi );
}
elsif( $query ne '' ) {
    $dburi->query_param(query=>$query);
    $dburi->query_param(limit=>$limit);
    $dburi->query_param(start=>$start);
    $dburi->query_param(librarytype=>$librarytype);
    $dburi->query_param(country=>$country);
    $resp = $ua->get( $dburi );
}
elsif ($action eq 'update') {
    my $target = $cgi->param('target');
    my $req = HTTP::Request->new(PUT=>$dburi);
    $req->content_type('application/x-www-form-urlencoded');
    my $content = 'target='.$target;
    $req->content($content);
    if($debug) {
	warn $content;
    }
    $resp = $ua->request($req);
}
elsif( $action eq 'create' ) {
    my $target = $cgi->param('target');
    $resp = $ua->post( $dburi, {target=>$target});
}
print $cgi->header(-type=>'application/json', -status=>$resp->code);
print $resp->content;


