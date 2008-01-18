<?xml version="1.0" encoding="UTF-8"?>
<!--
    $Id: oai_dc.xsl,v 1.1 2007-07-18 14:19:03 adam Exp $

    This stylesheet expects oai/dc records
-->
<xsl:stylesheet
    version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:pz="http://www.indexdata.com/pazpar2/1.0"
    xmlns:oai="http://www.openarchives.org/OAI/2.0/"
    xmlns:dc="http://purl.org/dc/elements/1.1/">

 <xsl:output indent="yes"
        method="xml"
        version="1.0"
        encoding="UTF-8"/>



  <xsl:template match="/oai:record/oai:metadata/*">
    <pz:record>

      <xsl:attribute name="mergekey">
        <xsl:text>title </xsl:text>
	<xsl:value-of select="dc:title[1]"/>
	<xsl:text> author </xsl:text>
	<xsl:value-of select="dc:creator[1]"/>
      </xsl:attribute>

      <pz:metadata type="id">
        <xsl:value-of select="/oai:record/oai:header/oai:identifier"/>
      </pz:metadata>

      <xsl:for-each select="dc:title">
        <pz:metadata type="title">
          <xsl:value-of select="."/>
        </pz:metadata>
      </xsl:for-each>

      <xsl:for-each select="dc:date">
        <pz:metadata type="date">
	  <xsl:value-of select="."/>
	</pz:metadata>
      </xsl:for-each>

      <xsl:for-each select="dc:subject">
        <pz:metadata type="subject">
	  <xsl:value-of select="."/>
	</pz:metadata>
      </xsl:for-each>

      <xsl:for-each select="dc:creator">
	<pz:metadata type="author">
          <xsl:value-of select="."/>
	</pz:metadata>
      </xsl:for-each>

      <xsl:for-each select="dc:description">
        <pz:metadata type="description">
	  <xsl:value-of select="."/>
	</pz:metadata>
      </xsl:for-each>

    </pz:record>
  </xsl:template>


  <xsl:template match="text()"/>

</xsl:stylesheet>
