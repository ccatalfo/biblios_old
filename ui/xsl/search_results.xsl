<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:marc="http://www.loc.gov/MARC21/slim" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml"/>
	<xsl:param name="id"/>
	
	<xsl:template match="marc:record">
	
		<tr>
			<td>
				<a class="result">
				<xsl:attribute name="href">javascript:openRecord(<xsl:value-of select="$id"/>)</xsl:attribute>
				<xsl:value-of select="marc:datafield[@tag='245']/marc:subfield[@code='a']"></xsl:value-of>
				</a>
				<br/>
			</td>
			<td>
				<xsl:value-of select="marc:datafield[@tag='260']/marc:subfield[@code='b']"/>
			</td>
			<td>
				<xsl:value-of select="marc:datafield[@tag='260']/marc:subfield[@code='c']"/>
			</td>

		</tr>
	</xsl:template>
	
	

</xsl:stylesheet>

