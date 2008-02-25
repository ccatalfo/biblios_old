	// fixes for embedding into koha (eliminate css clashes with koha css)
	// borders on unclassed td
	$('td').css('border-left', 'none').css('border-top', 'none').css('border-bottom', 'none').css('background-color', 'transparent');
	// borders on tables
	$('table').css('border-collapse', 'separate').css('border-right', 'none').css('border-top', 'none');
	// prevent scrollbars from overlapping grid (noted in mac ff and windows ff)
	$('.x-grid-scroller').css('overflow', 'hidden');
	// make "More" koha dropdown appear correctly
	$('.outerbox.inner').css('position', '');
