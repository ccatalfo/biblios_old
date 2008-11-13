#!/usr/bin/perl
use strict;
use warnings;
use Template;
use Date::Format;
use Term::Clui;

my @lt = localtime();
my $buildtime = asctime(@lt);
# remove newlines
$buildtime =~ s/\n//;

my $kohadir = ask("What is the intranet directory of your koha install (examples: for a standard koha installation: /usr/share/koha/intranet/htdocs/intranet-tmpl/prog/en or for a dev koha installation: /kohaclone/koha-tmpl/intranet-tmpl/prog/en/?");
my $kohacgidir = ask("What is the intranet cgi directory of your koha install (examples: for a standard koha installation: /usr/share/koha/intranet/cgi-bin or for a dev koha installation: /kohaclone ?");
my $kohastaffport = ask("What port is your koha staff intranet running on?", "80");
my $kohaurl = ask("What is the url of your staff intranet (without port and without trailing slash)?", "");


my $tt = Template->new({
  PRE_PROCESS => 'conf/build-koha.conf',
  RELATIVE => 1,
}) || die "$Template::ERROR\n";

print "Building Biblios for installation into Koha\n";
my $vars = {
  hostPort => $kohastaffport,
  kohaurl => $kohaurl,
  embeddedUrl => $kohaurl . ":" . $kohastaffport . "/",
  buildtime => $buildtime,
};
$tt->process('./src/index.html', $vars, './build/index.html')
  || die $tt->error(), "\n";

#my $buildstatus = `make koha`;

print "Installing biblios into $kohadir \nsetting up biblios to use port $kohastaffport for koha's intranet site\n";
my $status = `make koha-install KOHADIR=$kohadir KOHACGIDIR=$kohacgidir KOHASTAFFPORT=$kohastaffport`
