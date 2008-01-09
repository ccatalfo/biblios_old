#!/usr/bin/perl
use strict;
use warnings;

my $infile = shift(@ARGV);
my $outfile = shift(@ARGV);
my $prefix = shift(@ARGV);
my $port = shift(@ARGV);
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
	if( $_ =~ /var hostPort = ('.*');/ ) {
		print 'Updating ' . $_ . 'to ' . $port . "\n";
		my $newport = "':" . $port . "'";
		$_ =~ s/$1/$newport/;
	}
	print OUT $_;
}
