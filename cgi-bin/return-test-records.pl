#!/usr/bin/perl
use File::Slurp;
use CGI;
use MARC::File::XML;

print CGI->header(-type => "text/xml");
$xml = <<XML;
<?xml version="1.0" encoding="UTF-8"?>
<collection
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.loc.gov/MARC21/slim http://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd"
  xmlns="http://www.loc.gov/MARC21/slim">
<record>
  <leader>01951cmm a2200337 a 4500</leader>
  <controlfield tag="001">5003946</controlfield>
  <controlfield tag="005">20060303082740.0</controlfield>
  <controlfield tag="008">970701s1995    cau    c   m        eng  </controlfield>
  <datafield tag="035" ind1=" " ind2=" ">
    <subfield code="9">(DLC)   97802583</subfield>
  </datafield>
  <datafield tag="906" ind1=" " ind2=" ">
    <subfield code="a">7</subfield>
    <subfield code="b">cbc</subfield>
    <subfield code="c">orignew</subfield>
    <subfield code="d">u</subfield>
    <subfield code="e">ncip</subfield>
    <subfield code="f">19</subfield>
    <subfield code="g">y-gencompf</subfield>
  </datafield>
  <datafield tag="955" ind1=" " ind2=" ">
    <subfield code="a">vb25 07-01-97; vb22 to jd00/lb00 07-07-97; jd99 (subj) 07-09-97; lb09 07-11-97;</subfield>
    <subfield code="a">vb30 2002-12-19 added 130 (rev vb02 2002-12-19)</subfield>
  </datafield>
  <datafield tag="010" ind1=" " ind2=" ">
    <subfield code="a">   97802583 </subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="a">1569972133</subfield>
  </datafield>
  <datafield tag="040" ind1=" " ind2=" ">
    <subfield code="a">DLC</subfield>
    <subfield code="c">DLC</subfield>
    <subfield code="d">DLC</subfield>
  </datafield>
  <datafield tag="050" ind1="0" ind2="0">
    <subfield code="a">QE862.D5</subfield>
  </datafield>
  <datafield tag="082" ind1="1" ind2="0">
    <subfield code="a">567.9</subfield>
    <subfield code="2">12</subfield>
  </datafield>
  <datafield tag="130" ind1="0" ind2=" ">
    <subfield code="a">Dinosaur adventure 3-D</subfield>
  </datafield>
  <datafield tag="245" ind1="1" ind2="0">
    <subfield code="a">3-D dinosaur adventure</subfield>
    <subfield code="h">[computer file].</subfield>
  </datafield>
  <datafield tag="246" ind1="3" ind2=" ">
    <subfield code="a">Three-dimensional dinosaur adventure</subfield>
  </datafield>
  <datafield tag="256" ind1=" " ind2=" ">
    <subfield code="a">Computer data and program.</subfield>
  </datafield>
  <datafield tag="260" ind1=" " ind2=" ">
    <subfield code="a">Glendale, CA :</subfield>
    <subfield code="b">Knowledge Adventure,</subfield>
    <subfield code="c">c1995.</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">1 computer laser optical disc ;</subfield>
    <subfield code="c">4 3/4 in. +</subfield>
    <subfield code="e">1 user's guide + 1 quick reference guide + 2 pairs of three-dimensional eyeglasses.</subfield>
  </datafield>
  <datafield tag="538" ind1=" " ind2=" ">
    <subfield code="a">System requirements for PC: 486SX/25MHz processor or higher; 8MB RAM; Windows 3.1, 3.11, or 95; SVGA 256-color graphics adapter; hard drive with 5MB free space; double-speed CD-ROM drive; MPC-compatible sound card; mouse.</subfield>
  </datafield>
  <datafield tag="538" ind1=" " ind2=" ">
    <subfield code="a">System requirements for Macintosh: 68040 or Power PC processor; 8MB RAM; System 7.0 or higher; 256-color graphics capability; thirteen-inch color monitor or larger; hard drive with 4MB free space; double-speed CD-ROM drive.</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Title from disc label.</subfield>
  </datafield>
  <datafield tag="521" ind1=" " ind2=" ">
    <subfield code="a">Ages 5 to 10.</subfield>
  </datafield>
  <datafield tag="520" ind1=" " ind2=" ">
    <subfield code="a">Employs a dinosaur theme-park setting to introduce users to Triassic, Jurassic, and Cretaceous periods. Features hypertext dinosaur encyclopedia covering 150 million years of paleontology. Includes animated video simulations, three-dimensional dinosaur museum, narration, games, activities, and color illustrations.</subfield>
  </datafield>
  <datafield tag="650" ind1=" " ind2="0">
    <subfield code="a">Dinosaurs</subfield>
    <subfield code="x">Juvenile software.</subfield>
  </datafield>
  <datafield tag="650" ind1=" " ind2="1">
    <subfield code="a">Dinosaurs.</subfield>
  </datafield>
  <datafield tag="710" ind1="2" ind2=" ">
    <subfield code="a">Knowledge Adventure, Inc.</subfield>
  </datafield>
  <datafield tag="991" ind1=" " ind2=" ">
    <subfield code="b">c-MRC</subfield>
    <subfield code="h">QE862.D5</subfield>
    <subfield code="i">[1997 00560]</subfield>
    <subfield code="t">Copy 1</subfield>
    <subfield code="w">CF</subfield>
  </datafield>
</record>

<record>
  <leader>01718cjm a22003971a 4500</leader>
  <controlfield tag="001">13463061</controlfield>
  <controlfield tag="005">20051217130827.0</controlfield>
  <controlfield tag="007">sd fsngnnmmned</controlfield>
  <controlfield tag="008">040120r19961983caurcn              eng d</controlfield>
  <datafield tag="024" ind1="1" ind2=" ">
    <subfield code="a">076744000422</subfield>
  </datafield>
  <datafield tag="035" ind1=" " ind2=" ">
    <subfield code="a">(DLC)   2004567544</subfield>
  </datafield>
  <datafield tag="040" ind1=" " ind2=" ">
    <subfield code="a">KFW</subfield>
    <subfield code="c">KFW</subfield>
    <subfield code="d">IEP</subfield>
    <subfield code="d">OCLCQ</subfield>
    <subfield code="d">DLC</subfield>
  </datafield>
  <datafield tag="020" ind1=" " ind2=" ">
    <subfield code="c">$17.98</subfield>
  </datafield>
  <datafield tag="024" ind1="1" ind2="0">
    <subfield code="a">076744000422</subfield>
  </datafield>
  <datafield tag="028" ind1="0" ind2="2">
    <subfield code="a">HIPD 40004</subfield>
    <subfield code="b">Hip-O Records</subfield>
  </datafield>
  <datafield tag="028" ind1="0" ind2="2">
    <subfield code="a">40004-2</subfield>
    <subfield code="b">Hip-O Records</subfield>
  </datafield>
  <datafield tag="035" ind1=" " ind2=" ">
    <subfield code="a">(OCoLC)ocm35640234 </subfield>
  </datafield>
  <datafield tag="028" ind1="0" ind2="2">
    <subfield code="a">HIPD-40004</subfield>
    <subfield code="b">Hip-O Records</subfield>
  </datafield>
  <datafield tag="010" ind1=" " ind2=" ">
    <subfield code="a">  2004567544</subfield>
  </datafield>
  <datafield tag="042" ind1=" " ind2=" ">
    <subfield code="a">lcderive</subfield>
  </datafield>
  <datafield tag="050" ind1="0" ind2="0">
    <subfield code="a">SDA 85496</subfield>
  </datafield>
  <datafield tag="245" ind1="0" ind2="4">
    <subfield code="a">The '80s hit(s) back!</subfield>
    <subfield code="h">[sound recording].</subfield>
  </datafield>
  <datafield tag="246" ind1="3" ind2=" ">
    <subfield code="a">Eighty's hit(s) back!</subfield>
  </datafield>
  <datafield tag="260" ind1=" " ind2=" ">
    <subfield code="a">Universal City, Calif. :</subfield>
    <subfield code="b">Hip-O Records,</subfield>
    <subfield code="c">p1996.</subfield>
  </datafield>
  <datafield tag="300" ind1=" " ind2=" ">
    <subfield code="a">1 sound disc :</subfield>
    <subfield code="b">digital ;</subfield>
    <subfield code="c">4 3/4 in.</subfield>
  </datafield>
  <datafield tag="511" ind1="0" ind2=" ">
    <subfield code="a">Various performers.</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Selections previously released 1983-1988.</subfield>
  </datafield>
  <datafield tag="500" ind1=" " ind2=" ">
    <subfield code="a">Compact disc.</subfield>
  </datafield>
  <datafield tag="505" ind1="0" ind2=" ">
    <subfield code="a">She drives me crazy (Fine Young Cannibals) -- Walk the dinosaur (Was (Not Was)) -- You keep me hangin' on (Kim Wilde) -- The safety dance (Men Without Hats) -- Walking on sunshine (Katrina &amp; The Waves) -- One thing leads to another (The Fixx) -- Heaven is a place on earth (Belinda Carlisle) -- Everybody have fun tonight (Wang Chung) -- Cruel summer (Bananarama) -- Weird science (Oingo Boingo) -- Axel F (Harold Faltermeyer) -- The future's so bright, I gotta wear shades (Timbuk 3).</subfield>
  </datafield>
  <datafield tag="650" ind1=" " ind2="0">
    <subfield code="a">Rock music</subfield>
    <subfield code="y">1981-1990.</subfield>
  </datafield>
  <datafield tag="655" ind1=" " ind2="7">
    <subfield code="a">Compact discs.</subfield>
    <subfield code="2">lcsh</subfield>
  </datafield>
  <datafield tag="906" ind1=" " ind2=" ">
    <subfield code="a">7</subfield>
    <subfield code="b">cbc</subfield>
    <subfield code="c">copycat</subfield>
    <subfield code="d">3</subfield>
    <subfield code="e">ncip</subfield>
    <subfield code="f">20</subfield>
    <subfield code="g">y-genmusic</subfield>
  </datafield>
  <datafield tag="925" ind1="0" ind2=" ">
    <subfield code="a">acquire</subfield>
    <subfield code="b">2 copies</subfield>
    <subfield code="x">policy default</subfield>
  </datafield>
  <datafield tag="952" ind1=" " ind2=" ">
    <subfield code="a">muzerec</subfield>
  </datafield>
  <datafield tag="955" ind1=" " ind2=" ">
    <subfield code="a">vn76 2004-01-20 to MBRS/RS</subfield>
    <subfield code="e">vn76 2004-01-20 copy 2 to MBRS/RS</subfield>
  </datafield>
  <datafield tag="985" ind1=" " ind2=" ">
    <subfield code="c">OCLC</subfield>
    <subfield code="e">srreplace 2005-08</subfield>
  </datafield>
</record>

</collection>

XML

print $xml;

