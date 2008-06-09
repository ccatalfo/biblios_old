CTAGS=ctags
JSMIN=perl tools/js-minify.pl 
CSSMIN=perl tools/css-minify.pl
CAT=cat
SRCS=ui
ALLSRC=$(SRCS) index.html Makefile INSTALL INSTALL.koha lib cgi-bin conf templates plugins integration docs tools test
VERSION=0.9
PROGNAME=biblios-$(VERSION)

all: $(SRCS)
	@echo "Building Biblios source"
	$(CAT) plugins/koha.js ui/js/db.js ui/js/marceditor.js ui/js/marcrecord.js ui/js/init.js ui/js/prefs.js ui/js/search.js ui/js/biblios.js ui/js/save.js ui/js/ui.js ui/js/edit.js > ui/js/biblios_all.js
	$(JSMIN) ui/js/biblios_all.js ui/js/biblios_min.js
	@echo "Building javascript libraries"	
	$(CAT) lib/extjs/PagingMemoryProxy.js lib/extjs/GoogleGearsProxy.js lib/extjs2/Ext.ux.NestedXmlReader.js lib/extjs2/Ext.ux.GearsTreeLoader.js lib/extjs2/Ext.ux.FacetsTreeLoader.js lib/extjs2/Ext.ux.UploadDialog.js lib/extjs2/RowExpander.js lib/extjs2/miframe.js > lib/extjs2/ext_ux_libs.js
	$(JSMIN) lib/extjs2/ext_ux_libs.js lib/extjs2/ext_ux_libs-min.js
	$(CAT) lib/jquery/jquery.hotkeys.js lib/jquery/jquery.xpath.js lib/jquery/jquery.cookie.js lib/jquery/json.js > lib/jquery/jquery_plugins.js
	$(JSMIN) lib/jquery/jquery_plugins.js lib/jquery/jquery_plugins-min.js
	@echo "Compressing css files"
	$(CSSMIN) lib/extjs2/resources/css/ext-all.css lib/extjs2/resources/css/ext-all-min.css	
	$(CSSMIN) ui/css/styles.css ui/css/styles-min.css
	$(CSSMIN) ui/css/editor-styles.css ui/css/editor-styles-min.css
	ttree -a -f .ttreerc-standalone

dist: $(ALLSRC)
	mkdir -p $(PROGNAME)
	cp -r INSTALL INSTALL.koha Makefile index.html ui lib cgi-bin conf templates plugins integration docs tools test uploads $(PROGNAME)
	tar -cvf $(PROGNAME).tar $(PROGNAME)
	gzip $(PROGNAME).tar
	zip -r $(PROGNAME).zip $(PROGNAME)

distclean:
	rm -rf $(PROGNAME)
	rm -rf $(PROGNAME).zip
	rm -rf $(PROGNAME).tar.gz

clean: 
	@echo "Removing concatenated and packed biblios files"
	-rm -f ui/js/biblios_all.js 
	-rm -f ui/js/biblios_min.js
	@echo "Removing generated index.html"
	-rm -f build/index.html

tags: $(SRCS)
	$(CTAGS) ui/js/biblios.js ui/js/marcrecord.js ui/js/marceditor.js ui/js/db.js ui/js/search.js ui/js/ui.js ui/js/save.js ui/js/edit.js ui/js/options.js plugins/koha.js ui/js/init.js ui/js/prefs.js

debug: src/index.html
	ttree -a -f .ttreerc-debug

koha: src/index.html
	ttree -a -f .ttreerc-koha

koha-install: build/index.html
	cp build/index.html $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/modules/cataloguing/biblios.tmpl
	cp integration/koha/biblios.pl $(KOHADIR)/cataloguing/
	mkdir -p $(KOHADIR)/plugins/biblios
	cp cgi-bin/uploaddb.pl cgi-bin/exportdb.pl cgi-bin/downloadMarc.pl cgi-bin/download.pl cgi-bin/vendorSearch cgi-bin/uploadMarc.pl $(KOHADIR)/plugins/biblios/
	mkdir -p $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/lib/biblios
	cp -r lib tools templates ui conf plugins $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/lib/biblios/

koha-uninstall:
	@echo Uninstalling biblios files from koha path $(KOHADIR)
	-rm -f $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/modules/cataloguing/biblios.tmpl
	-rm -f $(KOHADIR)/cataloguing/biblios.pl
	-rm -f $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/includes/doc-head-close-biblios.inc
	rm -rf $(KOHADIR)/plugins/biblios
	rm -rf $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/lib/biblios
