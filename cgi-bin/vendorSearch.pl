#!/usr/bin/perl
use strict;
use warnings;
use Net::Amazon;
use CGI qw/:all/;
use XML::Writer;
use Cache::File;

my $cgi = new CGI();
my $cache = Cache::File->new(
	cache_root => '/tmp/awscache',
	default_expires => '30 min',
);

my $xmlresponse = '';
my $xmlwriter = new XML::Writer(OUTPUT => \$xmlresponse, NEWLINES=>0);
$xmlwriter->startTag('vendorSearchResp');

my $searchtype = $cgi->param('searchtype');
my $query = $cgi->param('query');
my @vendors = split(' ', $cgi->param('vendors'));

foreach my $vendor (@vendors) {
	if( $vendor eq 'Amazon') {
		# figure out correct power param based on query passed in
		my $powerquer = 'keywords';
		if( $query eq '' ) {
			$powerquer = 'keywords';
		}
		elsif( $query eq 'ti' ) {
			$powerquer = 'title';
		}
		elsif( $query eq 'au' ) {
			$powerquer = 'author';
		}
		elsif ($query eq 'su' ) {
			$powerquer = 'subject';
		}
		elsif ($query eq 'isbn' ) {
			$powerquer = 'isbn';
		}

		my $ua = Net::Amazon->new(
			token => '14RFHHPWH7B3BHDSTDR2',
			max_pages => 2,
			cache => $cache
		);
		my $resp = $ua->search(power => "$powerquer:$query", mode => 'books');
		print $cgi->header( -type => 'text/xml' );
		if( $resp->is_success()) {
			$xmlwriter->startTag('vendor', 'name'=>'Amazon');
			for( $resp->properties() ) {
				$xmlwriter->dataElement('title', $_->title() );
				$xmlwriter->dataElement('author', $_->authors() );
				$xmlwriter->dataElement('publisher', $_->publisher() );
				$xmlwriter->dataElement('pubdate', $_->publication_date() );
				$xmlwriter->dataElement('release_date', $_->ReleaseDate() );
				$xmlwriter->dataElement('image_url_medium', $_->ImageUrlMedium() );
				$xmlwriter->dataElement('price', $_->OurPrice() );
				$xmlwriter->dataElement('description', $_->ProductDescription() );
				$xmlwriter->dataElement('total_offers', $_->TotalOffers() );
				$xmlwriter->dataElement('asin', $_->Asin() );
			}
			$xmlwriter->endTag('vendor');
		}
		else {

		}
	}
}
$xmlwriter->endTag('vendorSearchResp');
$xmlwriter->end();
print $xmlresponse;
