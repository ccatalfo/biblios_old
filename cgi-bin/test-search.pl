#!/usr/bin/perl
#use strict;
#use warnings;
use ZOOM;
use MARC::Record;
use MARC::File::XML;
use CGI qw(:all);
use CGI::Carp;

my $cgi = CGI->new();
my $query    = $cgi->param("query");
my $targets  = $cgi->param("servers");
my $cclfile  = $cgi->param("cclfile");
my $encoding = $cgi->param("encoding") || "UTF-8";
my $limit    = $cgi->param("limit") || 5; 

warn $query;
warn $targets;
warn $cclfile;
warn $encoding;

my @servers = split(" ", $targets);
my %records;

$query =~ s/:/=/g;
my $xml = '';

# print the header here.
print $cgi->header(
    -type    =>'text/xml',
    -charset =>$encoding
);

print MARC::File::XML::header();
xml .= MARC::File::XML::header();

 for ($i = 0; $i < @servers; $i++) {
    $host = $servers[$i];

    # Extract the login and pass
    $host=~/^(.*)-login-(.*)-pass-(.*)$/;
    $host = $1;
    $user = $2;
    $password = $3;
    warn "Searching $host with $login and $pass";    
     $z[$i] = new ZOOM::Connection($host, 0,
                                   async => 1, # asynchronous mode
                                   count => 1, # piggyback retrieval count
                                   preferredRecordSyntax => "usmarc",
                                   user => $user,
                                   password => $password,
                                   cclfile => $cclfile
                                 );
     $r[$i] = $z[$i]->search(
       new ZOOM::Query::CCL2RPN( $query, $z[$i]));
 }
 while (($i = ZOOM::event(\@z)) != 0) {
     $ev = $z[$i-1]->last_event();
     warn("connection ", $i-1, ": ", ZOOM::event_str($ev), "\n");
     if ($ev == ZOOM::Event::ZEND) {
         $size = $r[$i-1]->size();
         warn "connection ", $i-1, ": $size hits\n";
         if( $size > 0 ) {
           for( my $num = 0; $num < $limit && $num < $size; $num++) {
             #print $r[$i-1]->record($num)->render()
             my $marc = MARC::Record->new_from_usmarc(  $r[$i-1]->record($num)->raw() );
             warn "downloading record from " . $servers[$i-1] . " with title: " . $marc->title();
             $marc->encoding('UTF-8');
             $records{$servers[$i-1]} .= MARC::File::XML::record($marc);
            }
        }
     }
 }
 foreach my $server (keys %records) {
   $server=~/^(.*)-login-(.*)-pass-(.*)$/;
   $name = $1;
   print "<server name='" . $name . "'>";
   print $records{$server};
   print "</server>";
  }
print MARC::File::XML::footer();
