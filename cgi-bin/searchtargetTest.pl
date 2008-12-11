#!/usr/bin/perl
use strict;
use warnings;

use ZOOM;
use CGI;
use CGI::Carp;
use JSON;
use Data::Dumper;

my $debug = 1;

my $cgi = new CGI;
my $target = $cgi->param('target');
my $targetdata = from_json($target,{utf8=>1});
#warn Dumper $targetdata;
my $response = {
    
};
if($debug) {
    warn 'testing connection with ' . $targetdata->{'hostname'} . $targetdata->{'port'} . $targetdata->{'dbname'};
}
my $conn;

eval {
    $conn = new ZOOM::Connection($targetdata->{'hostname'},$targetdata->{'port'},databaseName => $targetdata->{'dbname'});
};
if( $conn && $conn->errcode != 0) {
    if($debug) {
	warn 'error on target test: ' . $conn->errmsg();
    }
    $response->{'success'} = 'false',
    $response->{'message'} = $conn->errmsg(),
}
elsif($@) {
    if($debug) {
	warn 'error on target test: ' . $@->message();
    }
    $response->{'success'} = 'false';
    $response->{'message'} = $@->message();
}
else {
    if($debug) {
	warn 'test of ' . $targetdata->{'hostname'} . ' successful';
    }
    $response->{'success'} = 'true';
    $response->{'message'} = '';
    $response->{'target'} = $targetdata;
}
print $cgi->header(-type=>'application/json');
print to_json($response,{utf8=>1});
