<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:marc="http://www.loc.gov/MARC21/slim" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" indent="yes"/>
	<xsl:variable name='marc21defs' select="document('marc21.xml')"/>

	<xsl:template match="/">
        <div id='varfields_editor'>
            <div id='home'> </div>
			<xsl:apply-templates/>
        </div>
	</xsl:template>
	
	<xsl:template match="marc:record">
		    <xsl:apply-templates select="marc:leader|marc:datafield|marc:controlfield"/>
	</xsl:template>

	<xsl:template match="marc:leader">
        <div class="tag" id="000">
        <span class='tagnumber' id='c000'>ldr </span>

        <span class="indicator">
                <xsl:attribute name="id">cind1<xsl:value-of select="000"/>-<xsl:number value="position()"/></xsl:attribute>#</span>
        <span class="indicator">
                <xsl:attribute name="id">cind2<xsl:value-of select="000"/>-<xsl:number value="position()"/></xsl:attribute>#</span>
            <span style='width: 150px;' class='controlfield' id='csubfields000'><xsl:value-of select="."/></span>
        </div>
		
	</xsl:template>
	
	<xsl:template match="marc:controlfield">
        <div class="tag" id="{@tag}">
        <span class='tagnumber' id='c{@tag}'><xsl:value-of select="@tag"/></span>

        <span class="indicator">
                <xsl:attribute name="id">cind1<xsl:value-of select="@tag"/>-<xsl:number value="position()"/></xsl:attribute>#</span>
        <span class="indicator">
                <xsl:attribute name="id">cind2<xsl:value-of select="@tag"/>-<xsl:number value="position()"/></xsl:attribute>#</span>
            <span style='width: 150px;' class='controlfield' id='csubfields{@tag}'><xsl:value-of select="."/></span>
        </div>
    
	</xsl:template>

	<xsl:template match="marc:datafield">
        
    
        <div class="tag">
            <!-- provide an id based on tag number, but append a number to duplicate tags don't have duplicate id's -->
            <xsl:attribute name="id"><xsl:value-of select="@tag"/>-<xsl:number value="position()"/></xsl:attribute>
        <span class='tagnumber' id='d{@tag}'><xsl:value-of select="@tag"/></span>

        <span class="indicator">
                <!-- provide an id based on tag number, but append a number to duplicate tags don't have duplicate id's -->
                <xsl:attribute name="id">dind1<xsl:value-of select="@tag"/>-<xsl:number value="position()"/></xsl:attribute><xsl:choose><xsl:when test="@ind1 = ' '">#</xsl:when><xsl:otherwise><xsl:value-of select="@ind1"/></xsl:otherwise></xsl:choose>
        </span>
        <span class="indicator">
                <!-- provide an id based on tag number, but append a number to duplicate tags don't have duplicate id's -->
                <xsl:attribute name="id">dind2<xsl:value-of select="@tag"/>-<xsl:number value="position()"/></xsl:attribute><xsl:choose><xsl:when test="@ind2 = ' '">#</xsl:when><xsl:otherwise><xsl:value-of select="@ind2"/></xsl:otherwise></xsl:choose>
        </span>
            <span style='width: 150px;' class='subfields'>
                <!-- provide an id based on tag number, but append a number to duplicate tags don't have duplicate id's -->
                <xsl:attribute name="id">dsubfields<xsl:value-of select="@tag"/>-<xsl:number value="position()"/></xsl:attribute>
                <xsl:apply-templates select="marc:subfield"/>
            </span>
        </div>
    
	</xsl:template>
	
    <xsl:template match="marc:subfield">
        <span class="subfield"><xsl:attribute name="id"><xsl:value-of select="../@tag"/>-<xsl:number value="position()"/><xsl:value-of select="@code"/></xsl:attribute>
          <span class="subfield-delimiter">&#8225;<xsl:value-of select="@code"/></span><span class="subfield-text"><xsl:value-of select="."/></span></span>
    </xsl:template>

</xsl:stylesheet>
