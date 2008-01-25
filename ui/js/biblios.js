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
						] // north region items
					}, // viewport north region
					new Ext.TabPanel({
						region: 'center',
						items: [
							{
								title: 'Home',
								closable: false,
								autoScroll: true
							}, // home tab
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
												id: 'searchpanel',
												layout: 'border',
												items: [
													{
														region: 'north',
														id: 'searchgridpanel'
													}, // searchpanel north
													{
														region: 'center',
														id: 'searchgridpreview'
													} // searchpanel center
												] // searchpanel items
											}, //search grid region
											{
												region: 'center',
												id: 'editorpanel',
												layout: 'border',
												items: [
													{
														region: 'north',
														id: 'editorone'
													}, // editor north
													{
														region: 'center',
														id: 'editortwo'
													} // editor center
												] // editor items
											}, // editor region
											{
												region: 'center',
												id: 'savefilepanel',
												layout: 'border',
												items: [
													{
														region: 'north',
														id: 'savegridpanel'
													}, // savepanel north
													{
														region: 'center',
														id: 'savegridpreview'
													} // savepanel center
												] // savepanel items
											} // savefilegrid region
										] // biblio tab center items
									}, // biblio tab center
									{
										region: 'west',
										split: true,
										collapsible: true,
										collapsed: true,
										width: 200,
										maxSize: 200,
										title: 'Resources'
									},// biblio tab west
									{
										region: 'south',
										split: true,
										collapsible: true,
										collapsed: true,
										width: 200,
										maxSize: 200,
										height: 200,
										title: 'Previews'

									}, // biblio tab south
									{
										region: 'east',
										split: true,
										collapsible: true,
										collapsed: true,
										width: 200,
										maxSize: 200,
										title: 'Help'

									}  // biblio tab east
								] // biblio tab items
							} // biblio tab config
						] // center items of tabpanel
					}) // tabpanel constructor
				] // viewport items
			}); // viewport constructor
			
		alert('Application successfully initialized');
        }
    };
}(); // end of app
 
// end of file
