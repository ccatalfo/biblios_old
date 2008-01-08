CTAGS=ctags
JSMIN=tools/jsmin 
CAT=cat
SRCS=ui/js/*.js 
ALLSRC=$(SRCS) index.html

all: $(SRCS)
	$(CAT) ui/js/marcrecord.js ui/js/marceditor.js ui/js/db.js ui/js/search.js ui/js/ui.js ui/js/save.js ui/js/edit.js ui/js/options.js plugins/koha.js ui/js/init.js ui/js/prefs.js > ui/js/biblios_all.js
	$(JSMIN) <ui/js/biblios_all.js >ui/js/biblios_packed.js

tags: $(SRCS)
	$(CTAGS) ui/js/marcrecord.js ui/js/marceditor.js ui/js/db.js ui/js/search.js ui/js/ui.js ui/js/save.js ui/js/edit.js ui/js/options.js plugins/koha.js ui/js/init.js ui/js/prefs.js

debug: 
	sed -f sed_generate_index_debug < index.html > index-debug.html

koha:
	 perl prefix_lib_dirs.pl index.html index-koha.html "koha-tmpl/intranet-tmpl/prog/en/lib/biblios/"
