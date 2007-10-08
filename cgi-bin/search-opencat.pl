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
use warnings;
use CGI;
use CGI::Carp;
use ZOOM;
use MARC::File::XML;
use MARC::Record;

my $cgi = new CGI;

#Getting the param value.
my $query    = $cgi->param("query");
my $servers  = $cgi->param("servers");
my $cclfile  = $cgi->param("cclfile");
my $encoding = $cgi->param("encoding") || "UTF-8";
warn $query;
warn $servers;
warn $cclfile;
warn $encoding;

$query =~ s/:/=/g;

my(@hosts,$host,$login,$pass,$options);

#server list is stored on this array.
@hosts=();
@hosts=split(" ",$servers);
my @zconns;

# print the header here.
print $cgi->header(
    -type    =>'text/xml',
    -charset =>$encoding
);

print MARC::File::XML::header();
# for all the servers listed in the config file :
for my $numServer (0..$#hosts) {
    $host = $hosts[$numServer];

    # Extract the login and pass
    $host=~/^(.*)-login-(.*)-pass-(.*)$/;
    $host = $1;
    $login = $2;
    $pass = $3;
    warn "Searching $host with $login and $pass";    
    # I use specific xml header for each servers :
    print "<server name=\"$host\">\n";
    
    # connection preferences
    # set options
    my $o = new ZOOM::Options();
    $o->option(async => 1); # asynchronous.

    $o->option(cclfile=> $cclfile) if $cclfile;
    $o->option(preferredRecordSyntax => "usmarc");
    $o->option(elementSetName => "F"); # F for 'full' as opposed to B for 'brief'
#     $o->option(user=>$login) if $login;
    if($login){
        warn "login=>".$login."<=";
        $o->option(user=>"".$login);
    }
    if($pass){
        warn "pass=>".$pass."<=";
        $o->option(password=>"".$pass);
    }
#     $o->option(password=>$pass) if $pass;

    # create a new conne$zconns[$numServer]->destroy();ction object
    eval{
        $zconns[$numServer]= create ZOOM::Connection($o);
        # forge to server
        $zconns[$numServer]->connect($host, 0);
        
        my @tmpresults;
        $tmpresults[$numServer] = $zconns[$numServer]->search(
             new ZOOM::Query::CCL2RPN( $query, $zconns[$numServer] ) );
            # getting error message if one occured.
        my $error =
                $zconns[$numServer]->errmsg() . " ("
              . $zconns[$numServer]->errcode() . ") "
              . $zconns[$numServer]->addinfo() . " "
              . $zconns[$numServer]->diagset();
        
        if ($zconns[$numServer]->errcode() == 0){
            my $hits = 0;
            my $ev;
            my $xml="";
            while ( ( my $i = ZOOM::event( \@zconns ) ) != 0 ) {
               
                $ev = $zconns[ $i - 1 ]->last_event();
                
                if ( $ev == ZOOM::Event::ZEND ) {
                    $hits = $tmpresults[ $i - 1 ]->size();
                }
                
                if ( $hits > 0 ) {
                    for ( my $j = 0 ; $j < $hits ; $j++ ) {
                        # getting the answers
                        my $raw  = $tmpresults[ $i - 1 ]->record($j)->raw();
                        my $mrec = MARC::Record->new_from_usmarc($raw);
                        $mrec->encoding('UTF-8');
                        warn ("downloading record with title: " . $mrec->title() );
                        $xml .= MARC::File::XML::record($mrec);
                    }
                }
            }
            # now wrinting the xml output
            print $xml;
            print "\n</server>\n";
        }
        else {
            print "\t<error value=\"$error\"/></server>\n";
        }
    }; # eval
    if($@){
        print "\t<error value=\"$@->code() : $@->message()\"/>\n</server>\n";
    }
}
print MARC::File::XML::footer();
