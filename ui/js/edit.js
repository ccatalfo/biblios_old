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
	if( leaderval.length != 24 ) {
		throw {
			error: "InvalidLeader",
			msg: "Invalid length of Leader"
		}
	}
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
		var rectype = $('#Type').val();
		var mattype = '';
		if( rectype == 'a' || rectype == 't' ) {
			mattype = 'Books';
		}
		if( rectype == 'm' ) {
			mattype = 'ComputerFile';
		}
		if( rectype == 'e' || rectype == 'f' ) {
			mattype = 'Maps';
		}
		if( rectype == 'c' || rectype == 'd' || rectype == 'j' || rectype == 'i') {
			mattype = 'Music';
		}
		if( rectype == 'g' || rectype == 'k' || rectype == 'o' || rectype == 'r') {
			mattype = 'Visual';
		}
		if( rectype == 'p' ) {
			mattype = 'Mixed';
		}
			$('mattypes mattype[@value='+mattype+'] position', marc21defs).each( function(i) {
				var type = $(this).text();
				if( type.substr(0, 4) == 'Undef') {
					var length = type.substr(5,1);
					for( var k = 0; k<length; k++) {
						tag008val += ' ';
					}
				}
				var value = $('#'+type).val();
				tag008val += value;
			});
	if( tag008val.length != 40 ) {
		throw {
			error: "Invalid008",
			msg: "Invalid length of 008"
		}
	}
    return tag008val;
}

function get006FromEditor(ff_ed) {
		var tag006val = '';
		var rectype = $('#Type').val();
		var mattype = '';
		if( rectype == 'a' || rectype == 't' ) {
			mattype = 'Books';
		}
		if( rectype == 'm' ) {
			mattype = 'ComputerFile';
		}
		if( rectype == 'e' || rectype == 'f' ) {
			mattype = 'Maps';
		}
		if( rectype == 'c' || rectype == 'd' || rectype == 'j' || rectype == 'i') {
			mattype = 'Music';
		}
		if( rectype == 'g' || rectype == 'k' || rectype == 'o' || rectype == 'r') {
			mattype = 'Visual';
		}
		if( rectype == 'p' ) {
			mattype = 'Mixed';
		}
		$('mattypes mattype[@value='+mattype+'] position', marc21defs).each( function(i) {
			var type = $(this).text();
			if( type.substr(0, 4) == 'Undef') {
				var length = type.substr(5,1);
				for( var k = 0; k<length; k++) {
					tag006val += ' ';
				}
			}
			var value = $('#'+type).val();
			tag006val += value;
		});
    return tag006val;
}
function get007FromEditor() {
	var tag007val = '';
	var cat = $('#Category').val();
			var mattype = '';
			if( cat == 'a' ) {
				mattype = 'MAP';
			}
			if( cat == 'c' ) {
				mattype = 'ELECTRONIC';
			}
			if( cat == 'd' ) {
				mattype = 'GLOBE';
			}
			if( cat == 'f' ) {
				mattype = 'TACTILE';
			}
			if( cat == 'g' ) {
				mattype = 'PROJECTED';
			}
			if( cat == 'h' ) {
				mattype = 'MICROFORM';
			}
			if( cat == 'k' ) {
				mattype = 'NONPROJECTED';
			}
			if( cat == 'm' ) {
				mattype = 'MOTION';
			}
			if( cat == 'o' ) {
				mattype = 'KIT';
			}
			if( cat == 'q' ) {
				mattype = 'NOTATED';
			}
			if( cat == 'r' ) {
				mattype = 'REMOTE';
			}
			if( cat == 's' ) {
				mattype = 'SOUND';
			}
			if( cat == 't' ) {
				mattype = 'TEXT';
			}
			if( cat == 'v' ) {
				mattype = 'VIDEORECORDING';
			}
			if( cat == 'z' ) {
				mattype = 'UNSPECIFIED';
			}
			$('field[@tag=007][@mattype='+mattype+']', marc21defs).each( function(i) {
				$('value', this).each( function(j) {
					var type = $(this).attr('name');
					if( type == 'Undefined') {
						var length = $(this).attr('length');
						for( var k = 0; k<length; k++) {
							tag007val += ' ';
						}
					}
					var value = $('#'+type).val() || '';
					tag007val += value;
				}); // loop through positions in 007
			});
			return tag007val;
}


/*

*/
function updateFFEditor(editorid, ff_ed, var_ed) {
	if(debug) { console.info("updating fixed field editor from leader and 008 tags"); }
    var oDomDoc = Sarissa.getDomDocument();
    var leaderval = $('#'+editorid).find("#000", var_ed).children('.controlfield').val();
	if( leaderval.length != 24 ) {
		throw {
			error: "InvalidLeader",
			msg: "Invalid length of Leader"
		}
	}
    var tag008val = $('#'+editorid).find("#008", var_ed).children('.controlfield').val();
	if( tag008val.length != 40 ) {
		throw {
			error: "Invalid008",
			msg: "Invalid length of 008"
		}
	}
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
    $('#'+editorid).find(".ffeditor").empty();
    $('#'+editorid).find(".ffeditor").getTransform( fixedFieldXslPath, newff);
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
		$(afterEl).parents('.subfield').after("<span id='subfield-"+newid+"' class='subfield'><input onblur='onBlur(this)' onfocus='onFocus(this)' id='delimiter-"+newid+"' length='2' maxlength='2' class='subfield-delimiter' onblur='onBlur(this)' onfocus='onFocus(this)' value='&Dagger;'><input id='subfield-text-'"+newid+"' onfocus='onFocus(this)' onblur='onBlur(this)' class='subfield-text'></span>");
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
	var editorid = $(UI.editor.lastFocusedEl).parents('.marceditor').get(0).id;
	UI.editor[editorid].record.addField();
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
	Ext.getCmp('helpIframe').el.update(msg);
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
function transferFF_EdToTags(ff_ed, var_ed, editorid ) {
    var leaderval = getLeaderFromEditor(ff_ed);
    $('#'+editorid).find("#000", var_ed).children('.controlfield').val(leaderval);
    var tag008val = get008FromEditor(ff_ed);
    $('#'+editorid).find("#008", var_ed).children('.controlfield').val(tag008val);
	if( $('#'+editorid).find('#006').length > 0 ) {
		var tag006val = get006FromEditor(ff_ed);
		$('#'+editorid).find("#006", var_ed).children('.controlfield').val(tag006val);
        console.info('Transferring 006 value from fixed field editor into 006 tag: ' + tag006val);
	}
	if( $('#'+editorid).find('#007').length > 0 ) {
		var tag007val = get007FromEditor(ff_ed);
		$('#'+editorid).find("#007", var_ed).children('.controlfield').val(tag007val);
        console.info('Transferring 007 value from fixed field editor into 007 tag: ' + tag007val);
	}
    if(debug) {
        console.info('Transferring leader value from fixed field editor into leader tag: ' + leaderval);
        console.info('Transferring 008 value from fixed field editor into 008 tag: ' + tag008val);
    }
}


function toggleFixedFieldDisplay(btn, toggled) {
	var editorid = btn.editorid;
	var ff_ed = $('#'+editorid).find(".ffeditor");
	var var_ed = $('#'+editorid).find(".vareditor");
	if( btn.pressed == false ) {
		// hide fixed field editor
		$('#'+editorid).find(".ffeditor").hide();
        // transfer values from fixed field editor into tags
        transferFF_EdToTags(editorid, ff_ed, var_ed);
		// show leader and 008
		$('#'+editorid).find("#000", UI.editor[editorid].vared).show();
		$('#'+editorid).find("#008", UI.editor[editorid].vared).show();
		$('#'+editorid).find("#006", UI.editor[editorid].vared).show();
		$('#'+editorid).find("#007", UI.editor[editorid].vared).show();
	}
	else {
        updateFFEditor(editorid, ff_ed, var_ed);
		$('#'+editorid).find(".ffeditor").show();
		// hide leader and 008
		$('#'+editorid).find("#000", UI.editor[editorid].vared).hide();
		$('#'+editorid).find("#008", UI.editor[editorid].vared).hide();
		$('#'+editorid).find("#006", UI.editor[editorid].vared).hide();
		$('#'+editorid).find("#007", UI.editor[editorid].vared).hide();
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


function removeTag(editorid, tagnumber, i ) {
	//if(debug) { console.info('removing tag: ' + $(UI.editor.lastFocusedEl).parents('.tag').get(0).id)}
	if( tagnumber ) {
		// remove  the ith tagnumber if we were passed an i
		if( !Ext.isEmpty(i) ) {
			$('#'+editorid).find('.tag').filter('[@id*='+tagnumber+']').eq(i).remove();
		}
		// else remove all!
		else {
			$('#'+editorid).find('.tag').filter('[@id*='+tagnumber+']').remove();
		}
	}
	else {
		// focus previous or next tag
		var prev = $(UI.editor[editorid].lastFocusedEl).parents('.tag').prev().children('.tagnumber');
		var next = $(UI.editor[editorid].lastFocusedEl).parents('.tag').next().children('.tagnumber');
		$(UI.editor[editorid].lastFocusedEl).parents('.tag').remove();
		if( $(next).length ) {
			$(next).focus();
		}
		else {
			$(prev).focus();
		}
	}
}


function create_static_editor(ffed, vared, editorid) {
	// setup marceditor macro functionality
	UI.editor[editorid].record = setupMacros(ffed, vared);
	// setup reserved (locked) tags based on remote ils bib profile
	if( Prefs.remoteILS[ UI.editor[editorid].location ] ) {
		setupReservedTags( Prefs.remoteILS[ UI.editor[editorid].location ], vared);
		setupSpecialEntries( Prefs.remoteILS[ UI.editor[editorid].location ], vared);
	}
	// add editor hotkeys
	setupEditorHotkeys(editorid);

	// apply ExtJS comboboxes for live searching of authority data
	setupMarc21AuthorityLiveSearches(editorid);
}

function onFocus(elem) {
	$(elem).addClass('focused');
	//showTagHelp(elem);
}

function showTagHelp(elem) {
	if( UI.editor.lastElemHelpShown == elem ) {
		return;
	}
	Ext.get('helpIframe').update('');
	// retrieve help for this tag
	var tag = $(elem).parents('.tag').get(0).id.substr(0,3);
	var pageurl = '';
	if( tag == '000' || tag == '008' || tag == '006') {
		pageurl = 'fixedfield/default.shtm';
	}
	else if( tag == '001' || tag == '003' || tag == '005' ) {
		// no page for these
		Ext.get('helpIframe').update('');
		return;
	}
	else if ( tag == '007' ) {
		pageurl = '00x/default.shtm';	
	}
	else {
		var firstletter = tag.substr(0,1);
		pageurl = firstletter+'xx/'+ tag +'.shtm';
	}
	var url = 'http://' + location.host + '/oclc/bibformats/en/' + pageurl;
	Ext.get('helpIframe').load({
		url: url,
		params: {}, // no params
		scripts: false,
		callback: function processOCLC(element, success, response, options) {
			//Ext.getCmp('helpIframe').update( $('#contentarea', response.responseText).html() );
		},
		nocache: false
	});
	UI.editor.lastElemHelpShown = elem;
}

function onBlur(elem) {
	$(elem).removeClass('focused');
	var editorid = $(elem).parents('.marceditor').get(0).id;
	UI.editor[editorid].record.update(elem);
	UI.editor.lastFocusedEl = elem;
	UI.editor[editorid].lastFocusedEl = elem;
}

function onFixedFieldEditorBlur(elem) {
	var editorid = $(elem).parents('.marceditor').get(0).id;
	transferFF_EdToTags(UI.editor[editorid].ffed, UI.editor[editorid].vared, editorid);
	UI.editor[editorid].record.update($('#000').find('.controlfield'));
	UI.editor[editorid].record.update($('#008').find('.controlfield'));
}

function setupSpecialEntries(loc, editor) {
	var specialentries = loc.instance.special_entries;
	for( var i = 0; i < specialentries.length; i++) {
		var entry = specialentries.eq(i);
		var tagnumber = $('field tag', entry).text();	
		var subfield = $('field/ ubfield', entry).text();	
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
		var valid_values = $('valid_values value', entry);
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
			hideTrigger: true,
			applyTo: $(elemToReplace).get(0)
		});
		Ext.ComponentMgr.register(combo);
		if(debug) { console.info('Applying combobox to '+tagnumber+' '+subfield+' with current value of ' +currentValue + ' for special entry')}
		
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


function setupEditorHotkeys(editorelem) {
	// focus prev tagnumber on shift-return
	var inputs = Ext.select('input', false, $(editorelem)[0]);
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
		var editorid = $(UI.editor.lastFocusedEl).parents('.marceditor').get(0).id;
		doSaveLocal(UI.currSaveFile, editorid);
	});
}

function createAuthComboBox(editorid, tagelem, xmlReader, displayField, queryIndex, recordSchema) {
	var subfield_text = $(tagelem);
	if( subfield_text.length == 0 ) {
		return;
	}
	console.info('applying combobox to '+ $(subfield_text).val() );
	var ds = new Ext.data.Store({
		proxy: new Ext.data.HttpProxy(
			{
				url: kohaauthurl,
				method: 'GET',
				disableCaching: false
			
			}),
		baseParams: {
								version: '1.1',
								operation: 'searchRetrieve',
								recordSchema: recordSchema,
								maximumRecords: '100'
		},
		reader: xmlReader 
	});

	var cb = new Ext.form.ComboBox({
		store: ds,
		typeAhead: true,
		typeAheadDelay: 500,
		allQuery: 'query',
		queryParam: 'query',
		queryIndex: queryIndex,
		editable: true,
		forceSelection: false,
		triggerAction: 'all',
		mode: 'remote',
		selectOnFocus: true,
		hideTrigger: true,
		displayField: displayField,
		loadingText: 'Searching...',
		cls: 'authority-field',
		lazyRender: false,
		applyTo: $(subfield_text).get(0).id
	});
	cb.on('beforequery', function(combo, query, forceAll, cancel, e) {
		combo.query = combo.combo.queryIndex + "=" + combo.query;
	});
	cb.on('select', function(combo, record, index) {
		var tagnumber = $(combo.el.dom).parents('.tag').children('.tagnumber').val();
		var tag = $(combo.el.dom).parents('.tag');
		var tagindex = UI.editor[editorid].record.getIndexOf( tag );
		// create/update subfields
		if( record.store.reader.meta.deleteSubfields == true ) {
			// delete any subfields following the first (subfield $a)
			var subfields = $(tag).find('.subfield');
			for( var i = 1; i< subfields.length; i++) {
				$( subfields[i] ).remove();
			}
		}
		// for each subfield in this record
		for( var i = 0; i < record.fields.length; i++) {
			var data = record.fields.itemAt(i);
			var subfieldcode = data.id;
			var fieldname = data.name;
			var value = record.data[fieldname];
			// update subfield a
			if( subfieldcode == 'a') {
				combo.setValue(value);	
			}
			// add new one if we have a value for it
			else if( value != '' || null ) {
				UI.editor[editorid].record.addSubfield(tagnumber, tagindex, subfieldcode, value);
			}
		}
		UI.editor[editorid].cbOpen = false;

	});
	cb.on('specialkey', function(cb, e) {
		e.stopEvent();
	});
	cb.on('expand', function(cb, e) {
		UI.editor[editorid].cbOpen = true;
	});
	cb.on('hide', function(cb, e) {
	});
	UI.editor[editorid].comboboxes.push(cb);
	return true;
}

function setupMarc21AuthorityLiveSearches(editorid) {
	var topicalTermXmlReader = new Ext.data.XmlReader({
		record: 'record',
		deleteSubfields: false, // don't remote following subfields
		id: 'controlfield[tag=001]'
		},
		[
			{name: 'topicalterm', id: 'a', mapping: 'datafield[tag=150] > subfield[code=a]'}
	]);
	var geoTermXmlReader = new Ext.data.XmlReader({
		record: 'record',
		deleteSubfields: false, // don't remote following subfields
		id: 'controlfield[tag=001]'
		},
		[
			{name: 'geoTerm', id: 'a', mapping: 'datafield[tag=151] > subfield[code=a]'}
	]);
	var genreTermXmlReader = new Ext.data.XmlReader({
		record: 'record',
		deleteSubfields: false, // don't remote following subfields
		id: 'controlfield[tag=001]'
		},
		[
			{name: 'genreTerm', id: 'a', mapping: 'datafield[tag=155] > subfield[code=a]'}
	]);
	var corpnameXmlReader = new Ext.data.XmlReader({
		record: 'record',
		deleteSubfields: false, // don't remote following subfields
		id: 'controlfield[tag=001]'
		},
		[
			{name: 'corpname', id: 'a', mapping: 'datafield[tag=110] > subfield[code=a]'}
	]);
	var confnameXmlReader = new Ext.data.XmlReader({
		record: 'record',
		deleteSubfields: false, // don't remote following subfields
		id: 'controlfield[tag=001]'
		},
		[
			{name: 'confname', id: 'a', mapping: 'datafield[tag=111] > subfield[code=a]'}
	]);
	var uniformtitleXmlReader = new Ext.data.XmlReader({
		record: 'record',
		deleteSubfields: false, // don't remote following subfields
		id: 'controlfield[tag=001]'
		},
		[
			{name: 'title', id: 'a', mapping: 'datafield[tag=130] > subfield[code=a]'}
	]);
	var pnameXmlReader = new Ext.data.XmlReader({
			record: 'record',
			deleteSubfields: true,
			id: 'controlfield[tag=001]'
			},
			[
				// field mapping
				{name: 'pname', id: 'a', mapping: 'datafield[tag=100] > subfield[code=a]'},
				{name: 'numeration', id: 'b', mapping: 'datafield[tag=100] > subfield[code=b]'},
				{name: 'titles', id: 'c', mapping: 'datafield[tag=100] > subfield[code=c]'},
				{name: 'dates', id: 'd', mapping: 'datafield[tag=100] > subfield[code=d]'},
				{name: 'relator', id: 'e', mapping: 'datafield[tag=100] > subfield[code=e]'},
				{name: 'dateofwork', id: 'f', mapping: 'datafield[tag=100] > subfield[code=f]'},
				{name: 'miscinfo', id: 'g', mapping: 'datafield[tag=100] > subfield[code=g]'},
				{name: 'attrqualifier', id: 'j', mapping: 'datafield[tag=100] > subfield[code=j]'},
				{name: 'formsubheading', id: 'k', mapping: 'datafield[tag=100] > subfield[code=k]'},
				{name: 'langofwork', id: 'l', mapping: 'datafield[tag=100] > subfield[code=l]'},
				{name: 'numofpart', id: 'n', mapping: 'datafield[tag=100] > subfield[code=n]'},
				{name: 'nameofpart', id: 'p', mapping: 'datafield[tag=100] > subfield[code=p]'},
				{name: 'fullerform', id: 'q', mapping: 'datafield[tag=100] > subfield[code=q]'},
				{name: 'titleofwork', id: 't', mapping: 'datafield[tag=100] > subfield[code=t]'},
				{name: 'affiliation', id: 'u', mapping: 'datafield[tag=100] > subfield[code=u]'},
				{name: 'relatorcode', id: '4', mapping: 'datafield[tag=100] > subfield[code=4]'},
				{name: 'linkage', id: '6', mapping: 'datafield[tag=100] > subfield[code=6]'},
				{name: 'fieldlinkseqnum', id: '8', mapping: 'datafield[tag=100] > subfield[code=8]'},
				{name: 'authcontrolnum', id: '9', mapping: 'datafield[tag=001]'} // KOHA specific
			]
	);
	// personal names
	Ext.select('div[id^=100] .a .subfield-text, div[id^=700] .a .subfield-text, div[id^=600] .a .subfield-text, div[id^=800] .a .subfield-text').each( function(item) {
		createAuthComboBox(editorid,  $(item.dom), pnameXmlReader, 'pname', 'bath.personalName', 'marcxml' );
		return true;
	});
	
	Ext.select('div[id^=110] .a .subfield-text, div[id^=710] .a .subfield-text, div[id^=610] .a .subfield-text, div[id^=810] .a .subfield-text').each( function(item) {
		createAuthComboBox(editorid,  $(item.dom), corpnameXmlReader, 'corpname', 'bath.corporateName', 'marcxml' );
		return true;
	});
	Ext.select('div[id^=111] .a .subfield-text, div[id^=711] .a .subfield-text, div[id^=611] .a .subfield-text, div[id^=811] .a .subfield-text').each( function(item) {
		createAuthComboBox(editorid,  $(item.dom), confnameXmlReader, 'confname', 'bath.conferenceName', 'marcxml' );
		return true;
	});
	Ext.select('div[id^=240] .a .subfield-text, div[id^=130] .a .subfield-text, div[id^=740] .a .subfield-text, div[id^=630] .a .subfield-text').each( function(item) {
		createAuthComboBox(editorid,  $(item.dom), uniformtitleXmlReader, 'title', 'bath.uniformTitle', 'marcxml' );
		return true;
	});
	// subject headings
	Ext.select('div[id^=650] .a .subfield-text').each( function(item) {
		createAuthComboBox(editorid,  $(item.dom), topicalTermXmlReader, 'topicalterm', 'bath.topicalSubject', 'marcxml' );
		return true;
	});
	Ext.select('div[id^=651] .a .subfield-text').each( function(item) {
		createAuthComboBox(editorid,  $(item.dom), geoTermXmlReader, 'geoterm', 'bath.geographicName', 'marcxml' );
		return true;
	});
	Ext.select('div[id^=655] .a .subfield-text').each( function(item) {
		createAuthComboBox(editorid,  $(item.dom), genreTermXmlReader, 'genreterm', 'bath.genreForm', 'marcxml' );
		return true;
	});
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
function clear_editor(editorid) {
    // reset current open record to none
    UI.editor[editorid].id = '';
	UI.editor[editorid].location = '';
	UI.editor[editorid].record = '';
	UI.editor[editorid].comboboxes = new Array();
   // clear the marceditor divs
   $('#'+editorid).find("#fixedfields_editor").empty();
   $('#'+editorid).find("#varfields_editor").empty();
}

function getEditorForTag(tagnumber, marcxml) {

}

