#!/usr/bin/perl
 
# This file is part of Koha.
#
# Koha is free software; you can redistribute it and/or modify it under the
# terms of the GNU General Public License as published by the Free Software
# Foundation; either version 2 of the License, or (at your option) any later
# version.
#
# Koha is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along with
# Koha; if not, write to the Free Software Foundation, Inc., 59 Temple Place,
# Suite 330, Boston, MA  02111-1307 USA

use strict;
use warnings;

use C4::Output;    # contains gettemplate
use C4::Auth;
use C4::Context;
use C4::Biblio;
use CGI;
use CGI::Carp;
use LWP::Simple;
use XML::Simple;
use MARC::File::XML;

my $debug = 0;
my $query = new CGI;

my ( $template, $loggedinuser, $cookie ) = get_template_and_user(
    {
        template_name   => "cataloguing/biblios.tmpl",
        query           => $query,
        type            => "intranet",
        authnotrequired => 0,
        flagsrequired   => { editcatalogue => 1 },
    }
);

my $biblionumber = $query->param('biblionumber');
if( $biblionumber ) {
    my $record = GetMarcBiblio($biblionumber);
    my $recordxml = $record->as_xml_record();
    $template->param( biblionumber => $biblionumber );
    $template->param( recordxml => $recordxml );
    if($debug) {
        warn "Retrieving marcxml for biblionumber $biblionumber";
    }
}

$template->param( loggedinuser => $loggedinuser );
$template->param( embeddedSESSID => $cookie );

output_html_with_http_headers $query, $cookie, $template->output;
