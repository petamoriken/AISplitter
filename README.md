Animation Image Splitter v1.0.1
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
		// don't call this function
		console.log(this);
	});
	pngObj.off("load");


[APNG-canvas]:https://github.com/davidmz/apng-canvas 
