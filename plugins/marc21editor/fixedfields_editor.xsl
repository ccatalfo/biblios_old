<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:marc="http://www.loc.gov/MARC21/slim" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" indent="yes"/>
	<xsl:variable name='marc21defs' select="document('marc21.xml')"/>
	<xsl:param name='debug'/>

    <xsl:template match="/">
        <xsl:variable name='leader'><xsl:value-of select="."/></xsl:variable>
        <xsl:variable name='tag008'><xsl:value-of select="marc:controlfield[@tag='008']"/></xsl:variable> 
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
                        <tr class="006">
                        <xsl:call-template name="tag006"/>
                        </tr>
                    </xsl:for-each>
                    <xsl:for-each select="//marc:controlfield[@tag='007']">
                        <tr class="007">
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
    </xsl:template>

	<xsl:template name="generate_for_rectype">
		<xsl:param name="rectype">All</xsl:param>
		<xsl:param name="offset">0</xsl:param>
		<xsl:param name="tag"></xsl:param>
		<xsl:param name="tagnumber">008</xsl:param>
			<xsl:for-each select="$marc21defs//mattypes/mattype[@value=$rectype]/position">
				<xsl:variable name="name" select="string(.)"/>
				<xsl:variable name="inputtype" select="$marc21defs//field[@tag=$tagnumber]/value[@name=$name]/@inputtype"/>
					<xsl:choose>
						<xsl:when test="$inputtype = 'textbox'">	
							<xsl:call-template name="fixed-field-text">
								<xsl:with-param name="name" select="." />
								<xsl:with-param name="tagnumber" select="$tagnumber" />
								<xsl:with-param name="tag"><xsl:value-of select="$tag"/></xsl:with-param>
								<xsl:with-param name="offset"><xsl:value-of select="$offset"/></xsl:with-param>
							</xsl:call-template>

						</xsl:when>
						<xsl:when test="$inputtype = 'hidden'">	
							<xsl:call-template name="fixed-field-text">
								<xsl:with-param name="name" select="." />
								<xsl:with-param name="tagnumber" select="$tagnumber" />
								<xsl:with-param name="tag"><xsl:value-of select="$tag"/></xsl:with-param>
								<xsl:with-param name="offset"><xsl:value-of select="$offset"/></xsl:with-param>
                                <xsl:with-param name="hidden" select="1"/>
							</xsl:call-template>

						</xsl:when>
                        <xsl:when test="$inputtype = 'blank'">

                        </xsl:when>
						<xsl:otherwise>
							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="." />
								<xsl:with-param name="tagnumber" select="$tagnumber" />
								<xsl:with-param name="tag"><xsl:value-of select="$tag"/></xsl:with-param>
                                <xsl:with-param name='tagnumber' select="$tagnumber"/>
								<xsl:with-param name="offset"><xsl:value-of select="$offset"/></xsl:with-param>
							</xsl:call-template>
						</xsl:otherwise>
					</xsl:choose>	
			</xsl:for-each>
	</xsl:template>

    <xsl:template name="tag008">
    <xsl:param name="rectype"/>
    <xsl:param name="tag"/>
        <tr>
        <!-- 008 fixed fields for all material types -->
                <xsl:call-template name="generate_for_rectype">
                    <xsl:with-param name="rectype">008All00-17</xsl:with-param>
                    <xsl:with-param name="offset">0</xsl:with-param>
                    <xsl:with-param name='tag' select="$tag"/>
                    <xsl:with-param name='tagnumber'>008</xsl:with-param>
                </xsl:call-template>
                <xsl:call-template name="generate_for_rectype">
                    <xsl:with-param name="rectype">008All35-39</xsl:with-param>
                    <xsl:with-param name="offset">0</xsl:with-param>
                    <xsl:with-param name='tag' select="$tag"/>
                    <xsl:with-param name='tagnumber'>008</xsl:with-param>
                </xsl:call-template>
        </tr>
        <!-- 008 fixed fields for Books -->
        <tr>
        <xsl:if test="$rectype = 'a' or $rectype = 't'">
                <xsl:call-template name="generate_for_rectype">
                    <xsl:with-param name="rectype">Books</xsl:with-param>
                    <xsl:with-param name="offset">0</xsl:with-param>
                    <xsl:with-param name='tag' select="$tag"/>
                    <xsl:with-param name='tagnumber'>008</xsl:with-param>
                </xsl:call-template>
        </xsl:if>

        <!-- 008 fixed fields for computer files -->
        <xsl:if test="$rectype = 'm'">
            <xsl:call-template name="generate_for_rectype">
                <xsl:with-param name="rectype">ComputerFile</xsl:with-param>
                <xsl:with-param name="offset">0</xsl:with-param>
                <xsl:with-param name='tag' select="$tag"/>
                <xsl:with-param name='tagnumber'>008</xsl:with-param>
            </xsl:call-template>
        </xsl:if>
                    
        <!-- 008 fixed fields for Cartographic materials -->
        <xsl:if test="$rectype = 'e' or $rectype = 'f'">
                <xsl:call-template name="generate_for_rectype">
                    <xsl:with-param name="rectype">Maps</xsl:with-param>
                    <xsl:with-param name="offset">0</xsl:with-param>
                    <xsl:with-param name='tag' select="$tag"/>
                    <xsl:with-param name='tagnumber'>008</xsl:with-param>
                </xsl:call-template>
        </xsl:if>

        <!-- 008 fixed fields for music materials -->
        <xsl:if test="$rectype = 'c' or $rectype = 'd' or $rectype = 'j' or $rectype = 'i'">
                <xsl:call-template name="generate_for_rectype">
                    <xsl:with-param name="rectype">Music</xsl:with-param>
                    <xsl:with-param name="offset">0</xsl:with-param>
                    <xsl:with-param name='tag' select="$tag"/>
                    <xsl:with-param name='tagnumber'>008</xsl:with-param>
                </xsl:call-template>
        </xsl:if>
        <!-- 008 fixed fields for visual materials -->
        <xsl:if test="$rectype = 'g' or $rectype = 'k' or $rectype = 'o' or $rectype = 'r'">
                <xsl:call-template name="generate_for_rectype">
                    <xsl:with-param name="rectype">Visual</xsl:with-param>
                    <xsl:with-param name="offset">0</xsl:with-param>
                    <xsl:with-param name='tag' select="$tag"/>
                    <xsl:with-param name='tagnumber'>008</xsl:with-param>
                </xsl:call-template>
        </xsl:if>
        <!-- 008 fixed fields for mixed materials -->
        <xsl:if test="$rectype = 'p'">
                <xsl:call-template name="generate_for_rectype">
                    <xsl:with-param name="rectype">Mixed</xsl:with-param>
                    <xsl:with-param name="offset">0</xsl:with-param>
                    <xsl:with-param name='tag' select="$tag"/>
                    <xsl:with-param name='tagnumber'>008</xsl:with-param>
                </xsl:call-template>
        </xsl:if>
        </tr>
    </xsl:template>

	<xsl:template name="tag006">
			<xsl:variable name="form" select="substring(.,1, 1)"/>
			<xsl:if test="$form = 'a' or $form = 't'">
				<xsl:call-template name="generate_for_rectype">
					<xsl:with-param name="rectype">Books</xsl:with-param>
					<xsl:with-param name="offset">17</xsl:with-param>
					<xsl:with-param name='tag' select="."/>
					<xsl:with-param name='tagnumber'>006</xsl:with-param>
				</xsl:call-template>
			</xsl:if>
			<xsl:if test="$form = 'e' or $form = 'f'">
				<xsl:call-template name="generate_for_rectype">
					<xsl:with-param name="rectype">Maps</xsl:with-param>
					<xsl:with-param name="offset">17</xsl:with-param>
					<xsl:with-param name='tag' select="."/>
					<xsl:with-param name='tagnumber'>006</xsl:with-param>
				</xsl:call-template>
			</xsl:if>
			<xsl:if test="$form = 'c' or $form = 'd' or $form = 'j' or $form = 'i'">
				<xsl:call-template name="generate_for_rectype">
					<xsl:with-param name="rectype">Music</xsl:with-param>
					<xsl:with-param name="offset">17</xsl:with-param>
					<xsl:with-param name='tag' select="."/>
					<xsl:with-param name='tagnumber'>006</xsl:with-param>
				</xsl:call-template>
			</xsl:if>
			<xsl:if test="$form = 'g' or $form = 'k' or $form = 'o' or $form = 'r'">
					<xsl:call-template name="generate_for_rectype">
						<xsl:with-param name="rectype">Visual</xsl:with-param>
						<xsl:with-param name="offset">17</xsl:with-param>
						<xsl:with-param name='tag' select="."/>
                        <xsl:with-param name='tagnumber'>006</xsl:with-param>
					</xsl:call-template>
			</xsl:if>
			<xsl:if test="$form = 'm'">
				<xsl:call-template name="generate_for_rectype">
					<xsl:with-param name="rectype">ComputerFile</xsl:with-param>
					<xsl:with-param name="offset">17</xsl:with-param>
					<xsl:with-param name='tag' select="."/>
                    <xsl:with-param name='tagnumber'>006</xsl:with-param>
				</xsl:call-template>
			</xsl:if>
			<xsl:if test="$form = 'p'">
					<xsl:call-template name="generate_for_rectype">
						<xsl:with-param name="rectype">Mixed</xsl:with-param>
						<xsl:with-param name="offset">17</xsl:with-param>
						<xsl:with-param name='tag' select="."/>
                        <xsl:with-param name='tagnumber'>006</xsl:with-param>
					</xsl:call-template>
			</xsl:if>
	</xsl:template>
	<!-- 007s -->
	<xsl:template name="tag007">
            <xsl:variable name="tag007"><xsl:value-of select="."/></xsl:variable>
			<xsl:variable name="cat" select="substring(.,1, 1)"/>
            <xsl:variable name="mattype" select="$marc21defs//categoryname007/cat[@type=$cat]"/>
            <xsl:for-each select="$marc21defs//field[@tag='007'][@mattype=$mattype]">
                <xsl:for-each select="value">
                    <xsl:choose>
                        <xsl:when test="@inputtype='menubox'">
                            <xsl:call-template name="fixed-field-select">
                                <xsl:with-param name="name"><xsl:value-of select="@name"/></xsl:with-param>
                                <xsl:with-param name="position"><xsl:value-of select="@position"/></xsl:with-param>
                                <xsl:with-param name="length"><xsl:value-of select="@length"/></xsl:with-param>
                                <xsl:with-param name="tag"><xsl:value-of select="$tag007"/></xsl:with-param>
                                <xsl:with-param name="tagnumber">007</xsl:with-param>
                                <xsl:with-param name="offset">0</xsl:with-param>
                            </xsl:call-template>
                        </xsl:when>
                        <xsl:when test="@inputtype='hidden'">
                            <xsl:call-template name="fixed-field-text">
                                <xsl:with-param name="name"><xsl:value-of select="@name"/></xsl:with-param>
                                <xsl:with-param name="position"><xsl:value-of select="@position"/></xsl:with-param>
                                <xsl:with-param name="length"><xsl:value-of select="@length"/></xsl:with-param>
                                <xsl:with-param name="tag"><xsl:value-of select="$tag007"/></xsl:with-param>
                                <xsl:with-param name="tagnumber">007</xsl:with-param>
                                <xsl:with-param name="offset">0</xsl:with-param>
                                <xsl:with-param name="hidden">1</xsl:with-param>
                            </xsl:call-template>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:call-template name="fixed-field-text">
                                <xsl:with-param name="name"><xsl:value-of select="@name"/></xsl:with-param>
                                <xsl:with-param name="position"><xsl:value-of select="@position"/></xsl:with-param>
                                <xsl:with-param name="length"><xsl:value-of select="@length"/></xsl:with-param>
                                <xsl:with-param name="tag"><xsl:value-of select="$tag007"/></xsl:with-param>
                                <xsl:with-param name="tagnumber">007</xsl:with-param>
                                <xsl:with-param name="offset">0</xsl:with-param>
                            </xsl:call-template>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:for-each>
            </xsl:for-each>
	</xsl:template>
	
	<xsl:template name="fixed-field-select">
		<xsl:param name="name"/>
		<xsl:param name="tag"/>
		<xsl:param name="tagnumber"/>
		<xsl:param name="offset">0</xsl:param>
		<xsl:param name="position"><xsl:value-of select="$marc21defs//field[@tag=$tagnumber]//value[@name=$name]/@position"/></xsl:param>
		<xsl:param name="length"><xsl:value-of select="$marc21defs//field[@tag=$tagnumber]//value[@name=$name]/@length"/></xsl:param>
		<xsl:param name="value"><xsl:value-of select="substring($tag, $position+1-$offset, $length)"/></xsl:param>
		<!--<p>param name is <xsl:value-of select="$name"/></p>
		<p>Leader value is <xsl:value-of select="$value"/></p>-->
		<td><xsl:value-of select="$name"/></td>
		<td>
			<xsl:if test='$debug=1'><span style='color:red'><xsl:value-of select="$name"/>=<xsl:value-of select="$value"/></span><br/></xsl:if>
			<select class="{$tagnumber}">
				<xsl:attribute name="name"><xsl:value-of select="$name"/></xsl:attribute>
				<xsl:attribute name='onblur'>onFixedFieldEditorBlur(this)</xsl:attribute>
				<xsl:attribute name='onclick'>showTagHelp(this)</xsl:attribute>
				<xsl:attribute name="id"><xsl:value-of select="$name"/></xsl:attribute>
				<xsl:for-each select="$marc21defs//field[@tag=$tagnumber]//value[@name=$name]/option">
					<xsl:element name="option">
						<xsl:if test="$value=.">
							<xsl:attribute name="selected">selected</xsl:attribute>
						</xsl:if>
						<xsl:attribute name="value"><xsl:value-of select="."/></xsl:attribute>
						<xsl:value-of select="."/>
					</xsl:element>
				</xsl:for-each>
			</select>
		</td>

	</xsl:template>

	<xsl:template name="fixed-field-text">
		<xsl:param name="name"/>
		<xsl:param name="tag"/>
		<xsl:param name="tagnumber"/>
		<xsl:param name="offset">0</xsl:param>
		<xsl:param name="hidden"/>
		<xsl:param name="position"><xsl:value-of select="$marc21defs//field[@tag=$tagnumber]/value[@name=$name]/@position+1-$offset"/></xsl:param>
		<xsl:param name="length"><xsl:value-of select="$marc21defs//field[@tag=$tagnumber]/value[@name=$name]/@length"/></xsl:param>
		<xsl:param name='value'><xsl:value-of select="substring($tag, $position, $length)"/></xsl:param>
		<td>
				<xsl:if test="$hidden=1">
					<xsl:attribute name="style">display:none;</xsl:attribute>
				</xsl:if>
			<xsl:value-of select="$name"/>
		</td>
		<td>
            <xsl:if test="$hidden=1">
                <xsl:attribute name="style">display:none;</xsl:attribute>
            </xsl:if>
			<input class="{$tagnumber}" type="text">
				<xsl:attribute name="id"><xsl:value-of select="$name"/></xsl:attribute>
				<xsl:attribute name="name"><xsl:value-of select="$name"/></xsl:attribute>
				<xsl:attribute name="size"><xsl:value-of select="$length"/></xsl:attribute>
				<xsl:attribute name="maxlength"><xsl:value-of select="$length"/></xsl:attribute>
				<xsl:attribute name='onblur'>onFixedFieldEditorBlur(this)</xsl:attribute>
				<xsl:attribute name='onclick'>showTagHelp(this)</xsl:attribute>
				<xsl:attribute name="value">
					<xsl:value-of select="$value"/>
				</xsl:attribute>
				<xsl:if test='$debug=1'><span style='color:red;'><xsl:value-of select="$name"/>=<xsl:value-of select="$value"/></span><br/></xsl:if>
				<xsl:if test="$hidden=1">
					<xsl:attribute name="style">display:none;</xsl:attribute>
				</xsl:if>
			</input>
		</td>
	</xsl:template>

    <xsl:template name="leader">
    <xsl:variable name='leader'><xsl:value-of select="."/></xsl:variable>
    <xsl:variable name='tag008'><xsl:value-of select="marc:controlfield[@tag='008']"/></xsl:variable> 
    <xsl:variable name="rectype" select="substring($leader, $marc21defs//value[@name='Type']/@position+1, $marc21defs//value[@name='Type']/@length)"/>
							<xsl:call-template name="fixed-field-text">
								<xsl:with-param name="name" select="'RLen'" />
								<xsl:with-param name="tag" select="$leader" />
								<xsl:with-param name="hidden" select="1" />
								<xsl:with-param name="tagnumber" select="'000'" />
							</xsl:call-template>

							<xsl:call-template name="fixed-field-text">
								<xsl:with-param name="name" select="'Base'" />
								<xsl:with-param name="hidden" select="1" />
								<xsl:with-param name="tag" select="$leader" />
								<xsl:with-param name="tagnumber" select="'000'" />
							</xsl:call-template>

							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'RStat'" />
								<xsl:with-param name="tag" select="$leader" />
								<xsl:with-param name="tagnumber" select="'000'" />
							</xsl:call-template>


							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'Type'" />
								<xsl:with-param name="tag" select="$leader" />
								<xsl:with-param name="tagnumber" select="'000'" />
							</xsl:call-template>

							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'BLvl'" />
								<xsl:with-param name="tag" select="$leader" />
								<xsl:with-param name="tagnumber" select="'000'" />
							</xsl:call-template>
							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'Desc'" />
								<xsl:with-param name="tag" select="$leader" />
								<xsl:with-param name="tagnumber" select="'000'" />
							</xsl:call-template>
							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'Multipart'" />
								<xsl:with-param name="tag" select="$leader" />
								<xsl:with-param name="tagnumber" select="'000'" />
							</xsl:call-template>
							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'ELvl'" />
								<xsl:with-param name="tag" select="$leader" />
								<xsl:with-param name="tagnumber" select="'000'" />
							</xsl:call-template>
							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'Enc'" />
								<xsl:with-param name="tag" select="$leader" />
								<xsl:with-param name="tagnumber" select="'000'" />
                            </xsl:call-template>

							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'Ctrl'" />
								<xsl:with-param name="tag" select="$leader" />
								<xsl:with-param name="tagnumber" select="'000'" />
							</xsl:call-template>
			</xsl:template>
</xsl:stylesheet>
