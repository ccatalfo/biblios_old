<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:marc="http://www.loc.gov/MARC21/slim" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" indent="yes"/>
	<xsl:variable name='marc21defs' select="document('marc21.xml')"/>
	<xsl:param name='debug'/>

	<xsl:template match="/">
        <div id='fixedfields_editor'>
			<xsl:apply-templates/>
        </div>
	</xsl:template>
	
	<xsl:template match="marc:record">
		<xsl:variable name='leader' select="marc:leader"/>
		<xsl:variable name='tag008' select="marc:controlfield[@tag='008']"/>
		<xsl:variable name="rectype" select="substring($leader, $marc21defs//value[@name='Type']/@position+1, $marc21defs//value[@name='Type']/@length)"/>
		<table id="fixed_field_grid" class="fixed_field">
			<tr>
                      <td style='display:none;'>
							<xsl:call-template name="fixed-field-text">
								<xsl:with-param name="name" select="'RLen'" />
								<xsl:with-param name="tag" select="$leader" />
							</xsl:call-template>
						</td>

						<td style='display:none;'>
							<xsl:call-template name="fixed-field-text">
								<xsl:with-param name="name" select="'Base'" />
								<xsl:with-param name="tag" select="$leader" />
							</xsl:call-template>
						</td>

							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'RStat'" />
								<xsl:with-param name="tag" select="$leader" />
							</xsl:call-template>


							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'Type'" />
								<xsl:with-param name="tag" select="$leader" />
							</xsl:call-template>
							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'BLvl'" />
								<xsl:with-param name="tag" select="$leader" />
							</xsl:call-template>
							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'Desc'" />
								<xsl:with-param name="tag" select="$leader" />
							</xsl:call-template>
							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'ELvl'" />
								<xsl:with-param name="tag" select="$leader" />
							</xsl:call-template>
							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'Enc'" />
								<xsl:with-param name="tag" select="$leader" />
							</xsl:call-template>
							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="'Ctrl'" />
								<xsl:with-param name="tag" select="$leader" />
							</xsl:call-template>
			</tr>
			<!-- 008 fixed fields for all material types -->
			<tr>
					<xsl:call-template name="generate_for_rectype">
						<xsl:with-param name="rectype">All</xsl:with-param>
						<xsl:with-param name="offset">0</xsl:with-param>
						<xsl:with-param name='tag' select="marc:controlfield[@tag='008']"/>
					</xsl:call-template>
			</tr>
			<tr> <!-- material-specific row of fixed field input elements -->
			<!-- 008 fixed fields for Books -->
			<xsl:if test="$rectype = 'a' or $rectype = 't'">
					<xsl:call-template name="generate_for_rectype">
						<xsl:with-param name="rectype">Books</xsl:with-param>
						<xsl:with-param name="offset">0</xsl:with-param>
						<xsl:with-param name='tag' select="$tag008"/>
					</xsl:call-template>
			</xsl:if>

			<!-- 008 fixed fields for computer files -->
			<xsl:if test="$rectype = 'm'">
				<xsl:call-template name="generate_for_rectype">
					<xsl:with-param name="rectype">ComputerFile</xsl:with-param>
					<xsl:with-param name="offset">0</xsl:with-param>
					<xsl:with-param name='tag' select="$tag008"/>
				</xsl:call-template>
			</xsl:if>
						
			<!-- 008 fixed fields for Cartographic materials -->
			<xsl:if test="$rectype = 'e' or $rectype = 'f'">
					<xsl:call-template name="generate_for_rectype">
						<xsl:with-param name="rectype">Maps</xsl:with-param>
						<xsl:with-param name="offset">0</xsl:with-param>
						<xsl:with-param name='tag' select="$tag008"/>
					</xsl:call-template>
			</xsl:if>

			<!-- 008 fixed fields for music materials -->
			<xsl:if test="$rectype = 'c' or $rectype = 'd' or $rectype = 'j' or $rectype = 'i'">
					<xsl:call-template name="generate_for_rectype">
						<xsl:with-param name="rectype">Music</xsl:with-param>
						<xsl:with-param name="offset">0</xsl:with-param>
						<xsl:with-param name='tag' select="$tag008"/>
					</xsl:call-template>
			</xsl:if>
			<!-- 008 fixed fields for visual materials -->
			<xsl:if test="$rectype = 'g' or $rectype = 'k' or $rectype = 'o' or $rectype = 'r'">
					<xsl:call-template name="generate_for_rectype">
						<xsl:with-param name="rectype">Visual</xsl:with-param>
						<xsl:with-param name="offset">0</xsl:with-param>
						<xsl:with-param name='tag' select="$tag008"/>
					</xsl:call-template>
			</xsl:if>
			<!-- 008 fixed fields for mixed materials -->
			<xsl:if test="$rectype = 'p'">
					<xsl:call-template name="generate_for_rectype">
						<xsl:with-param name="rectype">Mixed</xsl:with-param>
						<xsl:with-param name="offset">0</xsl:with-param>
						<xsl:with-param name='tag' select="$tag008"/>
					</xsl:call-template>
			</xsl:if>
			</tr>  <!-- end of material specific row -->

			<!-- rows for any 006's -->
			<xsl:for-each select="marc:controlfield[@tag='006']">
				<xsl:call-template name="tag006"/>
			</xsl:for-each>
			<!-- rows for any 007's -->
			<xsl:for-each select="marc:controlfield[@tag='007']">
				<xsl:call-template name="tag007"/>
			</xsl:for-each>
		</table> <!-- end fixed fields editor table -->
	</xsl:template>

	<xsl:template name="generate_for_rectype">
		<xsl:param name="rectype">All</xsl:param>
		<xsl:param name="offset">0</xsl:param>
		<xsl:param name="tag"></xsl:param>
			<xsl:for-each select="$marc21defs//mattypes/mattype[@value=$rectype]/position">
				<xsl:variable name="name" select="string(.)"/>
				<xsl:variable name="inputtype" select="$marc21defs//value[@name=$name]/@inputtype"/>
					<xsl:choose>
						<xsl:when test="$inputtype = 'textbox'">	
							<xsl:call-template name="fixed-field-text">
								<xsl:with-param name="name" select="." />
								<xsl:with-param name="tag"><xsl:value-of select="$tag"/></xsl:with-param>
								<xsl:with-param name="offset"><xsl:value-of select="$offset"/></xsl:with-param>
							</xsl:call-template>

						</xsl:when>
						<xsl:otherwise>
							<xsl:call-template name="fixed-field-select">
								<xsl:with-param name="name" select="." />
								<xsl:with-param name="tag"><xsl:value-of select="$tag"/></xsl:with-param>
								<xsl:with-param name="offset"><xsl:value-of select="$offset"/></xsl:with-param>
							</xsl:call-template>
						</xsl:otherwise>
					</xsl:choose>	
			</xsl:for-each>
	</xsl:template>

	<xsl:template name="tag006">
			<xsl:variable name="form" select="substring(.,1, 1)"/>
			<tr>
			<xsl:if test="$form = 'a' or $form = 't'">
				<xsl:call-template name="generate_for_rectype">
					<xsl:with-param name="rectype">Books</xsl:with-param>
					<xsl:with-param name="offset">17</xsl:with-param>
					<xsl:with-param name='tag' select="."/>
				</xsl:call-template>
			</xsl:if>
			<xsl:if test="$form = 'e' or $form = 'f'">
				<xsl:call-template name="generate_for_rectype">
					<xsl:with-param name="rectype">Maps</xsl:with-param>
					<xsl:with-param name="offset">17</xsl:with-param>
					<xsl:with-param name='tag' select="."/>
				</xsl:call-template>
			</xsl:if>
			<xsl:if test="$form = 'c' or $form = 'd' or $form = 'j' or $form = 'i'">
				<xsl:call-template name="generate_for_rectype">
					<xsl:with-param name="rectype">Music</xsl:with-param>
					<xsl:with-param name="offset">17</xsl:with-param>
					<xsl:with-param name='tag' select="."/>
				</xsl:call-template>
			</xsl:if>
			<xsl:if test="$form = 'g' or $form = 'k' or $form = 'o' or $form = 'r'">
					<xsl:call-template name="generate_for_rectype">
						<xsl:with-param name="rectype">Visual</xsl:with-param>
						<xsl:with-param name="offset">17</xsl:with-param>
						<xsl:with-param name='tag' select="."/>
					</xsl:call-template>
			</xsl:if>
			<xsl:if test="$form = 'm'">
				<xsl:call-template name="generate_for_rectype">
					<xsl:with-param name="rectype">ComputerFile</xsl:with-param>
					<xsl:with-param name="offset">17</xsl:with-param>
					<xsl:with-param name='tag' select="."/>
				</xsl:call-template>
			</xsl:if>
			<xsl:if test="$form = 'p'">
					<xsl:call-template name="generate_for_rectype">
						<xsl:with-param name="rectype">Mixed</xsl:with-param>
						<xsl:with-param name="offset">17</xsl:with-param>
						<xsl:with-param name='tag' select="."/>
					</xsl:call-template>
			</xsl:if>
			</tr>
	</xsl:template>
	<!-- 007s -->
	<xsl:template name="tag007">
			<xsl:variable name="cat" select="substring(.,1, 1)"/>
			<tr>
			<!-- map -->
			<xsl:if test="$cat = 'a'">
			</xsl:if>
			<!-- electronic -->
			<xsl:if test="$cat = 'c'">
			</xsl:if>
			<!-- globe-->
			<xsl:if test="$cat = 'd'">
			</xsl:if>
			<!-- tactile-->
			<xsl:if test="$cat = 'f'">
			</xsl:if>
			<!-- projected graphic-->
			<xsl:if test="$cat = 'g'">
			</xsl:if>
			<!-- microform-->
			<xsl:if test="$cat = 'h'">
			</xsl:if>
			<!-- non projected graphic-->
			<xsl:if test="$cat = 'k'">
			</xsl:if>
			<!-- motion picture-->
			<xsl:if test="$cat = 'm'">
			</xsl:if>
			<!-- kit-->
			<xsl:if test="$cat = 'o'">
			</xsl:if>
			<!-- notated music-->
			<xsl:if test="$cat = 'q'">
			</xsl:if>
			<!-- remote sensing image-->
			<xsl:if test="$cat = 'r'">
			</xsl:if>
			<!-- sound recording -->
			<xsl:if test="$cat = 's'">
			</xsl:if>
			<!-- text -->
			<xsl:if test="$cat = 't'">
			</xsl:if>
			<!-- vidoerecording -->
			<xsl:if test="$cat = 'v'">
			</xsl:if>
			<!-- unspecified -->
			<xsl:if test="$cat = 'z'">
			</xsl:if>
			</tr>
	</xsl:template>
	
	<xsl:template name="fixed-field-select">
		<xsl:param name="name"/>
		<xsl:param name="tag"/>
		<xsl:param name="offset">0</xsl:param>
		<xsl:variable name="position" select="$marc21defs//value[@name=$name]/@position"/>
		<xsl:variable name="length" select="$marc21defs//value[@name=$name]/@length"/>
		<xsl:variable name="value" select="substring($tag, $position+1-$offset, $length)"/>
		<!--<p>param name is <xsl:value-of select="$name"/></p>
		<p>Leader value is <xsl:value-of select="$value"/></p>-->
		<td><xsl:value-of select="$name"/></td>
		<td>
			<xsl:if test='$debug=1'><span style='color:red'><xsl:value-of select="$name"/>=<xsl:value-of select="$value"/></span><br/></xsl:if>
			<select>
				<xsl:attribute name="name"><xsl:value-of select="$name"/></xsl:attribute>
				<xsl:attribute name='onblur'>onFixedFieldEditorBlur(this)</xsl:attribute>
				<xsl:attribute name="id"><xsl:value-of select="$name"/></xsl:attribute>
				<xsl:for-each select="$marc21defs//value[@name=$name]/option">
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
		<xsl:param name="offset">0</xsl:param>
		<xsl:param name="hidden"/>
		<xsl:variable name="position" select="$marc21defs//value[@name=$name]/@position+1-$offset"/>
		<xsl:variable name="length" select="$marc21defs//value[@name=$name]/@length"/>
		<xsl:variable name='value' select="substring($tag, $position, $length)"/>
		<td>
			<xsl:value-of select="$name"/>
		</td>
		<td>
			<input type="text">
				<xsl:attribute name="id"><xsl:value-of select="$name"/></xsl:attribute>
				<xsl:attribute name="size"><xsl:value-of select="$length"/></xsl:attribute>
				<xsl:attribute name="maxlength"><xsl:value-of select="$length"/></xsl:attribute>
				<xsl:attribute name='onblur'>onFixedFieldEditorBlur(this)</xsl:attribute>
				<xsl:attribute name="value">
					<xsl:value-of select="$value"/>
				</xsl:attribute>
				<xsl:if test='$debug=1'><span style='color:red;'><xsl:value-of select="$name"/>=<xsl:value-of select="$value"/></span><br/></xsl:if>
				<xsl:if test="$hidden='true'">
					<xsl:attribute name="hidden">true</xsl:attribute>
				</xsl:if>
			</input>
		</td>
	</xsl:template>
</xsl:stylesheet>
