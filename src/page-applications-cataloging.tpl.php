<?php 
//    Copyright 2008 Avioso Limited

//    This file is part of .AD Novus.

//    .AD Novus is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.

//    .AD Novus is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.

//    You should have received a copy of the GNU General Public License
//    along with .AD Novus.  If not, see <http://www.gnu.org/licenses/>.
?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="<?php print $language ?>" xml:lang="<?php print $language ?>">
<head>
  <title>Cataloging</title>
  <?php print $head ?>
  <link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/2.5.2/build/fonts/fonts-min.css" /> 
  <link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/2.5.2/build/grids/grids-min.css" />
  <?php print $styles ?>
    <link rel="stylesheet" type="text/css" href="[% libPath %]lib/extjs2/resources/css/ext-all.css">
	<link type="text/css" rel="stylesheet" href="[% uiPath %]styles.css" />
 <style type="text/css" media="all">
<?php if($sidebar_left){ echo "#main {margin-right:0; width: auto; margin-left:235px;}";
 } elseif($sidebar_right){ echo "#main {margin-left:0; width: auto; margin-right:235px;}";
  } elseif($sidebar_left && $sidebar_right){ echo "#main {width: audo;margin-right:235px;margin-left:235px;}"; 
   } else { echo "#main {width: 99%; margin:0;}"; } ?>
</style>
 <!--[if IE]>
  <style>#sidebar-right {position:relative;left:-1px;}
  body {background-position: 0 242px;}
  #header {min-width:950px;}
  #primary {min-width:950px;}
  #main,#sidebar-left,#sidebar-right {
_display: inline; /* display inline or double your floated margin! [1] */
_overflow: hidden; /* in ie6, overflow auto is broken [2] and so is overflow visible [3] */
_overflow-y: visible;
}
  </style>
  <![endif]-->
  <?php print $scripts ?>
   <script type="text/javascript"></script>
</head>

<body class="<?php print $body_classes; if ($user->uid) { echo " loggedin"; } ?>"<?php if(drupal_is_front_page()){ echo "id=\"front\""; } ?>>


 <div id="wrapper"<?php if ($user->uid) { echo " class=\"loggedin\""; } ?>>

   <div id="header" class="clearfix">
      <?php print $header ?>
	</div>
    <br clear="all"/>
    <span class="clear"></span>

    <?php if ($sidebar_left) { ?>
      <div id="sidebar-left" class="clearfix">
      <?php print $sidebar_left ?>
      </div>
    <?php } ?>
    <div id="main" class="<?php if ($sidebar_left) { ?>sidebar_left <?php } ?>clearfix">
<?php if($search){ ?><div id="search" class="clearfix"><?php print $search; ?></div><?php } ?>
<?php if ($mission) { ?><div id="mission"><?php print $mission ?></div><?php } ?>
      <div class="inner">
        <?php if ($tabs){ ?><div class="tabs"><?php print $tabs ?></div><?php } ?>
        <?php print $help ?>
        <?php if ($show_messages): print $messages; endif; ?>
<div id="loading-mask" ></div>

<div id="loading">

	<div class="loading-ind">
		<img src="[% uiPath %]ui/images/biblios-logo.gif"><p id='loadingtext'>Loading...</p>
	</div>

</div>
<!-- properties which need to be modified on a global basis -->
<script type="text/javascript">
    var libPath = '[% libPath %]';
    var uiPath = '[% uiPath %]';
    var hostPort = '';
    var buildtime = '';
    var version = '0.9';
    var cgiDir = '[% cgiPath %]';
    var confPath = libPath + "conf/biblios.xml";
</script>
    
    <script type="text/javascript" src="[% libPath %]lib.js"></script>
    
<script>
	Ext.get('loadingtext').update('Checking for Google Gears');
  if (!window.google || !google.gears) {
	Ext.get('loadingtext').update('<p>Unable to load Google Gears.</p><p>Please visit the following url to install:</p><p><a target="_blank" href="http://gears.google.com/?action=install&message=Install Google Gears to use this Cataloging Application">Install Google Gears</a></p>');
	//location.href = "http://gears.google.com/?action=install&message=Please install Google Gears to run Biblios" +
                    "&return="+location.href;
  }
</script>

<div id='branding-area'></div>
<div id='biblios'>
<div id='downloads'></div>
</div>
    <script type="text/javascript">
		var bibliosdebug = 0;
        Ext.onReady(function() {
			Ext.BLANK_IMAGE_URL = libPath + 'lib/extjs2/resources/images/default/s.gif';
            Ext.get('loadingtext').update('Initializing Biblios');
			biblios.app.init();
            loadPlugins();
            completeInit();
            displayInitErrors();
			Ext.fly('loading').remove();
			// placeholder
		}, biblios.app);
    </script>
    </div>
    <?php if ($sidebar_right): ?>
      <div id="sidebar-right" class="clearfix">
      <?php print $sidebar_right ?>
      </div>
    <?php endif; ?>
    <br clear="all"/>
    <span class="clear"></span>
  </div>

  <br clear="all"/>
</body>
</html>
