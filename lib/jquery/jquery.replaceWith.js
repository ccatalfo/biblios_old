jQuery.fn.replaceWith = function(replacement) 
{
    return this.each (function() 
    {
        element = $(this);
		  if( $(replacement).is('input') ) {
				$(this).after(replacement).next().val(element.html());
		  }
		  else if ( $(element).is('input') ){
				$(this).after(replacement).next().html(element.val());
		  }
		  else {
				$(this).after(replacement).next().html(element.html());
		  }
        for (var i = 0; i < this.attributes.length; i++) {
            element.next().attr(this.attributes[i].nodeName, this.attributes[i].nodeValue);
        }
        element.remove();
    })
}
