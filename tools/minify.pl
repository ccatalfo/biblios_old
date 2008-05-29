#!/usr/bin/perl
use strict;
use warnings;
use JavaScript::Minifier qw(minify);

my $infile = shift;
my $outfile = shift;
open(INFILE, $infile) or die;

open(OUTFILE, ">$outfile") or die;

minify(input => *INFILE, outfile => *OUTFILE);

close(INFILE);

close(OUTFILE);
