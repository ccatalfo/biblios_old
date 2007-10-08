#!/usr/bin/perl
use warnings;
use CGI;
use ZOOM;
use MARC::File::XML;
use MARC::Record;

my $cgi = new CGI;
my $encoding = 'UTF-8';
my $attr = $cgi->param('attr');
my $search = $cgi->param('search');
my $block = '10';
my $conn;
my $rs;

print $cgi->header(
    -type    =>'text/xml',
    -charset =>$encoding
);
print MARC::File::XML::header();
#print "<server name=\"z3950.loc.gov\">\n";

eval {
	$conn = new ZOOM::Connection("z3950.loc.gov", "7090", databaseName=>"Voyager");
	$conn->option(preferredRecordSyntax => "usmarc");
	$rs = $conn->search_pqf('@attr' . " 1=$attr $search" );
	my $n = $rs->size();
	if($n == 1) {
		print "<div id=\"results\">Sorry, no results found.</div>";
		exit(1);
	}
	$rs->records(0, $block, 0);
	for my $i (0 .. $block) {
		my $rec = $rs->record_immediate($i)->raw();
		my $mrec = MARC::Record->new_from_usmarc($rec);
		$mrec->encoding('UTF-8');
		print MARC::File::XML::record($mrec);
	}

};

#print "\n</server>\n";
print MARC::File::XML::footer();
