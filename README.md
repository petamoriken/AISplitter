Animation Image Splitter v1.0.2
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

Support modern browser (IE9~) and mobile browser (iOS 7~), However does't work Android browser.

##License
[MIT-License]

##TODO

Support Android browser.

[MIT-License]:https://github.com/petamoriken/AISplitter/blob/master/LICENSE
[APNG-canvas]:https://github.com/davidmz/apng-canvas 
