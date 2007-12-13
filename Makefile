CTAGS=ctags
JSMIN=jsmin 
CAT=cat
SRCS=ui/js/*.js 
ALLSRC=$(SRCS) index.html

all: $(SRCS)
	$(CAT) ui/js/marcrecord.js ui/js/marceditor.js ui/js/db.js ui/js/search.js ui/js/ui.js ui/js/save.js ui/js/edit.js ui/js/options.js plugins/koha.js ui/js/init.js ui/js/prefs.js > ui/js/biblios_all.js
	$(JSMIN) <ui/js/biblios_all.js >ui/js/biblios_packed.js

tags: $(SRCS)
	$(CTAGS) ui/js/*.js

debug: 
	sed 's|debug = 0|debug = 1|' < index.html > index-debug.html
	set 's|biblios_packed.js|biblios_all.js|' < index.html > index-debug.html
	sed 's|ext-all.js|ext-all-debug.js|' < index.html > index-debug.html
	sed 's|jquery-1.1.3.1.pack.js|jquery-1.1.3.1.js|' < index.html > index-debug.html


	
