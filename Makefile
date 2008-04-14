CTAGS=ctags
JSMIN=jsmin 
CAT=cat
SRCS=ui
ALLSRC=$(SRCS) index.html Makefile INSTALL INSTALL.koha lib cgi-bin conf templates plugins integration docs tools test
VERSION=0.9
PROGNAME=biblios-$(VERSION)

all: $(SRCS)
	$(CAT) ui/js/marcrecord.js ui/js/marceditor.js ui/js/db.js ui/js/search.js ui/js/ui.js ui/js/save.js ui/js/edit.js ui/js/options.js plugins/koha.js ui/js/init.js ui/js/prefs.js ui/js/biblios.js > ui/js/biblios_all.js
	#$(JSMIN) <ui/js/biblios_all.js >ui/js/biblios_packed.js

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
	-rm -f ui/js/biblios_packed.js
	@echo "Removing autogenerated index-debug.html and index-koha.html"
	-rm -f index-debug.html 
	-rm -f index-koha.html

tags: $(SRCS)
	$(CTAGS) ui/js/biblios.js ui/js/marcrecord.js ui/js/marceditor.js ui/js/db.js ui/js/search.js ui/js/ui.js ui/js/save.js ui/js/edit.js ui/js/options.js plugins/koha.js ui/js/init.js ui/js/prefs.js

debug: index.html
	cp index.html index-debug.html

koha: index-debug.html
	perl integration/updateForEmbedding.pl index-debug.html index-koha.html "/intranet-tmpl$(KOHALANGTHEME)/lib/biblios/" "/cgi-bin/koha/plugins/biblios/" "$(KOHASTAFFPORT)" "<!-- TMPL_INCLUDE NAME=\"doc-head-open.inc\" --><!-- TMPL_INCLUDE NAME=\"doc-head-close.inc\" --><link rel=\"stylesheet\" type=\"text/css\" href=\"ui/css/reset.css\">" "<!-- TMPL_INCLUDE NAME=\"header.inc\" -->" integration/koha/fixes.js $(DEBUG) $(KOHAURL)

koha-install: index-koha.html
	cp index-koha.html $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/modules/cataloguing/biblios.tmpl
	cp integration/koha/biblios.pl $(KOHADIR)/cataloguing/
	mkdir -p $(KOHADIR)/plugins/biblios
	cp cgi-bin/downloadMarc.pl cgi-bin/download.pl cgi-bin/vendorSearch $(KOHADIR)/plugins/biblios/
	mkdir -p $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/lib/biblios
	cp -r lib tools templates ui conf plugins $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/lib/biblios/

koha-uninstall:
	@echo Uninstalling biblios files from koha path $(KOHADIR)
	-rm -f $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/modules/cataloguing/biblios.tmpl
	-rm -f $(KOHADIR)/cataloguing/biblios.pl
	-rm -f $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/includes/doc-head-close-biblios.inc
	rm -rf $(KOHADIR)/plugins/biblios
	rm -rf $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/lib/biblios
