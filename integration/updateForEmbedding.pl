#!/usr/bin/perl
use strict;
use warnings;
use File::Slurp qw(slurp);

my $infile = shift(@ARGV);
my $outfile = shift(@ARGV);
my $prefix = shift(@ARGV);
my $cgiDir = shift(@ARGV);
my $port = shift(@ARGV);
my $headincludes = shift(@ARGV);
my $headerhtml = shift(@ARGV);
my $fixesfile = shift(@ARGV);

open(IN, $infile) or die "can't open $infile for reading $!";
open(OUT, ">$outfile") or die "can't open $outfile for writing $!";

my $cssfixes = slurp($fixesfile);

while(<IN>) {
	if( $_ =~ /.*src="(.*)".*/ ) {
		print 'Updating ' . $_ . 'to ' . $prefix.$1 . "\n";
		my $newdir = $prefix . $1;
		$_ =~ s/$1/$newdir/;
	}
	if( $_ =~ /.*href="(.*)".*/ ) {
		print 'Updating ' . $_ . 'to ' . $prefix.$1 . "\n";
		my $newdir = $prefix . $1;
		$_ =~ s/$1/$newdir/;
	}
	if( $_ =~ /var libPath = ('.*');/ ) {
		print 'Updating ' . $_ . 'to ' . $prefix . "\n";
		my $newdir = "'" . $prefix . "'";
		$_ =~ s/$1/$newdir/;
	}
	if( $_ =~ /var cgiDir = ('.*');/ ) {
		print 'Updating ' . $_ . 'to ' . $cgiDir . "\n";
		my $newdir = "'" . $cgiDir . "'";
		$_ =~ s/$1/$newdir/;
	}
	if( $_ =~ /var hostPort = ('.*');/ ) {
		print 'Updating ' . $_ . 'to ' . $port . "\n";
		my $newport = "':" . $port . "'";
		$_ =~ s/$1/$newport/;
	}
	if( $_ =~ /(<!-- extraheadincludes -->)/ ) {
		print "Updating <head> for extra includes: $headincludes\n";
		$_ =~ s/$1/<head>$headincludes/;
	}
	if( $_ =~ /(<div id='branding-area'>)/ ) {
		print "Updating <div id='branding-area'> to $headerhtml\n";
		my $newheader = $1 . $headerhtml;
		$_ =~ s/$1/$newheader/;
	}
	if( $_ =~ /placeholder/ ) {
		print "Adding fixes from $fixesfile to Ext.onReady\nUpdating $1 with $cssfixes\n";
		print OUT $cssfixes;
	}
	print OUT $_;
}
