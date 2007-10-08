#!/usr/bin/perl

# ----------------------------------------------------------------------------------------#
#  Copyright Paul POULAIN
# et Antoine Farnault 2006
# 
#  This file is part of OpenCataloger.
# 
#  OpenCataloger is free software; you can redistribute it and/or modify it under the
#  terms of the GNU General Public License as published by the Free Software
#  Foundation; either version 2 of the License, or (at your option) any later
#  version.
# 
#  OpenCataloger is distributed in the hope that it will be useful, but WITHOUT ANY
#  WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
#  A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
# 
#  You should have received a copy of the GNU General Public License along with
#  OpenCataloger; if not, write to the Free Software Foundation, Inc., 59 Temple Place,
#  Suite 330, Boston, MA  02111-1307 USA
# -----------------------------------------------------------------------------------------#
use strict;
use MARC::File::USMARC;
use MARC::Record;
use MARC::Charset;
use ZOOM;
use CGI;
#use MARC::File::XML;

#koha module
use C4::Context;
use C4::Biblio;

#binmode(STDOUT, "utf-8");

my $input = CGI->new();
my $host        = $input->param('host');        # the server host where to save the record
my $login       = $input->param('login');       # the login to write on this server
my $pass        = $input->param('pass');        # the password to write on this server
my $marcflavour = $input->param('marcflavour'); # marc21 or unimarc
my $recordXML   = $input->param('record');      # the record to save.
my $encoding    = $input->param('encoding');    # the record encoding.

my $dbh = C4::Context->dbh;
# find item MARC tag.
my ($itemtagfield,$itemtagsubfield) = &GetMarcFromKohaField("items.itemnumber",'');
# find biblioMARC tag.
my ($bibliotag,$bibliosubfield) = &GetMarcFromKohaField("biblio.biblionumber",'');
# warn $recordXML;
my $record = MARC::Record->new_from_xml( $recordXML,"utf8",$marcflavour );

## create an empty record object to populate
my $newRecord = MARC::Record->new();
$newRecord->leader($record->leader());
# go through each field in the existing record
foreach my $oldField ( $record->fields() ) {
    # just reproduce tags < 010 in our new record
    #
    # Fields are not necessarily only numeric in the actual world of records
    # nor in what I would recommend for additonal safe non-interfering local
    # use fields.  The following regular expression match is much safer than
    # a numeric evaluation. -- thd
    if ( $oldField->tag() =~ m/^00/ ) {
        $newRecord->append_fields( $oldField );
        next();
    }

    # store our new subfield data in this list
    my @newSubfields = ();

    # go through each subfield code/data pair
    foreach my $pair ( $oldField->subfields() ) {
        #$pair->[1] =~ s/\<//g;
        #$pair->[1] =~ s/\>//g;
        push( @newSubfields, $pair->[0], $pair->[1] ); #char_decode($pair->[1],$char_encoding) );
    }

    # add the new field to our new record
    my $newField = MARC::Field->new(
        $oldField->tag(),
        $oldField->indicator(1),
        $oldField->indicator(2),
        @newSubfields
    );

    $newRecord->append_fields( $newField );
}

my @fields = $newRecord->field($itemtagfield);
my @items;

foreach my $field (@fields) {
    my $item = MARC::Record->new();
    $item->append_fields($field);
    push @items,$item;
    $newRecord->delete_field($field);
}

# now, create or modify biblio and items with Addbiblio call.
my $biblionumber;
if ($bibliotag =~ m/^00/) {
    $biblionumber = $newRecord->field($bibliotag)->data();
} else {
    $biblionumber = $newRecord->subfield($bibliotag,$bibliosubfield);
}

my $biblioitemnumber;
# we have a biblionumber, it's a modif
if ($biblionumber) {
    my ($biblioitemtag,$biblioitemsubfield) = &GetMarcFromKohaField("biblioitems.biblioitemnumber",'');
    $biblioitemnumber = $newRecord->subfield($biblioitemtag,$biblioitemsubfield);
#     warn "OK, I modify : $biblionumber ($bibliotag,$bibliosubfield) / $biblioitemnumber ($biblioitemtag,$biblioitemsubfield) for ".$newRecord->as_formatted;
    ModBiblio($newRecord,$biblionumber,$biblioitemnumber);

# we don't have a biblionumber, it's an add
} else {
#     warn "I add : ".$newRecord->as_formatted;
    ($biblionumber,$biblioitemnumber) = AddBiblio($newRecord,'');
}
for (my $i=0;$i<=$#items;$i++) {
    my $itemnumber =$items[$i]->subfield($itemtagfield,$itemtagsubfield);
    if ($itemnumber) {
        ModItem($items[$i],$biblionumber,$itemnumber);
    } else {
        AddItem($items[$i],$biblionumber,$biblioitemnumber);
    }
}

#return an empty set
print $input->header( -type=>'text/xml' );
print "<?xml version=\"1.0\"?>\n
           <response value=\"done\" />
       </xml>\n";
