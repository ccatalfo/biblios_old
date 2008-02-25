#!/usr/bin/perl
use strict;
use warnings;

my $infile = shift(@ARGV);
my $outfile = shift(@ARGV);
my $prefix = shift(@ARGV);
my $cgiDir = shift(@ARGV);
my $port = shift(@ARGV);
my $headincludes = shift(@ARGV);
my $headerhtml = shift(@ARGV);

open(IN, $infile) or die "can't open $infile for reading $!";
open(OUT, ">$outfile") or die "can't open $outfile for writing $!";

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
	if( $_ =~ /(<head>)/ ) {
		print "Updating <head> for extra includes\n";
		$_ =~ s/$1/<head>$headincludes/;
	}
	if( $_ =~ /(<div id='branding-area'>)/ ) {
		print "Updating <div id='branding-area'> for header html\n";
		my $newheader = $1 . $headerhtml;
		$_ =~ s/$1/$newheader/;
	}
	print OUT $_;
}
