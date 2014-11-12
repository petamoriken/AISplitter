#Animation Image Splitter v2.0.1


Split Animation-PNG to PNG frames and XJPEG (binary-combined JPEG or Motion-JPEG) to JPEG frames.  
This Program is inspired by [APNG-canvas].  

	var ais = new AISplitter();
	var jpegObj = ais.read("mjpeg.avi", "XJPEG");
	var pngObj = ais.read("apng.png", "APNG");
	
	jpegObj.on("load", function(data) {
		console.log(data.frames);
		// enable to use "this" too 
		// console.log(this.frames);
	});

	pngObj.on("progress", function() {
		// don't call this function
	});
	pngObj.off("progress");
	
##Install

	bower install --save aisplitter

##Support

Google Chrome, Mozilla Firefox, Safari, Opera, Internet Explorer 9~  
Mobile Safari iOS 6~, Android Browser 2.x, 4.x

##Document

###AISplitter

| Method             | Description              |
|:------------------:|:-------------------------|
| `new AISplitter()` | Return AISplitter Object |
| `.read(url,type)` | Return Frames Object<br>Load image from `url`, and you have to set type `"APNG"`(Animation-PNG) or `"XJPEG"`(binary-combined JPEG or Motion-JPEG). |

###Frames

| Method                       | Description              |
|:----------------------------:|:-------------------------|
| `.on(event,callback(data))` | Set event method<br>Set string `"load"`, `"progress"` or `"error"` to `event`.<br> `callback(data)` has a argument object `data` that has `frames`(Array of `frame` Object) and `error`(string). In addition, the `"progress"`event's argument of `data` has `number`(integer) and `frame`(Object). |
| `.off(event[,function])`    | Remove event method<br>If you didn't set `function`, all `event` method was removed. |
|`.trigger(event[,data])`     | Trigger the event<br>If you set `data`(Object), the callback argument in `.on()` gets the data. |

| Property   | Type    | Description              |
|:----------:|:-------:|:-------------------------|
| `.loaded`  | boolean | Loadend flag             |
| `.width`   | integer | The first image's width  |
| `.height`  | integer | The first image's height |
|`.playTime` | integer | `"APNG"`'s play time     |
| `.type`    | string  | `"APNG"` or `"XJPEG"`<br>get `type` of value set by `AISplitter.read()` |
| `.frames`  | Array   | Array of `frame` Objects |

###frame


| Property  | Type    | Description             |
|:---------:|:-------:|:------------------------|
| `.width`  | integer | This image's width      |
| `.height` | integer | This image's height     |
| `.left`   | integer | left of center position |
| `.top`    | integer | top of center position  |
| `.delay`  | integer | `"APNG"`'s delay time   |
| `.img`    | Image   | Image Object            |


##License
[MIT License]


[MIT License]:https://github.com/petamoriken/AISplitter/blob/master/LICENSE
[APNG-canvas]:https://github.com/davidmz/apng-canvas 
