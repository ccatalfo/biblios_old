#!/usr/bin/perl
# check_cpan.pm <module-name> <required-version>
# from this site: http://www.boredworkers.com/2007/08/15/perl-scripting-checking-cpan-module-versions/
use strict;
use Getopt::Std;

my $argcnt=0;
my $badcnt=0;
my $warncnt=0;
my $modcnt=0;
my $errcode=0;
my @failed;

my $verbose = 0;

if($verbose) {
    printf ("Checking for required CPAN modules...\n");
    printf ("%-20s %-10s %s\n", "MODULE", "VERSION", "STATUS");
    printf ("%-20s %-10s %s\n", "------", "-------", "------");
}
while (@ARGV[$argcnt]) {
  my $cpan_module=@ARGV[$argcnt++];
  my $cpan_version=$ARGV[$argcnt++];
  eval "require $cpan_module";
  $modcnt++;
  if ($@) {
      if($verbose) {
          printf( "%-20s %-10s %s\n",
                  $cpan_module, $cpan_version, "FAILED: Not found");
      }
      push @failed, "$cpan_module $cpan_version";
    $badcnt++;
  } elsif (! $cpan_module->VERSION) {
      if($verbose) {
          printf ("%-20s %-10s %s\n", $cpan_module, $cpan_version, "WARNING: Undefined version");
      }
    $warncnt++;
  } elsif ($cpan_module->VERSION < $cpan_version) {
      if($verbose) {
          printf ("%-20s %-10s %s\n", $cpan_module, $cpan_version, "WARNING: Unsupported version - ".$cpan_module->VERSION);
      }
    $warncnt++;
  } else {
      if($verbose) {
          printf ("%-20s %-10s %s\n", $cpan_module, $cpan_version, "OK: Version - ".$cpan_module->VERSION);
      }
  }
}
my $okcnt=$modcnt - ($badcnt + $warncnt);
if($verbose) {printf ("%s modules checked. ", $modcnt);}
if ($badcnt > 0) {
  printf ("Failed %s CPAN module tests. \n", $badcnt, $modcnt);
  foreach my $module (@failed) {
      print "$module\n";
  }
  $errcode=1;
}
if ($warncnt > 0) {
  if($verbose) {
      printf ("There were %s warnings. ", $warncnt);
  }
  if ($errcode == 0) {
    $errcode=0;
  }
}
if($verbose ) {
    printf ("%s(%d\%) modules OK.\n", $okcnt, $okcnt / $modcnt * 100);
}
exit $errcode;
