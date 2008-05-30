<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:marc="http://www.loc.gov/MARC21/slim" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html"/>
	
	<xsl:template match="/">
		<html>
			<xsl:apply-templates/>
		</html>
	</xsl:template>
	
	<xsl:template match="marc:record">
		<table>
			<tr>
				<th class='tagnumber'>
					000
				</th>
				<td>
					<span class='subfield'><xsl:value-of select="marc:leader"/></span>
				</td>
			</tr>
			<xsl:apply-templates select="marc:datafield|marc:controlfield"/>
		</table>
	</xsl:template>
	
	<xsl:template match="marc:controlfield">
		<tr>
			<th>
				<span class='tagnumber'><xsl:value-of select="@tag"/></span>
			</th>
			<td>
				<span class='subfield'><xsl:value-of select="."/></span>
			</td>
		</tr>
	</xsl:template>
	
	<xsl:template match="marc:datafield">
		<tr>
			<th>
				<span class='tagnumber'><xsl:value-of select="@tag"/></span>
			</th>
			<td>
                <span class='indicator'>
                    <xsl:choose>
                        <xsl:when test="@ind1 = ' '">
                            <xsl:text>#</xsl:text>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="@ind1"/>
                        </xsl:otherwise>
                    </xsl:choose>
                </span>
                <span class='indicator'>
                    <xsl:choose>
                        <xsl:when test="@ind2 = ' '">
                            <xsl:text>#</xsl:text>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="@ind2"/>
                        </xsl:otherwise>
                    </xsl:choose>
                </span>
				<xsl:apply-templates select="marc:subfield"/>
			</td>
		</tr>
	</xsl:template>
	
	<xsl:template match="marc:subfield">
		<span class='subfield'><span class='subfield-delimiter'>|<xsl:value-of select="@code"/></span> <span class='subfield-text'><xsl:value-of select="."/></span></span>
	</xsl:template>

</xsl:stylesheet>
