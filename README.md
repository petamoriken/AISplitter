Animation Image Splitter v1.0.0
==========

Split Animation-PNG to PNG frames and Motion-JPEG to JPEG frames.  
This Program is inspired by [APNG-canvas].  

	var ais = new AISplitter();
	var jpegObj = ais.read("mjpeg.avi", "image/jpeg");
	var pngObj = ais.read("apng.png", "image/png");
	
	jpegObj.on("load", function() {
		// no arguments, use this
		console.log(this);
	});

	pngObj.on("load", function() {
		console.log(this);
	});


[APNG-canvas]:https://github.com/davidmz/apng-canvas 
