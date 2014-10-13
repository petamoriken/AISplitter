APNGParser
==========

Parse APNG to Normal PNG Flames.  
This Program is inspired by [APNG-canvas].  

    var APNGObject = null;
    var APNG = new APNGParser(url);
    
    APNG.on("load", function() {
    	// no EventObject, use this
    	APNGObject = this.image;
    });


[APNG-canvas]:https://github.com/davidmz/apng-canvas 
