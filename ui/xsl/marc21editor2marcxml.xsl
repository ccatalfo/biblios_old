<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
	xmlns:marc="http://www.loc.gov/MARC21/slim" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:str="http://exslt.org/strings"
	xmlns:exsl="http://exslt.org/common"
	extension-element-prefixes="str exsl"
>
	<xsl:import href="str.split.xsl"/>

	<xsl:output method="xml" indent="yes"/>

	
	<xsl:template match="/">
		<collection xmlns="http://www.loc.gov/MARC21/slim">
			<record>
			<xsl:apply-templates/>	
			</record>
		</collection>	
	</xsl:template>

	<xsl:template name="leader" match="table[@id='fixed_field_all_mat']">
		<leader>
			<xsl:value-of select="//input[@id='RLen']/value"/>			
			<xsl:value-of select="//select[@id='BLvl']/option[@selected='true']"/>			
			<xsl:value-of select="//select[@id='Type']/option[@selected='true']"/>			
		</leader>
	</xsl:template>

	<xsl:template name="controlfields" match="input[starts-with(@id, 'csubfields')]">
		<controlfield>
			<xsl:variable name="tag"><xsl:value-of select="substring(@id, 11, 3)"/></xsl:variable>
			<xsl:attribute name="tag"><xsl:value-of select="$tag"/></xsl:attribute>
				<!--<p>Raw value: <xsl:value-of select="@value"/></p>-->
			<xsl:variable name="sfsplits">
			<xsl:call-template name="str:split">
				<xsl:with-param name="string" select="@value"/>
				<xsl:with-param name="pattern" select="string('&#8225;')"/>
			</xsl:call-template>
			</xsl:variable>
			
			<xsl:for-each select="exsl:node-set($sfsplits)/*">
					<xsl:value-of select="substring(., 2, string-length(.))"/>
			</xsl:for-each>
		</controlfield>	
	</xsl:template>
	

	<xsl:template name="datafields" match="input[starts-with(@id, 'dsubfields')]">
		<datafield>
			<xsl:variable name="tag"><xsl:value-of select="substring(@id, 11, 3)"/></xsl:variable>
			<xsl:variable name="ind1id"><xsl:value-of select="concat('d', 'ind1', $tag)"/></xsl:variable>
			<xsl:variable name="ind2id"><xsl:value-of select="concat('d', 'ind2', $tag)"/></xsl:variable>

			<xsl:attribute name="tag"><xsl:value-of select="$tag"/></xsl:attribute>
			<xsl:attribute name="ind1"><xsl:value-of select="//input[@id=$ind1id]/value"/></xsl:attribute>
			<xsl:attribute name="ind2"><xsl:value-of select="//input[@id=$ind2id]/value"/></xsl:attribute>

			<xsl:variable name="sfsplits">
			<xsl:call-template name="str:split">
				<xsl:with-param name="string" select="@value"/>
				<xsl:with-param name="pattern" select="string('&#8225;')"/>
			</xsl:call-template>
			</xsl:variable>
			
			<xsl:for-each select="exsl:node-set($sfsplits)/*">
				<subfield>
					<xsl:attribute name="code"><xsl:value-of select="substring(., 1, 1)"/></xsl:attribute>
					<xsl:value-of select="substring(., 2, string-length(.))"/>
				</subfield>
			</xsl:for-each>
		</datafield>	
	</xsl:template>
		
	</xsl:stylesheet>
