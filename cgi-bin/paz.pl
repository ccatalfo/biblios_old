#!/usr/bin/perl
use warnings;
use strict;
use lib '.';
use PazPar2;
use CGI;
use CGI::Carp qw(fatalsToBrowser);
use CGI::Session;
use JSON;
use Data::Dumper;
use XML::Simple;

my $debug = 1;

my $cgi = CGI->new();
CGI::Session->name('bibliospazsession');
my $session = new CGI::Session or die CGI::Session->errstr;

my $sessionID = $session->param('sessionID');
my $action = $cgi->param('action');
if($debug){ warn "paz.pl: action: $action";}

if( $action eq 'init') {
    if($debug){ warn 'creating new paz session';}
    my $pazpar2url = $cgi->param('pazpar2url');
    $session->param('pazpar2url', $pazpar2url);
    if($debug){ warn 'paz.pl::init pazpar2url:' . $pazpar2url;}
    print $session->header();
    my $paz = PazPar2->new("$pazpar2url");
    my $sessionID = $paz->init();
    if($debug){ warn 'paz.pl::init initresp: ' . $sessionID;}
    $session->param('sessionID', $sessionID);
    print $sessionID;
    exit 0;
}
my $pazpar2url = $session->param('pazpar2url');
if($debug){ warn "paz.pl: using $pazpar2url as pazpar2 url";}
my $paz = PazPar2->new("$pazpar2url");

if( $sessionID and $action ne 'init') {
    if($debug) {warn 'attempting to reuse session '. $sessionID;}
    $paz->setSession($sessionID);
    my $pingresp = $paz->ping();
    if($debug) {warn $pingresp;}
    if( $pingresp =~ /417/ ) {
        if($debug) {warn 'Session had expired...reinitializing';}
        my $sessionID = $paz->init();
        $session->param('sessionID', $sessionID);
        $paz->setSession($sessionID);
        my $settings = $session->param('settings');
        if( $settings ) {
            if($debug){ warn 'Resetting pazpar2 settings';}
            foreach my $setting (@{$settings}) {           	
            	#warn Dumper $setting;
           		$paz->settings( $setting );
            }
        }
        if( $action ne 'search' ) {
            if($debug) {warn 'running search with new session';}
            $paz->search( $session->param('query') );
        }
    }
}

warn 'paz.pl: After session reuse and init paz session is ' . $paz->getSession();

if( $action eq 'search' ) {
    my $query = $cgi->param('query');
    my $filter = $cgi->param('filter');
    if($debug){ warn 'paz.pl::search query: ' . $query;}
    $session->save_param();
    print $cgi->header(-type=>'text/xml');
    if( $filter ) {
        print $paz->search($query, $filter);
    }
    else {
        print $paz->search($query);
    }
}
elsif ( $action eq 'show') {
    my $start = $cgi->param('start') || 0;
    my $num = $cgi->param('num') || 15;
    my $sort = $cgi->param('sort') || 'relevance';
    my $dir = $cgi->param('dir') || 'ASC';
    #get sort param right for pazpar2 protocol
    # format: title:0 where
    # ASC = 1, DESC = 0  
    my $pazsort = $sort;
    if( $dir eq 'ASC' ) {
    	$pazsort .= ':1';
    }
    elsif ($dir eq 'DESC') {
    	$pazsort .= ':0';
    }
    $session->save_param();
    print $session->header(-type=>'text/xml', -charset=>'utf-8');
    print $paz->show($start, $num, $pazsort, 1);
}
elsif( $action eq 'stat' ) {
    print $session->header(-type=>'text/xml');
    print $paz->stat();
}
elsif( $action eq 'recid' ) {
    #print $session->header(-type=>'text/xml', -charset=>'utf-8');
    #print Dumper $session->{'records'};
    my $records = from_json($cgi->param('records'));
    print $cgi->header(-type=>'text/xml', -encoding=>'utf-8');
    print "<?xml version='1.0' encoding='utf-8'?><collection>";
    foreach my $record (@{$records}) {
        my $offset = $record->{'offset'};
        my $recid = $record->{'recid'};
        if($debug){ warn "paz.pl::recid Fetching $offset of $recid";}
        my $rec = $paz->record($recid, $offset);
        #warn 'paz.pl::record ' . $rec;
        $rec =~ s/<\?xml version="1\.0"\?>//;
        print $rec;
    }
    print "</collection>";
}
elsif( $action eq 'records' ) {
	print $session->header(-type=>'text/plain', -charset=>'utf-8');
    #print Dumper $session->{'records'};
    my $num = $cgi->param('num');
    my $showxml = $paz->show(0, $num, 'relevance', 1);
    if($debug){warn $showxml;}
    my $showdata = XMLin($showxml, ForceArray=>['hit']);
    if($debug){warn $showdata;}
    foreach my $hit (@{$showdata}) {
    	print $hit->{'recid'};
    }
}
elsif( $action eq 'termlist' ) {
    my $name = $cgi->param('name');
    my $termlistxml = $paz->termlist($name);
    print $cgi->header(-type => 'text/xml');
    print $termlistxml;
}
elsif( $action eq 'bytarget' ) {
    my $name = $cgi->param('name');
    my $bytargetxml = $paz->bytarget($name);
    my $bytargetdata = XMLin($bytargetxml, ForceArray => 1);
    my $bytargetjson = {
    	'status' => $bytargetdata->{'status'},
    	'targets' => $bytargetdata->{'target'},
    };
    print $cgi->header(-type => 'text/html');
    print to_json($bytargetjson);
}
elsif( $action eq 'settings' ) {
    my $settingsjson = $cgi->param('settings');
    my $settings = from_json($settingsjson);
    $session->param('settings', $settings);
    print $cgi->header(-type => 'text/xml');
    foreach my $setting (@{$settings}) {
    	print $paz->settings($setting);
    	#warn Dumper $setting;
    }
}
elsif( $action eq 'ping') {
    print $cgi->header(-type => 'text/xml');
    print $paz->ping();
}

sub print_session {
    my $data = {
        session => $paz->getSession(),
    };
    print $cgi->header(-type => 'text/html');
    print to_json($data);
}

