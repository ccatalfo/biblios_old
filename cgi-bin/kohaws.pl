#!/usr/bin/perl
use strict;
use warnings;

use LWP::UserAgent;
use CGI;
use CGI::Carp;
use JSON;

my $debug = 1;

my $ua = LWP::UserAgent->new();
$ua->cookie_jar({});
my $cgi = CGI->new();
my $kohaurl = $cgi->param('kohaurl');
my $userid = $cgi->param('userid');
my $password = $cgi->param('password');
my $action = $cgi->param('action');

if( $action eq 'auth' ) {
    my $url = $kohaurl;
    if($debug){
        warn "Authenticating to $url";
    }
    my $resp = $ua->post( $url, {userid=>$userid, password=>$password});
    if($resp->is_success) {
        print $cgi->header(-type=>'text/x-json', -status=>$resp->code);
        my $data = { 
            cookie => $resp->header('Set-Cookie'),
            resp => $resp->content,
        };
        print to_json($data);
    }
    else {
        print $cgi->header(-type=>'text/xml; charset=utf-8', -status=>$resp->code);
        my $data = {
            resp => $resp->content
        };
        print to_json($data);
    }
}
elsif( $action eq 'bibprofile') {
    my $url = $kohaurl;
    if($debug) {
        warn "Requesting bib profile from $url";
    }
    my $cookie = $cgi->param('cookie');
    my $resp = $ua->post( $url, {},'Cookie' => $cookie );
    if($resp->is_success) {
        print $cgi->header(-type=>'text/xml; charset=utf-8', -status=>$resp->code);
        print $resp->content;
    }
    else {
        print $cgi->header(-type=>'text/xml; charset=utf-8', -status=>$resp->code);
        print $resp->content;
    }

}
elsif( $action eq 'retrieve' ) {
    my $url = $kohaurl;
    if($debug) {
        warn "Retrieving record from $url";
    }
    my $recid = $cgi->param('recid');
    my $cookie = $cgi->param('cookie');
    my $resp = $ua->get( $url, 'Cookie' => $cookie );
    if($resp->is_success) {
        print $cgi->header(-type=>'text/xml; charset=utf-8', -status=>$resp->code);
        print $resp->content;
    }
    else {
        print $cgi->header(-type=>'text/xml; charset=utf-8', -status=>$resp->code);
        print '<?xml version="1.0"?><error><msg>' . $resp->status_line . '</msg></error>';
    }

}
elsif( $action eq 'save' ) {
    my $saveurl = $cgi->param('saveurl');
    my $url = $kohaurl . $saveurl;
    if($debug) {
        warn "Saving record to $url";
    }
    my $cookie = $cgi->param('cookie');
    my $xml = $cgi->param('xml');
    my $resp = $ua->post( $url,'Cookie' => $cookie, 'Content-type' => 'text/xml', Content => $xml );
    if($resp->is_success) {
        print $cgi->header(-type=>'text/xml; charset=utf-8', -status=>$resp->code);
        print $resp->content;
    }
    else {
        print $cgi->header(-type=>'text/xml; charset=utf-8', -status=>$resp->code);
        print '<?xml version="1.0"?><error><msg>' . $resp->status_line . '</msg></error>';
    }
}
