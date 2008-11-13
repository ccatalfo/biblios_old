#!/usr/bin/perl
use strict;
use warnings;
use Template;
use Date::Format;
use Term::Clui;
use Getopt::Std;

my $debug = 1;

my @lt = localtime();
my $buildtime = asctime(@lt);
# remove newlines
$buildtime =~ s/\n//;


my( $kohadir, $kohacgidir, $kohaintranetdir);
our( $opt_i, $opt_c );

getopt('ic');

$kohadir = $opt_i;
$kohacgidir = $opt_c;
$kohadir =~ /(\/intranet-tmpl\/.*)/;
$kohaintranetdir = $1 . 'lib/biblios/';

if($debug) {
    print "kohadir = $kohadir\n";
    print "kohaintranetdir = $kohaintranetdir\n";
    print "kohacgidir = $kohacgidir\n";
}
my $tt = Template->new({
  PRE_PROCESS => 'conf/build-koha.conf',
  RELATIVE => 1,
}) || die "$Template::ERROR\n";

print "Building Biblios for installation into Koha\n";
my $vars = {
  buildtime => $buildtime,
  kohaintranetdir => $kohaintranetdir,
};
$tt->process('./integration/koha/biblios.tmpl', $vars, './build/biblios.tmpl')
  || die $tt->error(), "\n";

#my $buildstatus = `make koha`;

print "Installing biblios into $kohadir \n";
my $status = `make koha-install KOHADIR=$kohadir KOHACGIDIR=$kohacgidir`; 
