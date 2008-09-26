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
                <tr><xsl:for-each select="//marc:leader">
                    <xsl:call-template name="leader"/>
                </xsl:for-each>
                </tr>
                <tr>
                <xsl:for-each select="//marc:controlfield[@tag='006']">
                    <xsl:call-template name="tag006"/>
                </xsl:for-each>
                </tr>
                <tr>
                <xsl:for-each select="//marc:controlfield[@tag='007']">
                    <xsl:call-template name="tag007"/>
                </xsl:for-each>
                </tr>
                <xsl:for-each select="//marc:controlfield[@tag='008']">
                <tr>
                    <xsl:call-template name="generate_for_rectype">
                        <xsl:with-param name="rectype">All</xsl:with-param>
                        <xsl:with-param name="offset">0</xsl:with-param>
                        <xsl:with-param name='tag' select="marc:controlfield[@tag='008']"/>
                    </xsl:call-template>
                </tr>
            <xsl:if test="$rectype = 'a' or $rectype = 't'">
                <tr>
                    <xsl:call-template name="generate_for_rectype">
                        <xsl:with-param name="rectype">Books</xsl:with-param>
                        <xsl:with-param name="offset">0</xsl:with-param>
                        <xsl:with-param name='tag' select="$tag008"/>
                    </xsl:call-template>
                </tr>
            </xsl:if>

            <!-- 008 fixed fields for computer files -->
            <xsl:if test="$rectype = 'm'">
            <tr>
                <xsl:call-template name="generate_for_rectype">
                    <xsl:with-param name="rectype">ComputerFile</xsl:with-param>
                    <xsl:with-param name="offset">0</xsl:with-param>
                    <xsl:with-param name='tag' select="$tag008"/>
                </xsl:call-template>
            </tr>
            </xsl:if>
                        
            <!-- 008 fixed fields for Cartographic materials -->
            <xsl:if test="$rectype = 'e' or $rectype = 'f'">
            <tr>
                    <xsl:call-template name="generate_for_rectype">
                        <xsl:with-param name="rectype">Maps</xsl:with-param>
                        <xsl:with-param name="offset">0</xsl:with-param>
                        <xsl:with-param name='tag' select="$tag008"/>
                    </xsl:call-template>
            </tr>
            </xsl:if>

            <!-- 008 fixed fields for music materials -->
            <xsl:if test="$rectype = 'c' or $rectype = 'd' or $rectype = 'j' or $rectype = 'i'">
            <tr>
                    <xsl:call-template name="generate_for_rectype">
                        <xsl:with-param name="rectype">Music</xsl:with-param>
                        <xsl:with-param name="offset">0</xsl:with-param>
                        <xsl:with-param name='tag' select="$tag008"/>
                    </xsl:call-template>
            </tr>
            </xsl:if>
            <!-- 008 fixed fields for visual materials -->
            <xsl:if test="$rectype = 'g' or $rectype = 'k' or $rectype = 'o' or $rectype = 'r'">
            <tr>
                    <xsl:call-template name="generate_for_rectype">
                        <xsl:with-param name="rectype">Visual</xsl:with-param>
                        <xsl:with-param name="offset">0</xsl:with-param>
                        <xsl:with-param name='tag' select="$tag008"/>
                    </xsl:call-template>
            </tr>
            </xsl:if>
            <!-- 008 fixed fields for mixed materials -->
            <xsl:if test="$rectype = 'p'">
            <tr>
                    <xsl:call-template name="generate_for_rectype">
                        <xsl:with-param name="rectype">Mixed</xsl:with-param>
                        <xsl:with-param name="offset">0</xsl:with-param>
                        <xsl:with-param name='tag' select="$tag008"/>
                    </xsl:call-template>
            </tr>
            </xsl:if>
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
