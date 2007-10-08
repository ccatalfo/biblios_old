#!/usr/bin/perl
use strict;
use CGI;
use CGI::Carp;

my $cgi = CGI->new();
my $id = $cgi->param('id');
my $xml = $cgi->param('xml');

carp("id: " . $id);
carp("xml: " . $xml);

print $cgi->header();
