/**
  * Application Layout
  * by Jozef Sakalos, aka Saki
  * http://extjs.com/learn/Tutorial:Application_Layout_for_Beginners
  */
 
// reference local blank image
Ext.BLANK_IMAGE_URL = '../extjs/resources/images/default/s.gif';
 
// create namespace
Ext.namespace('biblios');
 
// create application
biblios.app = function() {
    // do NOT access DOM from here; elements don't exist yet
 
    // private variables
 
    // private functions
 
    // public space
    return {
        // public properties, e.g. strings to translate
 
        // public methods
        init: function() {
            var viewport = new Ext.Viewport({
				layout: 'border',
				items: [
					{
						region: 'north',
						layout: 'border',
						items: [
							{
								region: 'center'
							},
							{
								region: 'west'
							},
							{
								region: 'east'
							}
						]
					},
					new Ext.TabPanel({
						region: 'center',
						items: [
							{
								title: 'Home',
								closable: false,
								autoScroll: true
							},
							{
								title: 'Biblio',
								closable: false,
								autoScroll: true,
								layout: 'border',
								items: [
									{
										region: 'center',
										layout: 'border',
										items: [
											{
												region: 'center',
												id: 'searchgrid'
											},
											{
												region: 'center',
												id: 'editor'
											},
											{
												region: 'center',
												id: 'savefilegrid'
											}
										]
									},
									{
										region: 'west',
										split: true,
										collapsible: true,
										collapsed: true,
										width: 200,
										maxSize: 200,
										title: 'Resources'
									},
									{
										region: 'south',
										split: true,
										collapsible: true,
										collapsed: true,
										width: 200,
										maxSize: 200,
										height: 200,
										title: 'Previews'

									},
									{
										region: 'east',
										split: true,
										collapsible: true,
										collapsed: true,
										width: 200,
										maxSize: 200,
										title: 'Help'

									}
								]
							}
						]
					})
				]
			});
			
		alert('Application successfully initialized');
        }
    };
}(); // end of app
 
// end of file
