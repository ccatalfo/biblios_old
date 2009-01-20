<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
    version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:pz="http://www.indexdata.com/pazpar2/1.0"
    xmlns:marc="http://www.loc.gov/MARC21/slim">

  <xsl:output indent="yes" method="xml" version="1.0" encoding="UTF-8"/>

<!-- Extract metadata from MARC21/USMARC 
      http://www.loc.gov/marc/bibliographic/ecbdhome.html
-->  
  <xsl:include href="pz2-ourl-marc21.xsl" />
  <xsl:include href="xml-to-string.xsl" />
  
  <xsl:template match="/marc:record">
    <xsl:variable name="stringfullrecord">
        <xsl:call-template name="xml-to-string"/>
    </xsl:variable>
    <xsl:variable name="leader" select="marc:leader"/>
    <xsl:variable name="unicodeleader" select="concat( substring($leader,1,9),'a',substring($leader,11,14) )"/>
    <xsl:variable name="fullrecord" select="concat(substring-before($stringfullrecord,$leader),$unicodeleader,substring-after($stringfullrecord,$leader) )"/>

    <xsl:variable name="leader6" select="substring($leader,7,1)"/>
    <xsl:variable name="leader7" select="substring($leader,8,1)"/>
	<xsl:variable name="controlField008" select="marc:controlfield[@tag=008]"/>
	<xsl:variable name="date1" select="substring($controlField008,8,4)"/>
    <xsl:variable name="lccn" select="marc:datafield[@tag='010']/marc:subfield[@code='a']"/>
    <xsl:variable name="isbn" select="marc:datafield[@tag='020']/marc:subfield[@code='a']"/>
    <xsl:variable name="medium">
        <xsl:choose>
            <xsl:when test="$leader6='a'">
                <xsl:choose>
                    <xsl:when test="$leader7='a' or $leader7='c' or $leader7='d' or $leader7='m'">BKS</xsl:when>
                    <xsl:when test="$leader7='b' or $leader7='i' or $leader7='s'">CNR</xsl:when>
                </xsl:choose>
            </xsl:when>
            <xsl:when test="$leader6='t'">BKS</xsl:when>
            <xsl:when test="$leader6='p'">MIX</xsl:when>
            <xsl:when test="$leader6='m'">COM</xsl:when>
            <xsl:when test="$leader6='c' or $leader6='d'">SCO</xsl:when>
            <xsl:when test="$leader6='e' or $leader6='f'">MAP</xsl:when>
            <xsl:when test="$leader6='g' or $leader6='k' or $leader6='o' or $leader6='r'">VIS</xsl:when>
            <xsl:when test="$leader6='i' or $leader6='j'">REC</xsl:when>
        </xsl:choose>
    </xsl:variable>

    <!-- Normalize Strings -->
    <xsl:variable name="oldidentifier">
        <xsl:value-of select="marc:datafield[@tag='035']/marc:subfield[@code='a']"/>
    </xsl:variable>
    <xsl:variable name="numericisbn">
        <xsl:value-of select="translate($isbn, translate($isbn,'0123456789', ''), '')"/>
    </xsl:variable>
    <xsl:variable name="normisbn">
        <xsl:variable name="isbnlength" select="string-length($numericisbn)"/>
        <xsl:choose>
            <xsl:when test="$isbnlength=10">
                <xsl:value-of select="concat('978','',$numericisbn)"/>
            </xsl:when>
            <xsl:otherwise><xsl:value-of select="$numericisbn"/></xsl:otherwise>
        </xsl:choose>
    </xsl:variable>
    <xsl:variable name="normlccn">
        <xsl:value-of select="translate($lccn, translate($isbn,'0123456789', ''), '')"/>
    </xsl:variable>
    <xsl:variable name="normidentifier">
        <xsl:value-of select="translate($oldidentifier, translate($oldidentifier,'0123456789', ''), '')"/>
    </xsl:variable>


    <pz:record>
        <xsl:attribute name="mergekey">
            <xsl:text>normisbn </xsl:text>
            <xsl:value-of select="$normisbn"/>

	<!-- can't currently do boolean OR or weighting, so comemnting these out
            <xsl:text>normlccn </xsl:text>
            <xsl:value-of select="$normlccn"/>
            <xsl:text>normidentifier </xsl:text>
            <xsl:value-of select="$normidentifier"/>
	-->
    <!--
          <xsl:text>controlnumber </xsl:text>
          <xsl:value-of select="marc:controlfield[@tag='001']"/>
      control008 
          <xsl:value-of select="marc:controlfield[@tag='008']"/>
        -->
        <!-- 
            <xsl:text>title </xsl:text>
            <xsl:value-of select="marc:datafield[@tag='245']/marc:subfield[@code='a']"/>
            <xsl:text> author </xsl:text>
            <xsl:value-of select="marc:datafield[@tag='100']/marc:subfield[@code='a']"/>
            <xsl:text> medium </xsl:text>
            <xsl:value-of select="$medium"/>
        -->

        </xsl:attribute>

        <pz:metadata type="id">
            <xsl:text>controlnumber </xsl:text>
            <xsl:value-of select="marc:controlfield[@tag='001']"/>
            <xsl:text>control008 </xsl:text>
            <xsl:value-of select="marc:controlfield[@tag='008']"/>
        </pz:metadata>
        
        <pz:metadata type="fullrecord"><xsl:value-of select="$fullrecord"/></pz:metadata>

        <xsl:for-each select="marc:controlfield[@tag='001']"></xsl:for-each>
        <xsl:for-each select="marc:datafield[@tag='010']">
            <pz:metadata type="lccn">
                <xsl:value-of select="marc:subfield[@code='a']"/>
            </pz:metadata>
        </xsl:for-each>
      
        <xsl:for-each select="marc:datafield[@tag='020']">
            <pz:metadata type="isbn">
                <xsl:value-of select="marc:subfield[@code='a']"/>
            </pz:metadata>
        </xsl:for-each>

        <xsl:for-each select="marc:datafield[@tag='022']">
            <pz:metadata type="issn">
                <xsl:value-of select="marc:subfield[@code='a']"/>
            </pz:metadata>
        </xsl:for-each>

		<pz:metadata type="medium">
        	<xsl:value-of select="$medium"/>
    	</pz:metadata>

      		<xsl:for-each select="marc:datafield[@tag='245']">
		<pz:metadata type="title">
          <!-- TODO: normalize this and use punctuation -->
         	<xsl:value-of select="marc:subfield[@code='a']"/> <xsl:if test="marc:subfield[@code='b']"> <xsl:value-of select="marc:subfield[@code='b']"/></xsl:if>
		</pz:metadata>
      		</xsl:for-each>
		
			<xsl:choose>
    		<xsl:when test="marc:datafield[@tag=100] or marc:datafield[@tag=110] or marc:datafield[@tag=111] or marc:datafield[@tag=700] or marc:datafield[@tag=710] or marc:datafield[@tag=711]">
		<pz:metadata type="author">

			<xsl:for-each select="marc:datafield[@tag=100 or @tag=700 or @tag=110 or @tag=710 or @tag=111 or @tag=711]">
			<xsl:value-of select="marc:subfield[@code='a']"/>
			<xsl:choose><xsl:when test="position()=last()"><xsl:text>. </xsl:text></xsl:when><xsl:otherwise><xsl:text>; </xsl:text></xsl:otherwise></xsl:choose>
			</xsl:for-each>

	 	</pz:metadata>
    		</xsl:when>
			</xsl:choose>

			<xsl:for-each select="marc:datafield[@tag='260']">
        <pz:metadata type="publication-name">
      		<xsl:value-of select="marc:subfield[@code='b']"/>
    	</pz:metadata>
      		</xsl:for-each>

    	<pz:metadata type="date">
		<!-- TODO: if date1 is completely numeric else use another field -->
        <xsl:value-of select="$date1"/>
    	</pz:metadata>

    </pz:record>

  </xsl:template>

</xsl:stylesheet>
