#!/usr/bin/perl
use strict;
use warnings;

use LWP::UserAgent;
use CGI;
use CGI::Carp;
use JSON;

my $ua = LWP::UserAgent->new();
$ua->cookie_jar({});
my $cgi = CGI->new();
my $kohaurl = $cgi->param('kohaurl');
my $userid = $cgi->param('userid');
my $password = $cgi->param('password');
my $action = $cgi->param('action');

if( $action eq 'auth' ) {
    my $url = $kohaurl . 'cgi-bin/koha/svc/authentication';
    my $resp = $ua->post( $url, {userid=>$userid, password=>$password});
    if($resp->is_success) {
        print $cgi->header(-type=>'application/json');
        my $data = { 
            cookie => $resp->header('Set-Cookie'),
            resp => $resp->content,
        };
        print to_json($data);
    }
    else {
        print $cgi->header(-type=>'text/xml');
        print '<?xml version="1.0"?><error><msg>' . $resp->status_line . '</msg></error>';
    }
}
elsif( $action eq 'bibprofile') {
    my $url = $kohaurl . 'cgi-bin/koha/svc/bib_profile';
    my $cookie = $cgi->param('cookie');
    my $resp = $ua->post( $url, {},'Cookie' => $cookie );
    if($resp->is_success) {
        print $cgi->header(-type=>'text/xml');
        print $resp->content;
    }
    else {
        print $cgi->header(-type=>'text/xml');
        print '<?xml version="1.0"?><error><msg>' . $resp->status_line . '</msg></error>';
    }

}
elsif( $action eq 'retrieve' ) {
    my $url = $kohaurl . 'cgi-bin/koha/svc/bib/' . $cgi->param('recid');
    my $recid = $cgi->param('recid');
    my $cookie = $cgi->param('cookie');
    my $resp = $ua->get( $url, 'Cookie' => $cookie );
    if($resp->is_success) {
        print $cgi->header(-type=>'text/xml');
        print $resp->content;
    }
    else {
        print $cgi->header(-type=>'text/xml');
        print '<?xml version="1.0"?><error><msg>' . $resp->status_line . '</msg></error>';
    }

}
elsif( $action eq 'save' ) {
    my $saveurl = $cgi->param('saveurl');
    my $url = $kohaurl . 'cgi-bin/koha/svc/' . $saveurl;
    my $cookie = $cgi->param('cookie');
    my $xml = $cgi->param('xml');
    my $resp = $ua->post( $url, {xml=>$xml},'Cookie' => $cookie, 'Content-type' => 'text/xml' );
    if($resp->is_success) {
        print $cgi->header(-type=>'text/xml');
        print $resp->content;
    }
    else {
        print $cgi->header(-type=>'text/xml');
        print '<?xml version="1.0"?><error><msg>' . $resp->status_line . '</msg></error>';
    }
}
else {
        print $cgi->header(-type=>'text/xml');
        print '<?xml version="1.0"?><error><msg>' . 'invalid action' . '</msg></error>';
}
