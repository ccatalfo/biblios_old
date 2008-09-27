#!/usr/bin/perl
use strict;
use warnings;
use XML::LibXSLT;
use XML::LibXML;
use CGI;
use CGI::Carp;
use XML::Simple;
use JSON;
use Data::Dumper;
require Encode;

my $debug = 1;
my $parser = XML::LibXML->new();
my $xslt = XML::LibXSLT->new();
my $cgi = CGI->new();

#my $xsl_path = $cgi->param('xslpath');
my $xsl_path = $ENV{'BIBLIOS_XSL_PATH'};
if($debug) {warn "Using $xsl_path as biblios xsl path";}

my $xml = Encode::decode_utf8( $cgi->param('xml') );
my $xsl_file = $cgi->param('stylesheet');
my $editorid = $cgi->param('editorid') || 'editorone';
my $contenttype = $cgi->param('contenttype') || 'text/html';
if($debug){
	warn "xsltransform: generating for editorid: $editorid";
}

my $source = $parser->parse_string($xml);
my $style_doc = $parser->parse_file($xsl_path . $xsl_file) or print "Can't open stylesheet $xsl_file";
my $stylesheet = $xslt->parse_stylesheet($style_doc) or print "Can't parse stylesheet $!";
my $results = $stylesheet->transform($source, XML::LibXSLT::xpath_to_string(editorid => $editorid)) or print "Can't transform $!";

print $cgi->header(-type=>$contenttype, -charset=>'utf-8');
# output_as_chars should return utf-8
print $stylesheet->output_string($results);


