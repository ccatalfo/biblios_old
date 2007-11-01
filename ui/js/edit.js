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
    var leaderval = $("#000", rte_editor._getDoc()).children('.controlfield').text();
    var tag008val = $("#008", rte_editor._getDoc()).children('.controlfield').text();
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
		var id = this.id;
		// what kind of field is this, c=controlfield or d=datafield?
		var type = id.substring(0, 1);
		// what's the tag number?
		var tag = id.substr(10, 3);
        if(debug) {
            console.info("Saving tag: " + tag);
        }
		// if controlfield	
		if( type == 'c') {
			if( tag != '008' && tag != '000') { // skip 000 and 008 since we generate from dropdowns
				var cf = marcxml.createElement('controlfield'); 
				cf.setAttribute('tag', tag);
				var text = marcxml.createTextNode( $(this).text());
                if(debug) {
                    console.info("Saving controlfield text: " + $(this).text());
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
			var ind1val = $("[@id="+indid1+"]", var_ed).text();
			var indid2 = 'dind2' + tag_with_suffix;	
			var ind2val = $("[@id="+indid2+"]", var_ed).text();
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
			var subfields = $(this).text();
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
function addSubfield(o, selectedElement, editorSelection) {
	// make sure the cursor is in the editor so we can perform the operation
	rte_editor._focusWindow();
    if(debug) { console.info("Adding subfield");}
    // get the currently selected node
    var n = editorSelection.anchorNode;
    // get where in the node the cursor is
    var offset = editorSelection.anchorOffset;
    // get the text *after* the cursor to stick into a new subfield
    var newtext = n.textContent.substr(offset);
    if(debug) { console.info("new subfield will have text: "+ newtext);}
    // remove this text from the previous subfield
    n.textContent = n.textContent.substr(0, offset);
    // append it 
    // get a random number to assign as a suffix to our new subfield's id so we can find it
    var newid="newsubfield-" + Math.floor(Math.random()*100);    
	 // if we're in a subfield-delimiter or subfield-text, add the new subfield after its parent
	 if( $(selectedElement).is('.subfield-delimiter,.subfield-text') ) {
	 	selectedElement = $(selectedElement).parent();
	 }
    $(selectedElement, rte_editor._getDoc() ).after("<span id='"+newid+"' class='subfield'><span class='subfield-delimiter'>&Dagger;</span><span class='subfield-text'>"+newtext+"</span></span>")
    // put the cursor after the subfield delimiter in the new element' subfield-delimiter <span>
    editorSelection.extend(  $(selectedElement).next().children().get(0), 1);
    editorSelection.collapseToEnd();
	 var next = $(selectedElement).next();
	 editorSetFocus(next);
    // delete moz_dirty <br/> which messes up editor spacing by inserting that <br/>
    //<br _moz_dirty=""/>
    $("br", rte_editor._getDoc()).remove();
}

/*
   Function: doAddField

   Prompt the user to choose a marc tag to add, then add that field to the marceditor.

   Parameters:

   None.

   Returns:

   None.

*/
function doAddField() {
  Ext.MessageBox.prompt('Add tag', 'Choose a tag number', function(btn, tagnumber) {
        if(debug) { console.info("Adding tag with tagnumber: " + tagnumber);  }; 

        // insert the new field in numerical order among the existing tags
        var tags = $(".tag", rte_editor._getDoc() );
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
        var newtag = "<div class='tag' id='"+newId+"'><span id='d"+tagnumber+"'>"+tagnumber+"</span><span class='indicator' id='dind1"+newId+"'>#</span><span class='indicator' id='dind2"+newId+"'>#</span><span class='subfields' id='dsubfields"+newId+"'><span class='subfield'><span class='subfield-delimiter'>&Dagger;</span><span class='subfield-text> </span></span></span></div>"
        // insert out new tag after the tag we just found
        $(tagToInsertAfter, rte_editor._getDoc()).after(newtag);
		// set the focus to this new tag
		editorSetFocus( $(newId) );
  });
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
    $("#000", rte_editor._getDoc()).children('.controlfield').empty()
    $("#000", rte_editor._getDoc()).children('.controlfield').append(leaderval);
    var tag008val = get008FromEditor(ff_ed);
    $("#008", rte_editor._getDoc()).children('.controlfield').empty()
    $("#008", rte_editor._getDoc()).children('.controlfield').append(tag008val);
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
		$("#000", rte_editor._getDoc()).show();
		$("#008", rte_editor._getDoc()).show();
	}
	else {
        var ff_ed = $("#ffeditor");
        updateFFEditor(ff_ed);
		$("#ffeditor").show();
		// hide leader and 008
		$("#000", rte_editor._getDoc()).hide();
		$("#008", rte_editor._getDoc()).hide();

	}

}

function doRemoveSubfield() {
	var selectedElement = editorGetSelectedElement();
	editorSelection = rte_editor._getSelection();
	if( $(selectedElement).is('.subfield-text') || $(selectedElement).is('.subfield-delimiter') ) {
		// don't let user delete first subfield
		if( $(selectedElement).parents('.subfield').prev().length == 0 ) {
			Ext.MessageBox.alert('Error', "You can't delete the first subfield.  Please change the subfield code instead");
		}
		else {
			if( $(selectedElement).parents('.subfield').next().length == 0 ) {
				editorPrevSubfield(null, editorSelection, selectedElement);
			}
			else {
				editorNextSubfield(null, editorSelection, selectedElement);
			}
			$(selectedElement).parents('.subfield').remove();
		}
	}
	else {
		Ext.MessageBox.alert('Error', 'You must be in a subfield to delete it');
	}
}

function doRemoveTag() {
	var selectedElement = editorGetSelectedElement();
	editorSelection = rte_editor._getSelection();
	editorNextTag(null, editorSelection, selectedElement) ;
	$(selectedElement).parents('.tag').remove();
}


function create_jquery_editor() {
	UI.editor.editorDoc = '';
	$('.subfield-text').click( function() {
		$('input').filter('.subfield-text').replaceWith("<span class='subfield-text'>");
		$('span').removeClass('focused-subfield-text');
		$(this).replaceWith("<input type='text'>").addClass('focused').focus();
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
	UI.editor.editorDoc = rte_editor._getDoc();
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
    // if we're coming from marceditor, destroy old rte instance
    if( innerLayout.getRegion('center').activePanel.getId() == 'marceditor' && rte_editor && rte_editor._getDoc()  ) {
        rte_editor.destroy();
    }
   // clear the marceditor divs
   $("#ffeditor").empty();
   $("#rte_placeholder").empty();
}

