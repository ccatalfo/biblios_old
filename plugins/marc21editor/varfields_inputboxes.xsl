<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:marc="http://www.loc.gov/MARC21/slim" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" indent="yes"/>
	<xsl:variable name='marc21defs' select="document('marc21.xml')"/>
    <xsl:param name="editorid"> </xsl:param>

	<xsl:template match="/">
			<xsl:apply-templates/>
	</xsl:template>
	
	<xsl:template name="varfields_editor">
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
        <div class="tag controlfield 000">
            <xsl:attribute name="id">000-<xsl:value-of select="$editorid"/></xsl:attribute>
			  <input size='3' class='tagnumber'>
                <xsl:attribute name="id">000-tagnumber-<xsl:value-of select="$editorid"/></xsl:attribute>
					<xsl:attribute name='value'>000</xsl:attribute>
			  </input>

			  <input size='2' class="indicator">
						 <xsl:attribute name="id">cind1<xsl:value-of select="@tag"/>-<xsl:number value="position()"/><xsl:value-of select="$editorid"/></xsl:attribute>
					<xsl:attribute name='value'>#</xsl:attribute>
				</input>
			  <input size='2' class="indicator">
						 <xsl:attribute name="id">cind2<xsl:value-of select="@tag"/>-<xsl:number value="position()"/><xsl:value-of select="$editorid"/></xsl:attribute>
					<xsl:attribute name='value'>#</xsl:attribute>
				</input>
				<input size='24' maxlength="24" class='controlfield-text'>
                    <xsl:attribute name="id"><xsl:value-of select="@tag"/>-tagnumber-<xsl:value-of select="$editorid"/></xsl:attribute>
					<xsl:attribute name='value'>000</xsl:attribute>
					<xsl:attribute name='value'>
						<xsl:value-of select="."/>
					</xsl:attribute>
				</input>
        </div>
		
	</xsl:template>
	
	<xsl:template match="marc:controlfield">
        <div class="tag controlfield {@tag}">
                <xsl:attribute name="id"><xsl:value-of select="@tag"/><xsl:value-of select="generate-id(.)"/><xsl:value-of select="$editorid"/></xsl:attribute>
			  <input type="text" maxlength="3" size='3' class='tagnumber'> 
                <xsl:attribute name="id"><xsl:value-of select="generate-id(.)"/><xsl:value-of select="$editorid"/></xsl:attribute>
					<xsl:attribute name='value'>	
						<xsl:value-of select="@tag"/>
					</xsl:attribute>
                    <xsl:attribute name="onBlur">onBlur(this)</xsl:attribute>
                    <xsl:attribute name="onFocus">onFocus(this)</xsl:attribute>
				</input>

			  <input size='2' maxlength="2" class="indicator">
                    <xsl:attribute name="id">cind1<xsl:value-of select="generate-id(.)"/><xsl:value-of select="$editorid"/></xsl:attribute>
					<xsl:attribute name='value'>#</xsl:attribute>
					<xsl:attribute name='onfocus'>onFocus(this)</xsl:attribute>
					<xsl:attribute name='onblur'>onBlur(this)</xsl:attribute>
				</input>
			  <input size='2' maxlength="2" class="indicator">
                        <xsl:attribute name="id">cind2<xsl:value-of select="generate-id(.)"/><xsl:value-of select="$editorid"/></xsl:attribute>
					<xsl:attribute name='value'>#</xsl:attribute>
					<xsl:attribute name='onfocus'>onFocus(this)</xsl:attribute>
					<xsl:attribute name='onblur'>onBlur(this)</xsl:attribute>
				</input>
				<input type="text" class='controlfield-text'> 
                    <xsl:attribute name="id">text-<xsl:value-of select="generate-id(.)"/><xsl:value-of select="$editorid"/></xsl:attribute>
					<xsl:attribute name='size'>
						<xsl:value-of select="string-length(.)"/>
					</xsl:attribute>
					<xsl:attribute name='value'>
						<xsl:value-of select="."/>
					</xsl:attribute>
					<xsl:attribute name='onfocus'>onFocus(this)</xsl:attribute>
					<xsl:attribute name='onblur'>onBlur(this)</xsl:attribute>
				</input>
        </div> 
	</xsl:template>

	<xsl:template match="marc:datafield">
        <div class="tag datafield {@tag}">
            <!-- provide an id based on tag number, but append a number to duplicate tags don't have duplicate id's -->
                <xsl:attribute name="id"><xsl:value-of select="@tag"/><xsl:value-of select="generate-id(.)"/><xsl:value-of select="$editorid"/></xsl:attribute>
			  <input maxlength='3' class='tagnumber' >
                    <xsl:attribute name="id"><xsl:value-of select="generate-id(.)"/><xsl:value-of select="$editorid"/></xsl:attribute>
					<xsl:attribute name='size'>
						<xsl:value-of select="string-length(@tag)"/>
					</xsl:attribute>
					<xsl:attribute name='value'>
						<xsl:value-of select="@tag"/>
					</xsl:attribute>
					<xsl:attribute name='onfocus'>onFocus(this)</xsl:attribute>
					<xsl:attribute name='onblur'>onBlur(this)</xsl:attribute>
				</input>

			  <input maxlength='1' size='1' class="indicator">
						 <!-- provide an id based on tag number, but append a number to duplicate tags don't have duplicate id's -->
                        <xsl:attribute name="id"><xsl:value-of select="generate-id(.)"/><xsl:value-of select="$editorid"/></xsl:attribute>
						<xsl:attribute name='onfocus'>onFocus(this)</xsl:attribute>
						<xsl:attribute name='onblur'>onBlur(this)</xsl:attribute>
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
                    <xsl:attribute name="id"><xsl:value-of select="generate-id(.)"/><xsl:value-of select="$editorid"/></xsl:attribute>
						<xsl:attribute name='onfocus'>onFocus(this)</xsl:attribute>
						<xsl:attribute name='onblur'>onBlur(this)</xsl:attribute>
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
                <xsl:attribute name="id">subfields-<xsl:value-of select="generate-id(.)"/><xsl:value-of select="$editorid"/></xsl:attribute>
                <xsl:apply-templates select="marc:subfield">
					<xsl:with-param name="id">dsubfields<xsl:value-of select="@tag"/>-<xsl:number value="position()"/></xsl:with-param>
				</xsl:apply-templates>
            </span>
        </div>
    
	</xsl:template>
	
    <xsl:template match="marc:subfield">
		<xsl:param name="id"/>
			<span class="subfield {@code}">
				<xsl:attribute name="id"><xsl:value-of select="$id"/>-<xsl:value-of select="@code"/><xsl:value-of select="generate-id(.)"/><xsl:value-of select="$editorid"/></xsl:attribute>
				<input class="subfield-delimiter {@code}">
					<xsl:attribute name='size'>2</xsl:attribute>
					<xsl:attribute name='maxlength'>2</xsl:attribute>
					<xsl:attribute name='value'>
					&#8225;<xsl:value-of select="@code"/>
					</xsl:attribute>
					<xsl:attribute name='onfocus'>onFocus(this)</xsl:attribute>
					<xsl:attribute name='onblur'>onBlur(this)</xsl:attribute>
					<xsl:attribute name="id">
						<xsl:value-of select="$id"/>delimiter-<xsl:value-of select="@code"/>-<xsl:value-of select="position()"/><xsl:value-of select="$editorid"/>
					</xsl:attribute>
				</input>

				<input class="subfield-text {@code}">
					<xsl:attribute name='size'>
						<xsl:value-of select="string-length(.)"/>
					</xsl:attribute>
					<xsl:attribute name='value'>
						<xsl:value-of select="."/>
					</xsl:attribute>

					<xsl:attribute name='onfocus'>onFocus(this)</xsl:attribute>
					<xsl:attribute name='onblur'>onBlur(this)</xsl:attribute>
					<xsl:attribute name="id">
						<xsl:value-of select="$id"/>text-<xsl:value-of select="@code"/>-<xsl:value-of select="position()"/><xsl:value-of select="$editorid"/>
					</xsl:attribute>
				</input>
			</span>
    </xsl:template>

</xsl:stylesheet>
