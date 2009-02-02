CTAGS=ctags
JSMIN=perl tools/js-minify.pl 
CSSMIN=perl tools/css-minify.pl
CAT=cat
SRCS=src/index.html ui/js/biblios.js ui/js/search.js ui/js/save.js ui/js/prefs.js ui/js/db.js ui/js/init.js ui/js/ui.js
ALLSRC=$(SRCS) Makefile INSTALL INSTALL.koha lib cgi-bin conf templates plugins integration docs tools test
VERSION=0.9
PROGNAME=biblios-$(VERSION)

all: build

debug: 
	@echo
	@echo "Building debug version of Biblios index.html"
	@echo
	ttree -a -f .ttreerc-debug

build: $(SRCS)
	mkdir -p build/lib
	mkdir -p build/css
	@echo "Building Biblios source..."
	@echo
	$(CAT) ui/js/db.js ui/js/init.js ui/js/prefs.js ui/js/search.js ui/js/biblios.js ui/js/save.js ui/js/ui.js ui/js/edit.js > build/lib/biblios_all.js
	$(JSMIN) build/lib/biblios_all.js build/lib/biblios_min.js
	@echo
	@echo "Building javascript libraries"	
	@echo
	$(CAT) lib/extjs2/GridViewOverride.js lib/extjs2/Ext.ux.ImprovedPagingToolbar.js lib/extjs2/Ext.ux.ToolbarContainer.js lib/extjs2/TabCloseMenu.js lib/extjs2/Ext.grid.SmartCheckboxSelectionModel.js lib/extjs2/PagingMemoryProxy.js lib/extjs2/GoogleGearsProxy.js lib/extjs2/Ext.ux.NestedXmlReader.js lib/extjs2/Ext.ux.GearsTreeLoader.js lib/extjs2/Ext.ux.FacetsTreeLoader.js lib/extjs2/Ext.ux.UploadDialog.js lib/extjs2/RowExpander.js lib/extjs2/miframe.js  > build/lib/ext_ux_libs.js
	$(JSMIN) build/lib/ext_ux_libs.js build/lib/ext_ux_libs-min.js
	$(CAT) lib/jquery/jquery.hotkeys.js lib/jquery/jquery.xpath.js lib/jquery/jquery.cookie.js lib/jquery/json.js > build/lib/jquery_plugins.js
	$(JSMIN) build/lib/jquery_plugins.js build/lib/jquery_plugins-min.js
	@echo
	@echo "Concatenating all js files"
	@echo
	$(CAT) lib/cookieHelpers.js lib/jquery/jquery-1.2.2.min.js build/lib/jquery_plugins-min.js lib/sarissa/sarissa.js lib/jquery/jquery.xslTransform.packed.js lib/sarissa/sarissa_ieemu_xpath.js lib/extjs2/adapter/ext/ext-base.js lib/extjs2/ext-all.js build/lib/ext_ux_libs-min.js lib/google_gears/GearsORM_all.js lib/google_gears/GearsORMShift.js build/lib/biblios_min.js > build/lib.js
	@echo
	@echo "Compressing css files"
	@echo
	$(CSSMIN) ui/css/styles.css build/css/styles-min.css
	$(CSSMIN) ui/css/editor-styles.css build/css/editor-styles-min.css
	$(CSSMIN) ui/css/preview-styles.css build/css/preview-styles-min.css
	$(CSSMIN) lib/extjs2/Ext.ux.ToolbarContainer.css build/css/Ext.ux.ToolbarContainer-min.css
	@echo
	@echo "Concatenating css files"
	@echo
	$(CAT) build/css/styles-min.css build/css/editor-styles-min.css build/css/preview-styles-min.css build/css/Ext.ux.ToolbarContainer-min.css > build/styles.css

install: checkperldeps
	cp build/index.html $(HTMLDIR)/index.html
	cp build/lib.js $(HTMLDIR)/lib.js
	cp lib/google_gears/gears_init.js $(HTMLDIR)
	cp build/styles.css $(HTMLDIR)/styles.css
	mkdir -p $(HTMLDIR)/lib/extjs2/resources
	mkdir -p $(HTMLDIR)/lib/extjs2/resources/images/default
	cp -r lib/extjs2/resources/css $(HTMLDIR)/lib/extjs2/resources/css
	cp -r lib/extjs2/resources/images/default $(HTMLDIR)/lib/extjs2/resources/images
	cp -r ui tools macros templates conf plugins $(HTMLDIR)
	cp cgi-bin/* $(CGIDIR)

install-debug: 
	cp build/index.html $(HTMLDIR)/index.html
	cp -r lib $(HTMLDIR)/
	cp -r ui tools templates conf plugins $(HTMLDIR)/
	cp -r cgi-bin/* $(CGIDIR)
	
dist: build
	@echo "Creating .zip and .tar.zip distributions"
	@echo
	ttree -a -f .ttreerc-standalone
	mkdir -p $(PROGNAME)/lib
	mkdir -p $(PROGNAME)/css
	mkdir -p $(PROGNAME)/build
	mkdir -p $(PROGNAME)/src
	cp -r INSTALL INSTALL.koha Makefile cgi-bin conf templates plugins integration docs tools test $(PROGNAME)
	mkdir -p $(PROGNAME)/lib/extjs2/resources
	mkdir -p $(PROGNAME)/lib/extjs2/resources/images/default
	cp -r lib/extjs2/resources/css $(PROGNAME)/lib/extjs2/resources/css
	cp -r lib/extjs2/resources/images/default $(PROGNAME)/lib/extjs2/resources/images
	cp -r tools $(PROGNAME)
	cp -r ui $(PROGNAME)
	cp build/index.html $(PROGNAME)/build
	cp build/lib.js $(PROGNAME)/build
	cp build/styles.css $(PROGNAME)/build
	cp src/index.html $(PROGNAME)/src
	cp install.pl $(PROGNAME)
	tar -cvf $(PROGNAME).tar $(PROGNAME)
	gzip $(PROGNAME).tar
	zip -r $(PROGNAME).zip $(PROGNAME)
	rm -rf $(PROGNAME)


distclean:
	@echo "Removing distributions"
	@echo
	rm -rf $(PROGNAME)
	rm -rf $(PROGNAME).zip
	rm -rf $(PROGNAME).tar.gz

clean: 
	@echo "Removing concatenated and packed biblios files"
	@echo
	-rm -f build/*
	-rm -rf build/lib
	-rm -rf build/css
	@echo "Removing generated index.html"
	@echo
	-rm -f build/index.html

tags: 
	$(CTAGS) ui/js/biblios.js ui/js/db.js ui/js/search.js ui/js/ui.js ui/js/save.js ui/js/edit.js ui/js/options.js ui/js/init.js ui/js/prefs.js

koha-install: checkperlkohadeps
	mkdir -p $(KOHACGIDIR)/plugins/biblios
	mkdir -p $(KOHADIR)/lib/biblios
	mkdir -p $(KOHADIR)/lib/biblios/ui
	mkdir -p $(KOHADIR)/lib/biblios/lib/extjs2/resources 
	mkdir -p $(KOHADIR)/lib/biblios/lib/extjs2/resources/images/images
	cp -r ui/images ui/xsl $(KOHADIR)/lib/biblios/ui
	cp -r tools $(KOHADIR)/lib/biblios
	cp -r plugins $(KOHADIR)/lib/biblios
	cp -r conf $(KOHADIR)/lib/biblios
	cp -r templates $(KOHADIR)/lib/biblios
	cp -r macros $(KOHADIR)/lib/biblios
	cp build/biblios.tmpl $(KOHADIR)/modules/cataloguing/biblios.tmpl
	cp integration/koha/z3950 $(KOHACGIDIR)/svc
	cp integration/koha/biblios.pl $(KOHACGIDIR)/cataloguing/
	cp integration/koha/proxy_auth_cookie $(KOHACGIDIR)/svc/
	cp cgi-bin/* $(KOHACGIDIR)/plugins/biblios/
	cp build/lib.js $(KOHADIR)/lib/biblios/
	cp lib/google_gears/gears_init.js $(KOHADIR)/lib/biblios/
	cp build/styles.css $(KOHADIR)/lib/biblios/
	cp ui/css/reset.css $(KOHADIR)/lib/biblios/
	cp -r lib/extjs2/resources/css $(KOHADIR)/lib/biblios/lib/extjs2/resources
	cp -r lib/extjs2/resources/images/default $(KOHADIR)/lib/biblios/lib/extjs2/resources/images

koha-install-symlinks:
	mkdir -p $(KOHACGIDIR)/plugins/biblios
	mkdir -p $(KOHADIR)/lib/biblios
	mkdir -p $(KOHADIR)/lib/biblios/ui
	mkdir -p $(KOHADIR)/lib/biblios/lib/extjs2/resources 
	mkdir -p $(KOHADIR)/lib/biblios/lib/extjs2/resources/images/images
	ln -s `pwd`/ui/images $(KOHADIR)/lib/biblios/ui
	ln -s `pwd`/ui/xsl $(KOHADIR)/lib/biblios/ui
	ln -s `pwd`/tools $(KOHADIR)/lib/biblios
	ln -s `pwd`/plugins $(KOHADIR)/lib/biblios
	ln -s `pwd`/conf $(KOHADIR)/lib/biblios
	ln -s `pwd`/templates $(KOHADIR)/lib/biblios
	ln -s `pwd`/macros $(KOHADIR)/lib/biblios
	ln -s `pwd`/build/biblios.tmpl $(KOHADIR)/modules/cataloguing/biblios.tmpl
	ln -s `pwd`/integration/koha/z3950 $(KOHACGIDIR)/svc/z3950
	ln -s `pwd`/integration/koha/biblios.pl $(KOHACGIDIR)/cataloguing/biblios.pl
	ln -s `pwd`/integration/koha/proxy_auth_cookie $(KOHACGIDIR)/svc/proxy_auth_cookie
	ln -s `pwd`/cgi-bin/* $(KOHACGIDIR)/plugins/biblios/
	ln -s `pwd`/build/lib.js $(KOHADIR)/lib/biblios/lib.js
	ln -s `pwd`/lib/google_gears/gears_init.js $(KOHADIR)/lib/biblios/gears_init.js
	ln -s `pwd`/build/styles.css $(KOHADIR)/lib/biblios/styles.css
	ln -s `pwd`/ui/css/reset.css $(KOHADIR)/lib/biblios/reset.css
	ln -s `pwd`/lib/extjs2/resources/css $(KOHADIR)/lib/biblios/lib/extjs2/resources
	ln -s `pwd`/lib/extjs2/resources/images/default $(KOHADIR)/lib/biblios/lib/extjs2/resources/images

koha-uninstall:
	@echo Uninstalling biblios files from koha path $(KOHADIR)
	@echo
	-rm -f $(KOHADIR)/modules/cataloguing/biblios.tmpl
	-rm -f $(KOHACGIDIR)/cataloguing/biblios.pl
	-rm -f $(KOHADIR)/includes/doc-head-close-biblios.inc
	rm -rf $(KOHACGIDIR)/plugins/biblios
	rm -rf $(KOHADIR)/lib/biblios
	rm -rf $(KOHACGIDIR)/svc/z3950
	rm -rf $(KOHACGIDIR)/svc/proxy_auth_cookie

perldeps:
	@echo "Creating file containing required perl modules and versions in tools/perldeps.txt (requires Devel::Modlist)"
	cat tools/*.pl cgi-bin/*.pl *.pl > tools/perlscripts.txt
	perl -d:Modlist -MDevel::Modlist=stop,nocore,zerodefault,stdout tools/perlscripts.txt > tools/perldeps.txt 2> /dev/null

perlkohadeps:
	@echo "Creating file containing required perl modules and versions in (including Koha scripts) tools/perldeps.txt (requires Devel::Modlist)"
	cat tools/*.pl cgi-bin/*.pl *.pl integration/koha/*.pl integration/koha/proxy_auth_cookie integration/koha/z3950 > tools/perlkohascripts.txt
	perl -I$(KOHACGIDIR) -d:Modlist -MDevel::Modlist=stop,nocore,zerodefault,stdout tools/perlkohascripts.txt > tools/perlkohadeps.txt 2> /dev/null

checkperldeps:
	perl tools/check_perl_deps.pl `cat tools/perldeps.txt`

checkperlkohadeps:
	perl tools/check_perl_deps.pl `cat tools/perlkohadeps.txt`

