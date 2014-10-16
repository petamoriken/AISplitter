APNGParser v0.0.2
==========

Parse APNG to Normal PNG Flames.  
This Program is inspired by [APNG-canvas].  

    var url = "hoge.png";
    var APNG = new APNGParser();
    var PNGFrames = APNG.read(url);
    
    PNGFrames.on("load", function() {
    	// no argumants, use this
    	console.log(this);
    });


[APNG-canvas]:https://github.com/davidmz/apng-canvas 
