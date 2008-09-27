<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:marc="http://www.loc.gov/MARC21/slim" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="">
    <xsl:import href="fixedfields_editor.xsl"/>
    <xsl:import href="varfields_inputboxes.xsl"/>
    <xsl:output method="html"/>
	<xsl:param name='debug'/>
	<xsl:param name='editorid'/>
    <xsl:template match="marc:record">
    <xsl:variable name='leader' select="marc:leader"/>
    <xsl:variable name='tag008' select="marc:controlfield[@tag='008']"/>
    <xsl:variable name="rectype" select="substring($leader, $marc21defs//value[@name='Type']/@position+1, $marc21defs//value[@name='Type']/@length)"/>
    <div class="ffeditor">
        <div class="fixedfields_editor">
            <table id="fixed_field_grid" class="fixed_field">
                <xsl:for-each select="//marc:leader">
                <tr>
                    <xsl:call-template name="leader"/>
                </tr>
                </xsl:for-each>
                <xsl:for-each select="//marc:controlfield[@tag='006']">
                    <tr>
                    <xsl:call-template name="tag006"/>
                    </tr>
                </xsl:for-each>
                <xsl:for-each select="//marc:controlfield[@tag='007']">
                    <tr>
                    <xsl:call-template name="tag007"/>
                    </tr>
                </xsl:for-each>
                <xsl:for-each select="//marc:controlfield[@tag='008']">
                    <xsl:call-template name="tag008">
                        <xsl:with-param name="rectype" select="$rectype"/>
                        <xsl:with-param name="tag" select="."></xsl:with-param>
                    </xsl:call-template>
                </xsl:for-each>
            </table>
        </div>
    </div>
    <div class="vareditor">
        <div class="varfields_editor">
            <xsl:call-template name="varfields_editor"/>
        </div>
    </div> 
    </xsl:template>
</xsl:stylesheet>
