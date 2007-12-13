var selectedElement, editorSelection;

/*
    Function: getLeaderFromEditor

    Serialize the leader values from the fixed field editor into a string suitable to be placed in <leader> element of marcxml document.

    Parameters:

    ff_ed: the fixed field editor

    Returns:

    leaderval: string containing serialized leader from editor

*/

function getLeaderFromEditor(ff_ed) {
	var leaderval = '';
	var rlen = $("#RLen", ff_ed ).val(); // record length
	var base = $("#Base", ff_ed).val(); // base address of variable fields
	var rstat = $("#RStat", ff_ed ).val();
	var type = $("#Type", ff_ed ).val();
	var blvl = $("#BLvl", ff_ed ).val();
	var ctrl = $("#Ctrl", ff_ed ).val();
	var encode = $("#Enc", ff_ed ).val();
	var indc = '2'; // indicator count = 2	
	var subc = '2'; // subfield count = 2
	var elvl = $("#ELvl", ff_ed ).val();
	var desc = $("#Desc", ff_ed ).val();
	var link = $("#Link", ff_ed ).val();
	var entry = '4500'; // entry
   	leaderval = leaderval.concat( rlen, rstat, type, blvl, ctrl, encode, indc, subc, base, elvl, desc, link, entry);	
    return leaderval;
}

/* 
    Function: get008FromEditor

    Get string representation of 008 from fixed fields editor.

    Parameters:

    ff_ed: the fixed field editor

    Returns:

    tag008val: string version of 008

*/

function get008FromEditor(ff_ed) {
	var tag008val = '';
	var dateentered = $("#DateEntered", ff_ed ).val();
	var datestatement  = $("#DtSt", ff_ed ).val();
	var date1 = $("#Date1", ff_ed ).val();
	var date2 = $("#Date2", ff_ed ).val();
	var ctry = $("#Ctry", ff_ed ).val();
	var lang = $("#Lang", ff_ed ).val();
	var mrec = $("#MRec", ff_ed ).val();
	var srce = $("#Srce", ff_ed ).val();

	var type = $("#Type", ff_ed ).val();
	if(debug) {console.info('record type is: ' + type);}
	// if we have a print material
	if( type == 'a' || type == 't') { 
	    var ill = $("#Ills", ff_ed ).val();
	    var audn = $("#Audn", ff_ed ).val();
	    var form = $("#Form", ff_ed ).val();
	    var contents = $("#Contents", ff_ed).val(); 
	    var govpub = $("#GovPub", ff_ed).val(); 
	    var conf = $("#Conf", ff_ed).val();
	    var fest = $("#Fest", ff_ed).val();
	    var indx = $("#Indx", ff_ed).val();
	    var undef = " "; // undefined: either blank or |
	    var litf = $("#LitF", ff_ed).val();
	    var bio = $("#Bio", ff_ed).val();
	    // add these vals to complete 008 for books
	    tag008val = tag008val.concat( dateentered, datestatement, date1, date2, ctry, ill, audn, form, contents, govpub, conf, fest, indx, undef, litf, bio, lang, mrec, srce);
	}
	// computer files
	else if( type == 'm' ) {
		var char1821 = "    "; // 4 undefines
	    var audn = $("#Audn", ff_ed ).val();
		var char2325 = "   "; // 3 undefines
		var file = $("#File", ff_ed ).val();
		var char27 = " "; // undefined
	    var govpub = $("#GovPub", ff_ed).val(); 
		var char2934 = "     "; // 5 undefines
		tag008val = tag008val.concat( dateentered, datestatement, date1, date2, ctry, char1821, audn, char2325, file, char27, govpub, char2934 );
	}
	else if( type == 'e'|| type =='f' ) {
		var relief = $("#Relief", ff_ed).val();
		var proj = $("#Proj", ff_ed).val();
		var undef1 = " ";
		var cart = $("#Cart", ff_ed).val();
		var undef2 = "  "; 
	    var govpub = $("#GovPub", ff_ed).val(); 
	    var form = $("#Form", ff_ed ).val();
	    var indx = $("#Indx", ff_ed).val();
		var spchar = $("#SpChar", ff_ed).val();
		tag008val = tag008val.concat( dateentered, datestatement, date1, date2, ctry, relief, proj, undef1, cart, undef2, govpub, form, undef1, indx, undef1, spchar );
	}
	else if( type == 'c' || type == 'd' || type == 'j' ) {
		var compform = $("#CompForm", ff_ed).val();
		var format = $("#Format", ff_ed).val();
		var parts = $("#Parts", ff_ed).val();
		var audn = $("#Audn", ff_ed).val();
	    var form = $("#Form", ff_ed ).val();
		var accomp = $("#Accomp", ff_ed).val();
		var littext = $("#LitText", ff_ed).val();
		var undef1 = " ";
		var trarr = $("#TrArr", ff_ed).val();
		tag008val = tag008val.concat( dateentered, datestatement, date1, date2, ctry, compform, format, parts, audn, form, accomp, littext, undef1, trarr, undef1 );
	}
    return tag008val;
}

/*

*/
function updateFFEditor(ff_ed) {
	if(debug) { console.info("updating fixed field editor from leader and 008 tags"); }
    var oDomDoc = Sarissa.getDomDocument();
    var leaderval = $("#000", UI.editor.doc).children('.controlfield').val();
    var tag008val = $("#008", UI.editor.doc).children('.controlfield').val();
    if(debug) {
        console.info('Transferring leader value to fixed field editor from leader tag: ' + leaderval);
        console.info('Transferring 008 value to fixed field editor from 008 tag: ' + tag008val);
    }
    var newff = '<collection xmlns="http://www.loc.gov/MARC21/slim">';
    //"<?xml version='1.0' encoding='UTF-8'?>";
    newff += "<record><leader>";
    newff += leaderval;
    newff += "</leader>";
    newff += "<controlfield tag='008'>";
    newff += tag008val;
    newff += "</controlfield>";
    newff += "</record>";
    newff += "</collection>";
	//FIXME make this an jquery.xslTransform call
    $("#ffeditor").empty();
    $("#ffeditor").getTransform( fixedFieldXslPath, newff);
}
    
/*
   Function: Edit2XmlMarc21

   Using the fixed fields editor html and variable fields editors passed in as parameters, construct a MARCXML record and return its xml.

   Parameters:

   ff_ed: the html element containing the fixed fields
   var_ed: the html element containing the variable fields

   Returns: 

   A MARCXML record.

*/
function Edit2XmlMarc21(ff_ed, var_ed) {
	var marcxml = Sarissa.getDomDocument('', '');
	var record = marcxml.createElementNS("http://www.loc.gov/MARC21/slim", 'record');
	marcxml.appendChild(record);
	// update fixed field editor if it's not visible so we get most current version of leader, 008
	if( !Ext.get('ffeditor').isVisible() ) {
		updateFFEditor(ff_ed);
	}
	// serialize leader and fixed fields
	var leader = marcxml.createElement('leader');
    var leaderval = getLeaderFromEditor(ff_ed);
    if(debug) {
        console.info('leader: ' + leaderval);
        console.info('leader length: ' + leaderval.length);
    }
	var lv = marcxml.createTextNode(leaderval);
	leader.appendChild(lv);
	record.appendChild(leader);
		
	// serialize 008
	var tag008 = marcxml.createElement('controlfield');
	tag008.setAttribute('tag', '008');
    var tag008val = get008FromEditor(ff_ed);
    if(debug) {
        console.info('tag008: ' + tag008val);
        console.info('tag008 length: ' + tag008val.length);
    }
	var tag008v = marcxml.createTextNode(tag008val);
	tag008.appendChild(tag008v);
	record.appendChild(tag008);

	// for each input w/ id containing the text "subfields"...
	$("[@id*=subfields]", var_ed).each( function() { 
		var id = $(this).get(0).id;
		// what kind of field is this, c=controlfield or d=datafield?
		var type = id.substring(0, 1);
		// what's the tag number?
		var tag = $(this).parents('.tag').children('.tagnumber').val();
        if(debug) {
            console.info("Saving tag: " + tag);
        }
		// if controlfield	
		if( type == 'c') {
			if( tag != '008' && tag != '000') { // skip 000 and 008 since we generate from dropdowns
				var cf = marcxml.createElement('controlfield'); 
				cf.setAttribute('tag', tag);
				var text = marcxml.createTextNode( $(this).val());
                if(debug) {
                    console.info("Saving controlfield text: " + $(this).val());
                }
				cf.appendChild(text);
				record.appendChild(cf);
			}
		}
		// if datafield
		else if( type == 'd') {
            // get the tag + numeric suffix identifier so we can grab the associated indicators
            var tag_with_suffix = id.substr(10);
			var df = marcxml.createElement('datafield');
			var tagAttr = marcxml.createAttribute('tag');		
			tagAttr.nodeValue = tag;
			df.setAttributeNode(tagAttr);
			// set indicator attributes
			var indid1 = 'dind1' + tag_with_suffix;	
			var ind1val = $("[@id="+indid1+"]", var_ed).val();
			var indid2 = 'dind2' + tag_with_suffix;	
			var ind2val = $("[@id="+indid2+"]", var_ed).val();
            // set indicators from displayed # to proper " "
            if( ind1val == "#") {
                ind1val = " ";
            }
            if( ind2val == "#") {
                ind2val = " ";
            }
			df.setAttribute('ind1', ind1val);
			df.setAttribute('ind2', ind2val);
			// create <subfield> elems for this datafield
			var subfields = '';
			$('input', $(this)).each( function() {
				var id = $(this).get(0).id;
				if( Ext.ComponentMgr.get(id) ) {
					subfields += Ext.ComponentMgr.get(id).getValue();
				}
				else {
					subfields += $(this).val();
				}
			});
            if(debug) {
                console.info("Saving subfields: " + subfields);
            }
			// split on Double Dagger as subfield delimiter
			var sfsplit = subfields.split("\u2021");
			// start index at 1; first split is empty
			for( var i = 1; i< sfsplit.length; i++) {
				var sf = marcxml.createElement('subfield');
				var code = sfsplit[i].substring(0, 1);	
				sf.setAttribute('code', code);
				var text = marcxml.createTextNode( sfsplit[i].substring(1) );
				sf.appendChild(text);
				df.appendChild(sf);	
			}
			record.appendChild(df);
		} 
	});
	

	var marcxmlAsString = (new XMLSerializer().serializeToString(marcxml));
	//console.info("serialized marc editor into marcxml: " + marcxmlAsString);
	return marcxmlAsString;	
}

function editorGetSelectedElement() {
        editorSelection = rte_editor._getSelection();
        var selectedElement;
        // if the cursor is focused on a text Node, make the selectedElement its parent
        if( editorSelection.focusNode.nodeType == 3 ) {
            selectedElement = $( editorSelection.focusNode ).parent();  
        }
        // if the cursor is focused on an element
        else if ( editorSelection.focusNode.nodeType == 1 )  {
            selectedElement = $(editorSelection.focusNode);
        }
		return selectedElement;
}

function editorKeyPress(o) {
        editorSelection = rte_editor._getSelection();
		var selectedElement = editorGetSelectedElement();
        if(debug) {
          console.info('keyCode: ' + o.ev.keyCode);
          console.info('charCode: ' + o.ev.charCode);
          console.info('ctrl: ' + o.ev.ctrlKey);
          console.info('alt: ' + o.ev.altKey);
          console.info('shift: ' + o.ev.shiftKey);
          console.info('focusNode: ' + editorSelection.focusNode);
          console.info('focusOffset: ' + editorSelection.focusOffset);
          console.info('selectedElement: ' + $(selectedElement).text());
        }
		// if we're in an autocomplete input text box, don't bother with all of this checking

        // disallow up (keyCode == 38) and down arrows (keyCode == 40)
        if( (o.ev.keyCode == 38) || (o.ev.keyCode == 40) ) {
			if( $(selectedElement).is('.ac_input') ) {
				return true;
			}
			else {
				YAHOO.util.Event.stopEvent(o.ev);
				return false;
			}
        }
        // disallow left arrow if we're at beginning of element ev.keyCode == 37, unless we're moving into a subfield delimiter, which is ok
        else if( o.ev.keyCode == 37 ) {
          editorMoveLeft(o, editorSelection, selectedElement);
        }
        // disallow right arrow if we're at end of element ev.keyCode == 39.  But if we're in a subfield delimiter, go ahead and move right
        else if( o.ev.keyCode == 39 ) {
          editorMoveRight(o, editorSelection, selectedElement);
        }
        // check for key to move to start of element (HOME)
        else if( o.ev.keyCode == 36 ) {
          YAHOO.util.Event.stopEvent(o.ev);
          editorMoveElementStart(o, editorSelection, selectedElement);
        }
        // check for key to move to end of element (END)
        else if( o.ev.keyCode == 35 ) {
          YAHOO.util.Event.stopEvent(o.ev);
          editorMoveElementEnd(o, editorSelection, selectedElement);
        }
        // check for BACKSPACE: disallow deleting first subfield delimiter
        else if( o.ev.keyCode == 8 ) {
          editorBackspace(o, editorSelection, selectedElement);
        }
        // check for adding subfield shortcut (CTRL+M)
        else if( (o.ev.ctrlKey == true) && (o.ev.charCode == 109) ) {
           YAHOO.util.Event.stopEvent(o.ev);
           if(debug) { console.info('got keypress for addSubfield()');  };
           addSubfield(o, selectedElement, editorSelection);
        }
        // check for moving between subfields to the left shortcut (SHIFT+TAB)
        else if( (o.ev.keyCode == 9 ) && (o.ev.shiftKey == true) ) {
          YAHOO.util.Event.stopEvent(o.ev);
          editorPrevSubfield(o, editorSelection, selectedElement);
        }
        // check for moving between subfields shortcut (TAB)
        else if( (o.ev.keyCode == 9 ) ) {
          YAHOO.util.Event.stopEvent(o.ev);
          editorNextSubfield(o, editorSelection, selectedElement);
        }
        // check for moving to prev tag ( SHIFT+ENTER )
        else if( (o.ev.keyCode == 13) && (o.ev.shiftKey == true) ) {
          YAHOO.util.Event.stopEvent(o.ev);
          editorPrevTag(o, editorSelection, selectedElement);
        }
        // check for moving to next tag ( ENTER )
        else if( (o.ev.keyCode == 13) ) {
						if( $(selectedElement).is('.ac_input') ) {
							return true;
						}
						else {
								YAHOO.util.Event.stopEvent(o.ev);
								editorNextTag(o, editorSelection, selectedElement);
						}
        }
		  // check for length limits for the selectedElement if we have a non special char
		  else {
		  	editorCheckFieldLimits(o, editorSelection, selectedElement);
		  }
}

function doRecordOptions() {

}

function doMerge() {

}


/* Function: addSubfield

   Insert a new subfield node into an existing marcxml document at the cursor insertion point.

   Parameters:

   selectedElement: the element in the editor which is currently selected
   editorSelection: the selection currently in the editor

   Returns:

   None.

*/
function addSubfield(afterEl) {
		 // get a new random id for the new elements
		 var newid="newsubfield-" + Math.floor(Math.random()*100);    
		$(afterEl).parents('.subfield').after("<span id='subfield-"+newid+"' class='subfield'><input id='delimiter-"+newid+"' length='2' maxlength='2' class='subfield-delimiter' value='&Dagger;'><input id='subfield-text-'"+newid+"' class='subfield-text'></span>");
		//$('delimiter'+newid).get(0).focus();
}

/*
   Function: doAddField

   Prompt the user to choose a marc tag to add, then add that field to the marceditor.

   Parameters:

   None.

   Returns:

   None.

*/
function addField(tagnumber, ind1, ind2, subfields) {
	if( tagnumber ) {
		_addField(tagnumber, ind1, ind2, subfields);
	}
	else {
		Ext.MessageBox.prompt('Add tag', 'Choose a tag number', function(btn, tagnumber) {
			_addField(tagnumber);
		});
	}

	function _addField(tagnumber, ind1, ind2, subfields) {
		var firstind = ind1 || '#';
		var secondind = ind2 || '#';
		var sf = subfields || [ {'delimiter': 'a', 'text': ''} ];
		if(debug) { console.info("Adding tag with tagnumber: " + tagnumber);  }; 

		// insert the new field in numerical order among the existing tags
		var tags = $(".tag", UI.editor.doc );
		var tagToInsertAfter; // the tag just before where we'll insert the new tag
		var highestSuffix = 1; // highest number appended to tag id's with this tag number.  Add 1 to it to get suffix for new tag
		var newSuffix = 1;
		for( var i = 0; i<tags.length; i++) {
			var id = $(tags[i]).attr('id').substr(0,3);
			if( id < tagnumber) {
				tagToInsertAfter = tags[i];
			}
			// get a new suffix number for our new tags id
			else if( id == tagnumber ) {
				var currSuffix = $(tags[i]).attr('id').substr(3);
				if( currSuffix > highestSuffix ) {
					highestSuffix = currSuffix;
				} 
			}
		}
		newSuffix = highestSuffix + 1;
		var newId = tagnumber + "-" + newSuffix;
		  var newtag = '<div class="tag" id="'+newId+'">';
		  newtag += '<input class="tagnumber" id="d'+tagnumber+'" value="'+tagnumber+'" />';
		  newtag += '<input size="2" class="indicator" value="'+firstind+'" id="dind1'+newId+'"/>';
		  newtag += '<input size="2" class="indicator" value="'+secondind+'" id="dind2'+newId+'"/>';
		  newtag += '<span class="subfields" id="dsubfields'+newId+'">';
		  for( var i = 0; i< sf.length; i++) {
			  newtag += '<span class="subfield" id="'+tagnumber+newId+'">';
			  newtag += '<input class="subfield-delimiter" maxlength="2" size="2" value="&Dagger;'+sf[i]['delimiter']+'">';
			  var textlength = sf[i]['text'].length;
			  newtag += '<input id="'+tagnumber+newId+i+'text"class="subfield-text" size="'+textlength+'" value="'+sf[i]['text']+'">';
			}
		// insert out new tag after the tag we just found
		$(tagToInsertAfter, UI.editor.doc).after(newtag);
		// set the focus to this new tag
		$( newId ).get(0).focus();
  }
}

/*
   Function: doDeleteField

   Prompt the user to choose a marc tag to delete, then delete that field from the marceditor.

   Parameters:

   None.

   Returns:

   None.

*/
function doDeleteField() {
  Ext.MessageBox.prompt('Delete Tag', 'Choose a tag to delete', function(btn, tagnumber) {
      showStatusMsg("Removing tag " + tagnumber);
      // remove entire tag of the first matching element
      $(".tag[@id^='"+tagnumber+"']", rte_editor._getDoc()).eq(0).remove();
      showStatusMsg("Tag " + tagnumber + " removed");
  });
}

/*
   Function: doEditField

   Prompt the user to choose a marc tag to edit, then set the focus to that field for editing.

   Parameters:

   None.

   Returns:

   None.

*/
function doEditField() {
    Ext.MessageBox.prompt('Edit field', 'Choose a tag to edit', function(btn, tagnumber) {
        showStatusMsg("Editing tag " + tagnumber);
        MoveToTag(tagnumber);
    });
}


/*
Function: editorMoveToTag

    Move the cursor to the specified tag in the marc editor.

Parameters:

    tagnumber: A string holding the tag number to move the cursor to.

Returns:

    None.

*/
function editorMoveToTag(tagnumber) {
    var editorSelection = rte_editor._getSelection();
    // get home div
    var home = $("#home", rte_editor._getDoc()).get(0);
    editorSelection.extend(home, 0);
    editorSelection.collapseToStart();
    // get tag for wanted tagnumber
    var wantedtag = $("[@id^="+tagnumber, rte_editor._getDoc()).get(0);
    editorSelection.extend(wantedtag, 0);
    editorSelection.collapseToEnd();
    rte_editor._focusWindow();
}


/*
Function: editorBackspace 

    

Parameters:

    

Returns:

    None.

*/
function editorBackspace(o, editorSelection, selectedElement) {
  // if we're in a subfield-text, we can backspace over anything
  if( $(selectedElement).is('.subfield-text') ) {
    return true;
  }
  else if( $(selectedElement).is('.subfield-delimiter') && (editorSelection.focusOffset == 1)) {
    // if we're in the first subfield delimiter of the tag, don't let the user delete it
    if( $(selectedElement).parent().prev().length == 0 ) {
      YAHOO.util.Event.stopEvent(o.ev);
      return false;
    }
  }
  // if we're at the beginning of an element, don't let us leave it by backspacing out
  else if( editorSelection.focusOffset == 0 ) {
    YAHOO.util.Event.stopEvent(o.ev);
    return false;
  }
  else {
    return true;
  }
}

/*
Function: editorMoveLeft 

    

Parameters:

    

Returns:

    None.

*/
function editorMoveLeft(o, editorSelection, selectedElement) {
    if( $(selectedElement).is('.subfield-text') ) {
      return true;
    }
    else if( editorSelection.focusOffset == 0 ) {
      YAHOO.util.Event.stopEvent(o.ev);
      return false;
    }
}

/*
Function: editorMoveRight

    

Parameters:

    

Returns:

    None.

*/
function editorMoveRight(o, editorSelection, selectedElement) {
    var isDelimiter = $(selectedElement).is('.subfield-delimiter');
    if( isDelimiter == true ) {
      return true;
    }
    else if( editorSelection.focusOffset == editorSelection.focusNode.length ) {
      YAHOO.util.Event.stopEvent(o.ev);
      return false;
    }
}


/*
Function: editorNextSubfield

    

Parameters:

    

Returns:

    None.

*/
function editorNextSubfield(o, editorSelection, selectedElement) {
    // get the subfields collection if we're in a subfield-delimiter or subfield-text
    if( $(selectedElement).is('.subfield-delimiter') || $(selectedElement).is('.subfield-text') ) {
      selectedElement = $(selectedElement).parent();
    }
    // get the next element
    var next = $(selectedElement).next();
    if(debug) { console.info('tab key pressed: next element is: ' + $(next).text()); }
    // see if the next element is a collection of subfields.  if so, get the first individual subfield
    if( $(next).is('.subfields') ) {
      next = $(next).children().eq(0);
    }
    if( next.length > 0 ) {
      if( $(next).is('.subfield') ){
        editorSelection.extend( $(next).children().get(1), 0 );
      }
      else if( $(next).is('div') ) {
        return false;
      }
      else {
        editorSelection.extend( $(next).get(0), 0 );
      }
      editorSelection.collapseToEnd();
      editorSetFocus(next);
    }
}


/*
Function: editorPrevSubfield

    

Parameters:

    

Returns:

    None.

*/
function editorPrevSubfield(o, editorSelection, selectedElement) {
    // get the subfields collection if we're in a subfield-delimiter, subfield-text, or an entire subfield (so we move back into indicator 2)
    if( $(selectedElement).is('.subfield-delimiter') || $(selectedElement).is('.subfield-text')) {
      selectedElement = $(selectedElement).parent();
    }
    // if we're on the first <span class='subfield'>, set selectedElement to the parent <span class='subfields'> so we can move back to the indicators
    if( $(selectedElement).prev().length == 0 ) {
      selectedElement = $(selectedElement).parent();
    }
    // get the previous element
    var prev = $(selectedElement).prev();
    // see if the next element is a collection of subfields.  if so, get the first individual subfield
    if( $(prev).is('.subfield') ) {
      prev = $(prev).children().eq(0);
    }
    if(debug) { console.info('previous subfield key pressed: prev element is: ' + $(prev).text()); }
    if( prev.length > 0 ) {
      if( $(prev).is('.subfield')) {
        editorSelection.extend( $(prev).children().get(1), 0 );
      }
      else if( $(prev).is('div') ) {
        return false;
      }
      else {
        editorSelection.extend( $(prev).get(0), 0 );
      }
      editorSelection.collapseToStart();
      editorSetFocus(prev);
    }
}


/*
Function: editorNextTag

    

Parameters:

    

Returns:

    None.

*/
function editorNextTag(o, editorSelection, selectedElement) {
  var selectedElement = editorGetSelectedElement();
  var currTag = $(selectedElement).parents('.tag');
  var nextTag = $(currTag).next();
  if( nextTag.length > 0 ) {
    editorSelection.extend( $(nextTag).children().get(0), 0 );
    editorSelection.collapseToEnd();
    // set focus to tagnumber
    editorSetFocus( $(nextTag).children().get(0) );
    // scroll contentpanel containing the editor
    Ext.get('marccontent').scroll('down', 30);
	// scroll record-toolbar, too
	Ext.get('record-toolbar').scroll('down', 30);
  }
  else {
    return false;
  }
}


/*
Function: editorPrevTag

    

Parameters:

    

Returns:

    None.

*/
function editorPrevTag(o, editorSelection, selectedElement) {
  var currTag = $(selectedElement).parents('.tag');
  var prevTag = $(currTag).prev();
  if( prevTag ) {
    editorSelection.extend( $(prevTag).children().get(0), 0 );
    editorSelection.collapseToStart();
    // set focus to tagnumber
    editorSetFocus( $(prevTag).children().get(0) );
    // scroll contentpanel containing the editor
    Ext.get('marccontent').scroll('up', 30);
	// scroll record-toolbar, too
	Ext.get('record-toolbar').scroll('up', 30);
  }
  else {
    return false;
  }
}


/*
Function: editorMoveElementStart

   Move to the start of a marceditor element (i.e., subfield, tagnumber).

Parameters:

    

Returns:

    None.

*/
function editorMoveElementStart(o, editorSelection, selectedElement) {
  // move the cursor to the beginning of this element
  editorSelection.extend( $(editorSelection).get(0).focusNode, 0 );
  editorSelection.collapseToStart();
}

/*
Function: editorMoveElementEnd

   Move to the start of a marceditor element (i.e., subfield, tagnumber).

Parameters:

    

Returns:

    None.

*/
function editorMoveElementEnd(o, editorSelection, selectedElement) {
  // move the cursor to the end of this element
  editorSelection.extend( $(editorSelection.focusNode).get(0), editorSelection.focusNode.length );
  editorSelection.collapseToEnd();
}

/*
Function: editorSetFocus

   Set the focus class(es) to the passed in element.  Remove focus classes from all other elements in the editor. 

Parameters:

   element: the element which is to get focus 

Returns:

    None.

*/
function editorSetFocus(element) {
  if(debug) { console.info( 'editorSetFocus: setting focus to ' + $(element).text() + ' and removing all other focuseses'); }
  // remove focus from all other elements in the editor
  $("span", rte_editor._getDoc()).removeClass('focused-tagnumber');
  $("span", rte_editor._getDoc()).removeClass('focused-indicator');
  $("span", rte_editor._getDoc()).removeClass('focused-subfield-text');
  $("span", rte_editor._getDoc()).removeClass('focused-subfield-delimiter');
  $("span", rte_editor._getDoc()).removeClass('focused-controlfield');
  $("span", rte_editor._getDoc()).removeClass('highlighted');
  $("div", rte_editor._getDoc()).removeClass('focused');
  $("div", rte_editor._getDoc()).removeClass('highlighted');
  $("div", rte_editor._getDoc()).removeClass('focused-tag');
  // set focus based on what type of element we're given
  // if we're in a <div class='tag'>, set focus to the tagnumber
  if( $(element).is('.tag') ) {
    $(element).addClass('focused-tag');
    $(element).children().get(0).addClass('focused-tagnumber');
  }
  else if( $(element).is('.tagnumber') ) {
    // set tag focus
    $(element).parents('.tag').addClass('focused-tag');
    $(element).addClass('focused-tagnumber');
    $(element).addClass('highlighted');
  }
  else if( $(element).is('.indicator') ) {
    $(element).parents('.tag').addClass('focused-tag');
    $(element).addClass('focused-indicator');
    $(element).addClass('highlighted');
  }
  else if( $(element).is('.controlfield') ) {
    $(element).parents('.tag').addClass('focused-tag');
    $(element).addClass('focused-controlfield');
    $(element).addClass('highlighted');
  }
  else if( $(element).is('.subfield') ) {
    $(element).parents('.tag').addClass('focused-tag');
    $(element).children(0).addClass('focused-subfield-delimiter');
    $(element).children(0).addClass('highlighted');
    $(element).children(1).addClass('focused-subfield-text');
    $(element).children(1).addClass('highlighted');
  }
  else if( $(element).is('.subfield-delimiter') ){
    $(element).parents('.tag').addClass('focused-tag');
    $(element).addClass('focused-subfield-delimiter');
    $(element).addClass('highlighted');
    $(element).siblings().eq(0).addClass('focused-subfield-text');    
    $(element).siblings().eq(0).addClass('highlighted');    
  }
  else if( $(element).is('.subfield-text') ) {
    $(element).parents('.tag').addClass('focused-tag');
    $(element).addClass('focused-subfield-text');
    $(element).addClass('highlighted');
    $(element).siblings().eq(0).addClass('focused-subfield-delimiter');    
    $(element).siblings().eq(0).addClass('highlighted');    
  }
}

/*
Function: displayHelpMsg

  Display a message in the help panel.

Parameters:
  
  msg: String containingin the message to display.

Returns:

  None.

*/
function displayHelpMsg(msg) {

}

/* 
Function: editorCheckFieldLimits

	Check text length limits for the given field.

Parameters:

	o: the html event object
	selectedElement: the element to check
	editorSelection: the current editor selection

Returns:
	
	None.

*/
function editorCheckFieldLimits(o, element, editorSelection) {
        editorSelection = rte_editor._getSelection();
        var selectedElement;
        // if the cursor is focused on a text Node, make the selectedElement its parent
        if( editorSelection.focusNode.nodeType == 3 ) {
            selectedElement = $( editorSelection.focusNode ).parent();  
        }
        // if the cursor is focused on an element
        else if ( editorSelection.focusNode.nodeType == 1 )  {
            selectedElement = $(editorSelection.focusNode);
        }
        if(debug) {
          console.info('editorCheckFieldLimits');
          console.info('keyCode: ' + o.ev.keyCode);
          console.info('charCode: ' + o.ev.charCode);
          console.info('ctrl: ' + o.ev.ctrlKey);
          console.info('alt: ' + o.ev.altKey);
          console.info('shift: ' + o.ev.shiftKey);
          console.info('focusNode: ' + editorSelection.focusNode);
          console.info('focusOffset: ' + editorSelection.focusOffset);
          console.info('field length: ' + editorSelection.focusNode.length);
          console.info('selectedElement: ' + $(selectedElement).text());
        }
		if( $(selectedElement).is('.tagnumber') ) {
			if( $(selectedElement).text().length == 3 ) {	
				YAHOO.util.Event.stopEvent(o.ev);
				return false;
			}
		}
		else if( $(selectedElement).is('.indicator') ) {
			if( $(selectedElement).text().length == 1 ) {	
				YAHOO.util.Event.stopEvent(o.ev);
				return false;
			}
		}
		else if( $(selectedElement).is('.subfield-delimiter') )	{
			if( $(selectedElement).text().length == 2 && editorSelection.focusOffset == 0) {
				YAHOO.util.Event.stopEvent(o.ev);
				return false;
			}
		}
}

/* 
Function: editorCheckHighlighting

	Check syntax highlighting for the current field.

Parameters:

	o: the html event object

Returns:
	
	None.

*/

function editorCheckHighlighting(o) {
        editorSelection = rte_editor._getSelection();
        var selectedElement;
        // if the cursor is focused on a text Node, make the selectedElement its parent
        if( editorSelection.focusNode.nodeType == 3 ) {
            selectedElement = $( editorSelection.focusNode ).parent();  
        }
        // if the cursor is focused on an element
        else if ( editorSelection.focusNode.nodeType == 1 )  {
            selectedElement = $(editorSelection.focusNode);
        }
        if(debug) {
          console.info('editorCheckHighlighting');
          console.info('keyCode: ' + o.ev.keyCode);
          console.info('charCode: ' + o.ev.charCode);
          console.info('ctrl: ' + o.ev.ctrlKey);
          console.info('alt: ' + o.ev.altKey);
          console.info('shift: ' + o.ev.shiftKey);
          console.info('focusNode: ' + editorSelection.focusNode);
          console.info('focusOffset: ' + editorSelection.focusOffset);
          console.info('selectedElement: ' + $(selectedElement).text());
        }

		  // if we're at the end of a subfield-delimiter, bump the cursor into the following subfield-text span
		if( $(selectedElement).is('.subfield-delimiter') ) {
		  	if( $(selectedElement).text().length == 2 && (editorSelection.focusOffset == 1 || editorSelection.focusOffset == 2)) {
				var next = $(selectedElement).next().get(0);
				editorSelection.extend( next, 0 );
				editorSelection.collapseToEnd();
			}
		}
}

/*
    Function: transferFF_EdToTags

    Transfer the values contained in the fixed field editor into tags to display in the marc editor (leader and 008).

    Parameters:

    ff_ed: the fixed field editor

    Returns:

    None.

*/
function transferFF_EdToTags(ff_ed) {
    var leaderval = getLeaderFromEditor(ff_ed);
    $("#000", UI.editor.doc).children('.controlfield').val(leaderval);
    var tag008val = get008FromEditor(ff_ed);
    $("#008", UI.editor.doc).children('.controlfield').val(tag008val);
    if(debug) {
        console.info('Transferring leader value from fixed field editor into leader tag: ' + leaderval);
        console.info('Transferring 008 value from fixed field editor into 008 tag: ' + tag008val);
    }
}


function toggleFixedFieldDisplay(btn, toggled) {
	if( btn.pressed == false ) {
		// hide fixed field editor
		$("#ffeditor").hide();
        // transfer values from fixed field editor into tags
        var ff_ed = $("#ffeditor");
        transferFF_EdToTags(ff_ed);
		// show leader and 008
		$("#000", UI.editor.doc).show();
		$("#008", UI.editor.doc).show();
	}
	else {
        var ff_ed = $("#ffeditor");
        updateFFEditor(ff_ed);
		$("#ffeditor").show();
		// hide leader and 008
		$("#000", UI.editor.doc).hide();
		$("#008", UI.editor.doc).hide();
	}

}

function removeSubfield() {
	if(debug) { console.info('removing subfield with text: ' + $(UI.editor.lastFocusedEl).val());}
	var next = $(UI.editor.lastFocusedEl).parents('.subfield').next().children('.subfield-delimiter');
	var prev = $(UI.editor.lastFocusedEl).parents('.subfield').prev().children('.subfield-delimiter');
	var ind2 = $(UI.editor.lastFocusedEl).parents('.tag').children('.indicator').eq(1);
	// remove current subfield
	$(UI.editor.lastFocusedEl).parents('.subfield').remove();
	// focus next subfield 
	if( $(UI.editor.lastFocusedEl.parents('.subfield').next().length ) ) {
		$(next).focus();
	}
	else if( $(UI.editor.lastFocusedEl.parents('.subfield').prev().length ) ) {
		$(prev).focus();
	}
	// or indicator
	else {
		$(ind2).focus();
	}
}


function removeTag(tagnumber, i) {
	//if(debug) { console.info('removing tag: ' + $(UI.editor.lastFocusedEl).parents('.tag').get(0).id)}
	if( tagnumber ) {
		// remove  the ith tagnumber if we were passed an i
		if( !Ext.isEmpty(i) ) {
			$('.tag').filter('[@id*='+tagnumber+']').eq(i).remove();
		}
		// else remove all!
		else {
			$('.tag').filter('[@id*='+tagnumber+']').remove();
		}
	}
	else {
		// focus previous or next tag
		var prev = $(UI.editor.lastFocusedEl).parents('.tag').prev().children('.tagnumber');
		var next = $(UI.editor.lastFocusedEl).parents('.tag').next().children('.tagnumber');
		$(UI.editor.lastFocusedEl).parents('.tag').remove();
		if( $(next).length ) {
			$(next).focus();
		}
		else {
			$(prev).focus();
		}
	}
}


function create_static_editor() {
	UI.editor.editorDoc = $('#vareditor');
	// setup marceditor macro functionality
	UI.editor.record = setupMacros($('#fixedfields_editor'), UI.editor.editorDoc);
	// setup reserved (locked) tags based on remote ils bib profile
	if( Prefs.remoteILS[ UI.editor.location ] ) {
		setupReservedTags( Prefs.remoteILS[ UI.editor.location ], UI.editor.editorDoc);
		setupSpecialEntries( Prefs.remoteILS[ UI.editor.location ], UI.editor.editorDoc);
	}
	// add editor hotkeys
	setupEditorHotkeys();

	// apply ExtJS comboboxes for live searching of authority data
	setupMarc21AuthorityLiveSearches();
}

function onFocus(elem) {
	$(elem).addClass('focused');
}

function onBlur(elem) {
	$(elem).removeClass('focused');
	UI.editor.record.update(elem);
}

function onFixedFieldEditorBlur(elem) {
	// transfer the fixed field editor values to fixed field tags
	var ff_ed = $("#ffeditor");
	transferFF_EdToTags(ff_ed);
	UI.editor.record.update($('#000').find('.controlfield'));
	UI.editor.record.update($('#008').find('.controlfield'));
}

function setupSpecialEntries(loc, editor) {
	var specialentries = loc.instance.special_entries;
	for( var i = 0; i < specialentries.length; i++) {
		var entry = specialentries.eq(i);
		var tagnumber = $('field/tag', entry).text();	
		var subfield = $('field/subfield', entry).text();	
		// get the element to replace w/ combobox
		var elemToReplace = $('[@id^='+tagnumber+']').children('.subfields').children('[@id*='+subfield+']').children('.subfield-text');
		if(elemToReplace.length == 0) {
			return false;
		}
		var currentValue = $(elemToReplace).val();
		var id = $(elemToReplace).get(0).id;
		// get parent .subfield to render combo to
		var subfield = $(elemToReplace).parents('.subfield');
		// remove current text of elemToReplace
		//$(elemToReplace).remove();
		var valid_values = $('valid_values/value', entry);
		var storevalues = new Array();
		for( j = 0; j < valid_values.length; j++) {
			var value = valid_values.eq(j);
			var code = $('code', value).text();
			var desc = $('description', value).text();
			// store valid values in store
			storevalues.push([code, desc]);
		}
		if(debug) { console.info('Applying combobox to '+tagnumber+' '+subfield+' with current value of ' +currentValue + ' for special entry')}
		var store = new Ext.data.SimpleStore({
			fields: ['code', 'desc'],
			data: storevalues
		});
		var combo = new Ext.form.ComboBox({
			id: id,
			store: store,
			typeAhead: true,
			displayField: 'desc',
			valueField: 'code',
			grow: true,
			mode: 'local',
			selectOnFocus: true,
			value: currentValue,
			triggerAction: 'all',
		});
		Ext.ComponentMgr.register(combo);
		if(debug) { console.info('Applying combobox to '+tagnumber+' '+subfield+' with current value of ' +currentValue + ' for special entry')}
		combo.applyTo( $(elemToReplace).get(0) );
		
	}
}

function setupReservedTags(loc, editor) {
	var reservedtags = loc.instance.reserved_tags;
	for( var i = 0; i< reservedtags.length; i++) {
		var tagnumber = $(reservedtags).eq(i).text();
		// set readonly for tagnumber and indicators
		$('.tag[@id^='+tagnumber+']').children('input').attr('readonly', 'readonly').addClass('reserved_tag');
		// set readonly for subfields
		$('.tag[@id^='+tagnumber+']').children('.subfields').children('.subfield').children('input').attr('readonly', 'readonly').addClass('reserved_tag');;
	}	
}

function setupMacros(ffeditor, vareditor) {
	return new MarcEditor(ffeditor, vareditor);
}


function setupEditorHotkeys() {
	// focus prev tagnumber on shift-return
	var inputs = Ext.select('input', false, 'marceditor');
	inputs.addKeyMap({
		key: Ext.EventObject.ENTER,
		fn: function(key, e) {
			// if there's a combobox open in the marceditor, don't process so it can handle enter
			if( UI.editor.cbOpen == true ) {
				return;			
			}
			if(e.shiftKey ) {
				$('.focused').parents('.tag').prev().children('.tagnumber').eq(0).focus();
			}
			else {
				$('.focused').parents('.tag').next().children('.tagnumber').eq(0).focus();
			}
		},
		stopEvent: false
	});

	// add a new subfield
	$.hotkeys.add('Ctrl+m', function(e) {	
		addSubfield(UI.editor.lastFocusedEl);
	});
	
	// add a new field
	$.hotkeys.add('Ctrl+n', function(e) {
		addField();
	});

	// remove a subfield
	$.hotkeys.add('Ctrl+d', function(e) {
		removeSubfield();
	});
	// remove a field
	$.hotkeys.add('Ctrl+k', function(e) {
		removeTag();	
	});

	// save record
	$.hotkeys.add('Ctrl+s', function(e) {
		doSaveLocal();
	});
}

function setupMarc21AuthorityLiveSearches() {
	// 100 personal names
	var tag100 = $('div').filter('.tag[@id^=100]').children('.subfields').children('[@id*=a]');
	var tag700 = $('div').filter('.tag[@id^=700]').children('.subfields').children('[@id*=a]');
	$(tag100).add(tag700).
		each(function(i) {
			var subfield_text = $(this).children('.subfield-text');
			if( subfield_text.length == 0 ) {
				return;
			}
			console.info('applying combobox to '+ $(subfield_text).val() );
			var marcxmlReader = new Ext.data.XmlReader({
					record: 'record',
					id: 'controlfield[tag=001]',
					},
					[
						// field mapping
						{name: 'pname', id: 'a', mapping: 'datafield[tag=100] > subfield[code=a]'},
						{name: 'dates', id: 'd', mapping: 'datafield[tag=100] > subfield[code=d]'}
					]
			);
			var scanClauseReader = new Ext.data.XmlReader({
					record: 'term',
					},
					[
						// field mapping
						{name: 'pname', mapping: 'value'}
					]
			);

			var ds = new Ext.data.Store({
				proxy: new Ext.data.HttpProxy(
					{
						url: kohaauthurl,
						method: 'GET'
					
					}),
				baseParams: {
										version: '1.1',
										operation: 'searchRetrieve',
										recordSchema: 'marcxml',
										maximumRecords: '5'
				},
				reader: marcxmlReader 
			});

			var cb = new Ext.form.ComboBox({
				store: ds,
				typeAhead: true,
				typeAheadDelay: 500,
				allQuery: 'query',
				queryParam: 'query',
				editable: true,
				forceSelection: false,
				triggerAction: 'all',
				mode: 'remote',
				selectOnFocus: true,
				hideTrigger: true,
				displayField: 'pname',
				loadingText: 'Searching...'
			});
			cb.on('beforequery', function(combo, query, forceAll, cancel, e) {
				// for scan searching need to add pname= to query
				//var name = combo.query;
				//combo.query = 'pname='+name;
			});
			cb.on('select', function(combo, record, index) {
				var tagnumber = $(combo.el.dom).parents('.tag').children('.tagnumber').val();
				var tag = $(combo.el.dom).parents('.tag');
				// create/update subfields
				// delete any subfields following the first (subfield $a)
				var subfields = $(tag).find('.subfield');
				for( var i = 1; i< subfields.length; i++) {
					$( subfields[i] ).remove();
				}
				// for each subfield in this record
				for( var i = 0; i < record.fields.length; i++) {
					var data = record.fields.itemAt(i);
					var subfieldcode = data.id;
					var fieldname = data.name;
					var value = record.data[fieldname];
					// if we're updating subfield $a, delete the old one first
					if( subfieldcode == 'a') {
						combo.setValue(value);	
					}
					// add new one if we have a value for it
					else if( value != '' || null ) {
						UI.editor.record.addSubfield(tagnumber, subfieldcode, value);
					}
				}
				UI.editor.cbOpen = false;

			});
			cb.on('specialkey', function(cb, e) {
				e.stopEvent();
			});
			cb.on('expand', function(cb, e) {
				UI.editor.cbOpen = true;
			});
			cb.on('hide', function(cb, e) {
			});
			UI.editor.comboboxes.push(cb);
			cb.applyTo($(subfield_text).get(0));
	});
	// 650 subject
	var tag650 = $('div').filter('.tag[@id^=650]').children('.subfields').children('[@id*=a]');
	$(tag650).
		each(function(i) {
		var subfield_text = $(this).children('.subfield-text');
		console.info('applying combobox to '+ $(subfield_text).val() );
		var store = new Ext.data.SimpleStore({
			fields: ['author', 'auth'],
			data: [['A', 'A'],
					['B', 'B']
					]
		});
		var cb = new Ext.form.ComboBox({
			store: store,
			typeAhead: true,
			editable: true,
			forceSelection: false,
			triggerAction: 'all',
			mode: 'local',
			selectOnFocus: true,
			hideTrigger: true,
			displayField: 'author',
		});
		cb.applyTo($(subfield_text).get(0));
	});
	// 600 subject
	var tag600 = $('div').filter('.tag[@id^=600]').children('.subfields').children('[@id*=a]');
	$(tag600).
		each(function(i) {
		var subfield_text = $(this).children('.subfield-text');
		if( ! subfield_text ) {
			return;
		}
		console.info('applying combobox to '+ $(subfield_text).val() );
		var store = new Ext.data.SimpleStore({
			fields: ['author', 'auth'],
			data: [['A', 'A'],
					['B', 'B']
					]
		});
		var cb = new Ext.form.ComboBox({
			store: store,
			typeAhead: true,
			editable: true,
			forceSelection: false,
			triggerAction: 'all',
			mode: 'local',
			selectOnFocus: true,
			hideTrigger: true,
			displayField: 'author',
		});
		cb.applyTo($(subfield_text).get(0));
	});
	// 440 series
	var tag440 = $('div').filter('.tag[@id^=440]').children('.subfields').children('[@id*=a]');
	$(tag440).
		each(function(i) {
		var subfield_text = $(this).children('.subfield-text');
		console.info('applying combobox to '+ $(subfield_text).val() );
		var store = new Ext.data.SimpleStore({
			fields: ['author', 'auth'],
			data: [['A', 'A'],
					['B', 'B']
					]
		});
		var cb = new Ext.form.ComboBox({
			store: store,
			typeAhead: true,
			editable: true,
			forceSelection: false,
			triggerAction: 'all',
			mode: 'local',
			selectOnFocus: true,
			hideTrigger: true,
			displayField: 'author',
		});
		cb.applyTo($(subfield_text).get(0));
	});
	// 710 corp name
	var tag710 = $('div').filter('.tag[@id^=710]').children('.subfields').children('[@id*=a]');
	$(tag710).
		each(function(i) {
		var subfield_text = $(this).children('.subfield-text');
		console.info('applying combobox to '+ $(subfield_text).val() );
		var store = new Ext.data.SimpleStore({
			fields: ['author', 'auth'],
			data: [['A', 'A'],
					['B', 'B']
					]
		});
		var cb = new Ext.form.ComboBox({
			store: store,
			typeAhead: true,
			editable: true,
			forceSelection: false,
			triggerAction: 'all',
			mode: 'local',
			selectOnFocus: true,
			hideTrigger: true,
			displayField: 'author',
		});
		cb.applyTo($(subfield_text).get(0));
	});

}

function create_ext_editor_static() {
	UI.editor.editorDoc = $('#vareditor');
	$('.subfield-text').each( function() {
		var value = $(this).text();
		$(this).text('');
		var ite = new Ext.form.TextField(
		{	
			value: value,
			grow: true, 
			focusClass: 'focused-subfield-text',
			cls: 'subfield-text',
			fieldClass: 'subfield-text'
		});
		ite.render($(this).get(0));
	});
	$('.subfield-delimiter').each( function() {
		var value = $(this).text();
		$(this).text('');
		var ite = new Ext.form.TextField(
		{
			value: value,
			grow: true, 
			maxLength: 2,
			focusClass: 'focused-subfield-delimiter',
			cls: 'subfield-delimiter',
			fieldClass: 'subfield-delimiter'
		});
		ite.render($(this).get(0));
	});
	$('.tagnumber').each( function() {
		var value = $(this).text();
		var id = $(this).id;
		$(this).text('');
		var ite = new Ext.form.TextField(
		{
			id: id,
			value: value,
			grow: true, 
			maxLength: 3,
			cls: 'tagnumber',
			fieldClass: 'tagnumber',
			focusClass: 'focused-tagnumber'
		});
		ite.render($(this).get(0));
	});
	$('.indicator').each( function() {
		var value = $(this).text();
		$(this).text('');
		var ite = new Ext.form.TextField(
		{
			value: value,
			grow: true, 
			maxLength: 1,
			focusClass: 'focused-indicator',
			cls: 'indicator',
			fieldClass: 'indicator'
		});
		ite.render($(this).get(0));
	});
	$('.controlfield').each( function() {
		var value = $(this).text();
		$(this).text('');
		var ite = new Ext.form.TextField(
		{
			value: value,
			grow: false,
			focusClass: 'focused-controlfield',
			cls: 'subfield-text',
			fieldClass: 'subfield-text'
		});
		ite.render($(this).get(0));
	});
	$("#000").hide();
	$("#008").hide();
	// focus first input element
	$('input', '#vareditor').get(0).focus();
}

function create_jquery_editor() {
	UI.editor.editorDoc = '';
	//$('.subfield-text').click( function() {
//		$('input').filter('.subfield-text').replaceWith("<span>");
//		$('span').removeClass('focused-subfield-text');
//		$(this).replaceWith("<input type='text'>").addClass('focused').focus();
//	});
	// jeditable
	$('.subfield-text').editable(
		function(value, settings) {
			console.log(this);
			console.log(value);
			console.log(settings);
			return(value);
		},
		{
			//type: 'textarea',
			//event: "mouseover",
			style: 'display: inline; background-color: yellow;',
			onblur: 'submit'
	});
	$('.subfield-delimiter').editable(
		function(value, settings) {
			console.log(this);
			console.log(value);
			console.log(settings);
			return(value);
		},
		{
			//event: "mouseover",
			style: 'inherit',
			onblur: 'submit'
	});
	$('.tagnumber').editable(
		function(value, settings) {
			console.log(this);
			console.log(value);
			console.log(settings);
			return(value);
		},
		{
			//event: "mouseover",
			style: "inherit",
			onblur: 'submit'
	});
}

function create_yui_rte_editor() {
	var vared = $("#vareditor").html();
	$("#vareditor").empty();
  $("#vareditor").append("<textarea id='rte_placeholder' name='rte_placeholder' id='rte_placeholder'>"+vared+"</textarea>");
	rte_editor = new YAHOO.widget.Editor('rte_placeholder', {
		height: '700px',
		width: '722px',
		dompath: false, //Turns on the bar at the bottom
		animate: false, //Animates the opening, closing and moving of Editor windows
		css: editor_css + autocomplete_css
	});
	rte_editor.render();
	rte_editor.on('editorContentLoaded', function() {
		// move the cursor to 001 tag so we can use it even though leader will be invisible
		var editorSelection = rte_editor._getSelection();
		var tag001 = $("#001", rte_editor._getDoc()).get(0);
		editorSelection.extend(tag001, 0);
		editorSelection.collapseToEnd();
		editorSetFocus( $(editorSelection.focusNode).children('.tagnumber') );
		rte_editor._focusWindow();
		$("#000", rte_editor._getDoc()).hide();
		$("#008", rte_editor._getDoc()).hide();
		// add metadata div with associated savefile id and record id
		$("#marceditor").prepend("<div id='metadata' style='display: none;'><span id='id'>"+id+"</span><span id='savefileid'>"+savefileid+"</span></div>");
	});
	rte_editor.on('editorKeyPress', editorKeyPress );
	rte_editor.on('editorKeyPress', editorCheckHighlighting );
	rte_editor.on('editorKeyUp', function(o) {
	});
	rte_editor.on('editorMouseUp', editorMouseUp );
	UI.editor.editorDoc = rte_editor._getDoc();
}

function editorMouseUp(o) {
  YAHOO.util.Event.stopEvent(o.ev);
  editorSelection = rte_editor._getSelection();
  var selectedElement = editorGetSelectedElement();
  editorSetFocus( selectedElement );
  if(debug) { console.info( "mouseUP: selected node text: " + $(selectedElement).text() );}
  if(debug) { console.info( "mouseUp: " + selectedElement);}
  if(debug) { console.info( "mouseUp: " + editorSelection);}
}

/* 
   Function: clearEditor

   Clear the editor divs and rich text editor of currently open record.

   Parameters:
  
   None.

   Returns:

   None.
 
   See Also:
   <openRecord>
*/
function clear_editor() {
    // reset current open record to none
    UI.editor.id = '';
	UI.editor.location = '';
	UI.editor.comboboxes = new Array();
   // clear the marceditor divs
   $("#fixedfields_editor").empty();
   $("#varfields_editor").empty();
}

