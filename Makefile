CTAGS=ctags
JSMIN=tools/jsmin 
CAT=cat
SRCS=ui/js/*.js 
ALLSRC=$(SRCS) index.html

all: $(SRCS)
	$(CAT) ui/js/marcrecord.js ui/js/marceditor.js ui/js/db.js ui/js/search.js ui/js/ui.js ui/js/save.js ui/js/edit.js ui/js/options.js plugins/koha.js ui/js/init.js ui/js/prefs.js > ui/js/biblios_all.js
	$(JSMIN) <ui/js/biblios_all.js >ui/js/biblios_packed.js

dist: $(SRCS)
	tar -cvf biblios.tar.gz Makefile index.html ui lib cgi-bin conf templates plugins integration docs tools test

clean: $(SRCS)
	@echo "Removing concatenated and packed biblios files"
	-rm -f ui/js/biblios_all.js 
	-rm -f ui/js/biblios_packed.js
	@echo "Removing autogenerated index-debug.html and index-koha.html"
	-rm -f index-debug.html 
	-rm -f index-koha.html

tags: $(SRCS)
	$(CTAGS) ui/js/marcrecord.js ui/js/marceditor.js ui/js/db.js ui/js/search.js ui/js/ui.js ui/js/save.js ui/js/edit.js ui/js/options.js plugins/koha.js ui/js/init.js ui/js/prefs.js

debug: 
	sed -f sed_generate_index_debug < index.html > index-debug.html

test:
	xalan -in test/testRecords/006.xml -xsl ui/xsl/fixedfields_editor.xsl > test/generatedFiles/ff_006.html
	 xalan -in test/testRecords/sandburg.xml -xsl ui/xsl/fixedfields_editor.xsl > test/generatedFiles/ff_books.html 		
koha:
	perl integration/updateForEmbedding.pl index-debug.html index-koha.html "/intranet-tmpl$(KOHALANGTHEME)/lib/biblios/" "/cgi-bin/koha/plugins/biblios/" "$(KOHASTAFFPORT)" "<!-- TMPL_INCLUDE NAME=\"doc-head-open.inc\" --><!-- TMPL_INCLUDE NAME=\"doc-head-close-biblios.inc\" -->" "<!-- TMPL_INCLUDE NAME=\"header.inc\" -->"

koha-install:
	cp index-koha.html $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/modules/cataloguing/biblios.tmpl
	cp integration/koha/biblios.pl $(KOHADIR)/cataloguing/
	sed s'|/lib/jquery/jquery.js|/lib/biblios/lib/jquery/jquery-1.1.3.1.js|' < $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/includes/doc-head-close.inc >$(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/includes/doc-head-close-biblios.inc 
	mkdir -p $(KOHADIR)/plugins/biblios
	cp cgi-bin/downloadMarc.pl cgi-bin/vendorSearch $(KOHADIR)/plugins/biblios/
	mkdir -p $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/lib/biblios
	cp -r lib templates ui conf plugins $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/lib/biblios/

koha-uninstall:
	@echo Uninstalling biblios files from koha path $(KOHADIR)
	-rm -f $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/modules/cataloguing/biblios.tmpl
	-rm -f $(KOHADIR)/cataloguing/biblios.pl
	-rm -f $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/includes/doc-head-close-biblios.inc
	rm -rf $(KOHADIR)/plugins/biblios
	rm -rf $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/lib/biblios
