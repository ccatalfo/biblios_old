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
		    <xsl:apply-templates select="marc:leader">
			</xsl:apply-templates>
		    <xsl:apply-templates select="marc:controlfield">
				<xsl:sort select="marc:datafield[@tag]" data-type="number"/>
			</xsl:apply-templates>
		    <xsl:apply-templates select="marc:datafield">
				<xsl:sort select="marc:datafield[@tag]" data-type="number"/>
			</xsl:apply-templates>
	</xsl:template>

	<xsl:template match="marc:leader">
        <div class="tag" id="000">
			  <span class='tagnumber' id='c000'>ldr</span>

			  <span class="indicator">
						 <xsl:attribute name="id">cind1<xsl:value-of select="000"/>-<xsl:number value="position()"/></xsl:attribute>#
				</span>
			  <span class="indicator">
						 <xsl:attribute name="id">cind2<xsl:value-of select="000"/>-<xsl:number value="position()"/></xsl:attribute>#
				</span>
				<span class='controlfield' id='csubfields000'><xsl:value-of select="."/>
				</span>
        </div>
		
	</xsl:template>
	
	<xsl:template match="marc:controlfield">
        <div class="tag" id="{@tag}">
			  <input size='3' class='tagnumber' id='c{@tag}'>
					<xsl:attribute name='value'>	
						<xsl:value-of select="@tag"/>
					</xsl:attribute>
				</input>

			  <input size='2' class="indicator">
						 <xsl:attribute name="id">cind1<xsl:value-of select="@tag"/>-<xsl:number value="position()"/></xsl:attribute>
					<xsl:attribute name='value'>#</xsl:attribute>
				</input>
			  <input size='2' class="indicator">
						 <xsl:attribute name="id">cind2<xsl:value-of select="@tag"/>-<xsl:number value="position()"/></xsl:attribute>
					<xsl:attribute name='value'>#</xsl:attribute>
				</input>
				<input class='controlfield' id='csubfields{@tag}'>
					<xsl:attribute name='value'>
						<xsl:value-of select="."/>
					</xsl:attribute>
				</input>
        </div>
    
	</xsl:template>

	<xsl:template match="marc:datafield">
        <div class="tag">
            <!-- provide an id based on tag number, but append a number to duplicate tags don't have duplicate id's -->
            <xsl:attribute name="id">
					<xsl:value-of select="@tag"/>-<xsl:number value="position()"/>
				</xsl:attribute>

			  <input maxlength='3' class='tagnumber' id='d{@tag}'>
					<xsl:attribute name='size'>
						<xsl:value-of select="string-length(@tag)"/>
					</xsl:attribute>
					<xsl:attribute name='value'>
						<xsl:value-of select="@tag"/>
					</xsl:attribute>
				</input>

			  <input maxlength='1' size='1' class="indicator">
						 <!-- provide an id based on tag number, but append a number to duplicate tags don't have duplicate id's -->
						 <xsl:attribute name="id">dind1<xsl:value-of select="@tag"/>-<xsl:number value="position()"/>
						</xsl:attribute>
						<xsl:choose>
							<xsl:when test="@ind1 = ' '">
								<xsl:attribute name='value'>#</xsl:attribute>
							</xsl:when>
							<xsl:otherwise>
								<xsl:attribute name='value'>
									<xsl:value-of select="@ind1"/>
								</xsl:attribute>
							</xsl:otherwise>
						</xsl:choose>
			  </input>

			  <input size='1' maxlength='1' class="indicator">
						 <!-- provide an id based on tag number, but append a number to duplicate tags don't have duplicate id's -->
						 <xsl:attribute name="id">dind2<xsl:value-of select="@tag"/>-<xsl:number value="position()"/>
						</xsl:attribute>
						<xsl:choose>
							<xsl:when test="@ind2 = ' '">
								<xsl:attribute name='value'>#</xsl:attribute>
							</xsl:when>
							<xsl:otherwise>
								<xsl:attribute name='value'>
									<xsl:value-of select="@ind2"/>
								</xsl:attribute>
							</xsl:otherwise>
						</xsl:choose>
			  </input>

            <span class='subfields'>
                <!-- provide an id based on tag number, but append a number to duplicate tags don't have duplicate id's -->
                <xsl:attribute name="id">dsubfields<xsl:value-of select="@tag"/>-<xsl:number value="position()"/></xsl:attribute>
                <xsl:apply-templates select="marc:subfield"/>
            </span>
        </div>
    
	</xsl:template>
	
    <xsl:template match="marc:subfield">
			<span class="subfield">
				<xsl:attribute name="id"><xsl:value-of select="../@tag"/>-<xsl:number value="position()"/><xsl:value-of select="@code"/></xsl:attribute>
				<input class="subfield-delimiter">
					<xsl:attribute name='size'>2</xsl:attribute>
					<xsl:attribute name='maxlength'>2</xsl:attribute>
					<xsl:attribute name='value'>
					&#8225;<xsl:value-of select="@code"/>
					</xsl:attribute>
				</input>

				<input class="subfield-text">
					<xsl:attribute name='size'>
						<xsl:value-of select="string-length(.)"/>
					</xsl:attribute>
					<xsl:attribute name='value'>
						<xsl:value-of select="."/>
					</xsl:attribute>

					<xsl:attribute name="id">
						<xsl:value-of select="../@tag"/>-<xsl:number value="position()"/><xsl:value-of select="@code"/>text
					</xsl:attribute>
				</input>
			</span>
    </xsl:template>

</xsl:stylesheet>
