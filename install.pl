#!/usr/bin/perl
use strict;
use warnings;
use Template;
use Term::Clui;
use Date::Format;

my @lt = localtime();
my $buildtime = asctime(@lt);
# remove newlines
$buildtime =~ s/\n//;

my $cgidir = ask("What is the path of your webserver's cgi-bin directory where Biblios will install its server side scripts?");

my $htmldir = ask("What is the path of the directory where Biblios should places its index.html and associated javascript files?");

my $tt = Template->new({
  PRE_PROCESS => 'conf/build-standalone.conf',
  RELATIVE => 1,
}) || die "$Template::ERROR\n";

print "Building Biblios for installation into $htmldir\n and cgi-bin path $cgidir\n";
my $vars = {
  buildtime => $buildtime,
};
$tt->process('./src/index.html', $vars, 'build/index.html')
  || die $tt->error(), "\n";

print "Installing Biblios\n";
my $status = `make install HTMLDIR=$htmldir CGIDIR=$cgidir`;
