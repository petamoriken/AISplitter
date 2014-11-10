Animation Image Splitter v2.0.0
==========

Split Animation-PNG to PNG frames and XJPEG (binary-combined JPEG or Motion-JPEG) to JPEG frames.  
This Program is inspired by [APNG-canvas].  

	var ais = new AISplitter();
	var jpegObj = ais.read("mjpeg.avi", "XJPEG");
	var pngObj = ais.read("apng.png", "APNG");
	
	jpegObj.on("load", function() {
		// no arguments, use this
		console.log(this);
	});

	pngObj.on("load", function() {
		// don't call this function
		console.log(this);
	});
	pngObj.off("load");

##Support

Support modern browser (Chrome, Safari, Firefox, IE9~) and mobile browser (iOS 7~, Android 2.x, 4.x)

##License
[MIT License]


[MIT License]:https://github.com/petamoriken/AISplitter/blob/master/LICENSE
[APNG-canvas]:https://github.com/davidmz/apng-canvas 
