#!/usr/bin/perl
use strict;
use warnings;

use Term::Clui;

my $sruauthurl = ask("What is the url for your sru authorities server?");
my $kohaapiurl = ask("What is the url for your koha staff intranet page (used for retrieving and saving records from koha)?");

my $sedstatus = `sed -e s'|/kohaauth/|/kohaauth/ $sruauthurl|' -e s'|/kohaapi\|/kohaapi/ $kohaapiurl|' < conf/biblios-httpd.conf.dist > conf/biblios-http.conf`;
