jQuery.fn.getPos = function(match) {
	var index = 0;
	this.each( function(i) {
		if( $(this).get(0).id == match ) {
			index = i;
		}
	});
	return index;
};
