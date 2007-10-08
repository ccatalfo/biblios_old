<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:marc="http://www.loc.gov/MARC21/slim" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html"/>
	
	<xsl:template match="/">
               <html>
			<xsl:apply-templates/>
               </html>
	</xsl:template>
	
	<xsl:template match="marc:record">
<form action='' id='_editor' name='_editor'>
		<table>
			<tr>
				<th NOWRAP="TRUE" ALIGN="RIGHT" VALIGN="TOP">
                                        000
				</th>
				<td>
					<xsl:value-of select="marc:leader"/>
				</td>
			</tr>
                            <xsl:apply-templates select="marc:datafield|marc:controlfield"/> 
		</table>
</form>
	</xsl:template>
	
	<xsl:template match="marc:controlfield">
		<tr>
			<th NOWRAP="TRUE" ALIGN="RIGHT" VALIGN="TOP">
                            <a href="">
                               <xsl:value-of select="@tag"/></a>
			</th>
			<td>
                <input id='{@tag}' value='{.}' size='50' type='text'/>
                <a href='javascript:addField();'>(+)</a> <a href = 'javascript:removeField();'>(-)</a><br />
			</td>
		</tr>
	</xsl:template>
	
	<xsl:template match="marc:datafield">
		<tr>
			<th NOWRAP="TRUE" ALIGN="RIGHT" VALIGN="TOP">
                            <a href=""> 
                               <xsl:value-of select="@tag"/></a>

			</th>
			<td>
				<xsl:apply-templates select="marc:subfield"/>
			</td>
		</tr>
	</xsl:template>
	
        <xsl:template match="marc:subfield">
            <strong>|<a href="javascript:;" onmouseover=''>
            <xsl:value-of select="@code"/></a>| </strong> 
            <input id='{../@tag}{@code}' value='{.}' size='50' type='text'/>
            <a href='javascript:addField();'>(+)</a>
	    <a href='javascript:removeField();'>(-)</a><br />  
        </xsl:template>

</xsl:stylesheet>
