#!/usr/bin/perl
use strict;
use warnings;

use Term::Clui;

my $kohadir = ask("What is the base directory of your koha install?");
my $langtheme = ask("What is the language/theme path for koha (e.g.) /prog/en", "/prog/en");
my $kohastaffport = ask("What port is your koha staff intranet running on?", "8080");

print "Installing biblios into $kohadir with language/theme path $langtheme and setting up biblios to use port $kohastaffport for koha's intranet site\n";
my $status = `make koha-install KOHADIR=$kohadir KOHALANGTHEME=$langtheme KOHASTAFFPORT=$kohastaffport`
