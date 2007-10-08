#!/usr/bin/perl

# ----------------------------------------------------------------------------------------#
#  Copyright Paul POULAIN
# et Antoine Farnault 2006
# 
#  This file is part of OpenCataloger.
# 
#  OpenCataloger is free software; you can redistribute it and/or modify it under the
#  terms of the GNU General Public License as published by the Free Software
#  Foundation; either version 2 of the License, or (at your option) any later
#  version.
# 
#  OpenCataloger is distributed in the hope that it will be useful, but WITHOUT ANY
#  WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
#  A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
# 
#  You should have received a copy of the GNU General Public License along with
#  OpenCataloger; if not, write to the Free Software Foundation, Inc., 59 Temple Place,
#  Suite 330, Boston, MA  02111-1307 USA
# -----------------------------------------------------------------------------------------#

use strict;
use CGI;
use CGI::Carp;
use ZOOM;
use MARC::Record;
use MARC::File::XML;
#binmode(STDOUT, "utf8");

warn "session started:";

my $input = CGI->new();
print CGI->header();

my $host        = $input->param('host');        # the server host where to save the record
#my $login       = $input->param('login');       # the login to write on this server
#my $pass        = $input->param('pass');        # the password to write on this server
my $marcflavour = $input->param('marcflavour'); # marc21 or unimarc
my $recordXML   = $input->param('record');      # the record to save.
my $encoding    = $input->param('encoding') || "utf-8";    # the record encoding
my($host, $login, $pass) = split(/\-/, $host);

warn "recordXML: " . $recordXML;
warn "host: " . $host;
warn "login: " . $login;
warn "pass: " . $pass;
warn "marcflavour: " . $marcflavour;
warn "encoding: " . $encoding;

my @zconn; # the zebra connexion handler

my $record = MARC::Record->new_from_xml( $recordXML,"utf8",$marcflavour );
warn "record from xml gives title: " . $record->title();

my $action = "specialUpdate";# if $from eq $host ;
#my $op = "create"        if $from ne $host ;

# connection preferences
my $o = new ZOOM::Options();
$o->option(async => 1); # asynchronous.
$o->option(syntax => 'xml'); # asynchronous.
$o->option(type => 'update'); # asynchronous.
$o->option(preferredRecordSyntax => "usmarc");
$o->option(user=>$login) if $login;
$o->option(password=>$pass) if $pass;
$o->option(elementSetName => "F");
$o->option(databaseName => $host);

eval{
    # create a new connection object
    $zconn[0] = create ZOOM::Connection($o);
    # connect to the server
    $zconn[0]->connect($host, 0);

    my $zpackage = $zconn[0]->package();

    # writing the output header.
    #print $input->header();

    $zpackage->option( action => $action );
    #$zpackage->option( record => $record->as_usmarc('utf-8') );
    $zpackage->option( record => $recordXML );

	warn "doing $action and sending update";
    $zpackage->send("update");
    my $i;
    my $event;

    while ( ( $i = ZOOM::event( \@zconn ) ) != 0 ) {
        $event = $zconn[0]->last_event();
        last if $event == ZOOM::Event::ZEND;
    }
    
	warn "sending commit";
    $zpackage->option( action => "commit" );
    $zpackage->send("commit");
    my $i;
    my $event;

    while ( ( $i = ZOOM::event( \@zconn ) ) != 0 ) {
        $event = $zconn[0]->last_event();
        last if $event == ZOOM::Event::ZEND;
    }
   $zconn[0]->destroy();
   $zpackage->destroy();    
};
if($@ || $zconn[0]->errcode()){
    print "Error: ".$zconn[0]->errmsg." ".$zconn[0]->addinfo()." ".$zconn[0]->diagset()." ".$@;
}
else{
    print "ok";
}
