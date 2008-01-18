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

tags: $(SRCS)
	$(CTAGS) ui/js/marcrecord.js ui/js/marceditor.js ui/js/db.js ui/js/search.js ui/js/ui.js ui/js/save.js ui/js/edit.js ui/js/options.js plugins/koha.js ui/js/init.js ui/js/prefs.js

debug: 
	sed -f sed_generate_index_debug < index.html > index-debug.html

koha:
	perl integration/updateForEmbedding.pl index-debug.html index-koha.html "/intranet-tmpl$(KOHALANGTHEME)/lib/biblios/" "/cgi-bin/koha/plugins/biblios/" "$(KOHASTAFFPORT)" "<!-- TMPL_INCLUDE NAME=\"doc-head-open.inc\" --><!-- TMPL_INCLUDE NAME=\"doc-head-close-biblios.inc\" -->" "<!-- TMPL_INCLUDE NAME=\"header.inc\" -->"

koha-install:
	cp index-koha.html $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/modules/cataloguing/biblios.tmpl
	cp integration/koha/biblios.pl $(KOHADIR)/cataloguing/
	cp integration/koha/doc-head-close-biblios.inc $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/includes/ 
	mkdir -p $(KOHADIR)/plugins/biblios
	cp cgi-bin/downloadMarc.pl cgi-bin/vendorSearch $(KOHADIR)/plugins/biblios/
	mkdir -p $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/lib/biblios
	cp -r lib templates ui conf plugins $(KOHADIR)/koha-tmpl/intranet-tmpl$(KOHALANGTHEME)/lib/biblios/
