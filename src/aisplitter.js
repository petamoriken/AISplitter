/*!
 * Animation Image Splitter v1.0.2 | MIT Licence | 2014 Kenta Moriuchi (@printf_moriken)
 *
 * This Program is inspired by APNG-canvas.
 * @copyright 2011 David Mzareulyan
 * @link https://github.com/davidmz/apng-canvas
 * @license https://github.com/davidmz/apng-canvas/blob/master/LICENSE (MIT License)
 */

(function(window) {
	"use strict";

	// IE9
	var isMSIE9 = navigator.userAgent.match(/msie [9.]/i);

	if (isMSIE9) {
		// see http://miskun.com/javascript/internet-explorer-and-binary-files-data-access/
		document.addEventListener("DOMContentLoaded", function () {
			var script = document.createElement("script");
			script.setAttribute('type', 'text/vbscript');
			script.text =
				"Function IEBinaryToBinStr(Binary)\r\n" +
				"   IEBinaryToBinStr = CStr(Binary)\r\n" +
				"End Function\r\n";
			document.body.appendChild(script);
		});
	}

	function AISplitter() {
	}

	AISplitter.prototype.read = function(url, type) {
		var frames = new Frames(url, type);
		return frames;
	};

	window.AISplitter = AISplitter;


	//Image Object
	function Frames(url, type) {
		this.width = 0;
		this.height = 0;
		this.frames = [];

		this._onload = [];
		this._onerror = [];
		this.loaded = false;

		this._urlToFrames(url, type);
	}

	Frames.prototype.on = function(ev, func) {
		if(ev === "load" || ev === "error") {
			this["_on" + ev].push(func);
		} else {
			throw new Error("Don't exist '"+ev+"' event");
		}
	};

	Frames.prototype.off = function(ev, func) {
		if(ev === "load" || ev === "error") {
			var evFunc = this["_on" + ev];

			if(typeof func === "function") {
				for(var i = 0, l = evFunc.length; i < l; ++i) {
					if(evFunc[i] === func)
						evFunc.splice(i, 1);
				}

			} else if(func === void 0) {
				evFunc.splice(0, evFunc.length);
			}

		} else {
			this.trigger("error", new Error("Don't exist '"+ev+"' event"));
		}
	};

	Frames.prototype.trigger = function(ev, obj) {
		var evFunc = this["_on" + ev];
		for(var i = 0, l = evFunc.length; i < l; ++i) {
			evFunc[i].call(this, obj);
		}
	};

	Frames.prototype._loadend = function() {
		this.loaded = true;
		this.trigger("load");
	};

	Frames.prototype._urlToFrames = function(url, type, undef) {
		var _this = this;
		var xhr = new XMLHttpRequest();

		// XHR 2
		var useResponseType = (xhr.responseType !== undef);
		
		// old Safari
		var useXUserDefined = (xhr.overrideMimeType !== undef);

		xhr.open('GET', url, true);
		if (useResponseType) { // XHR 2
			xhr.responseType = "blob";
		} else if (useXUserDefined) { // old Safari
			xhr.overrideMimeType('text/plain; charset=x-user-defined');
		}

		var isAndroid =	false;
		var userAgent = window.navigator.userAgent.toLowerCase();

		if (userAgent.indexOf('android') != -1) {
			xhr.responseType = 'arraybuffer';
			isAndroid = true;
		}

		xhr.onreadystatechange = function(e) {
			if (this.readyState == 4 && this.status == 200) {

				if (useResponseType) {

					if (isAndroid) {
						var uInt8Array = new Uint8Array(this.response);
						var i = uInt8Array.length;
						var binaryString = new Array(i);
						while (i--)
							{
								binaryString[i] = String.fromCharCode(uInt8Array[i]);
							}
						var data = binaryString.join('');
						_this._switchType(data, type);

					} else {

						var reader = new FileReader();

						if(reader.readAsBinaryString !== undef) {

							reader.onload = function() {
								_this._switchType(this.result, type);
							};
							reader.readAsBinaryString(this.response);

						} else { // IE 10~

							reader.onload = function() {
								var binStr = "";
								var bytes = new Uint8Array(this.result);
								var length = bytes.byteLength;
								for (var k = 0; k < length; ++k) {
									binStr += String.fromCharCode(bytes[k]);
								}
								_this._switchType(binStr, type);
							};
							reader.readAsArrayBuffer(this.response);

						}
					}
					
				} else {

					var res = "";
					if (isMSIE9) { // IE9

						// see http://miskun.com/javascript/internet-explorer-and-binary-files-data-access/
						var raw = IEBinaryToBinStr(this.responseBody);
						for (var j = 0, l = raw.length; j < l; ++j) {
							var c = raw.charCodeAt(j);
							res += String.fromCharCode(c & 0xff, (c >> 8) & 0xff);
						}


					} else { // old Safari

						var binStr = this.responseText;
						for (var i = 0, len = binStr.length; i < len; ++i) {
							res += String.fromCharCode(binStr.charCodeAt(i) & 0xff);
						}

					}
					_this._switchType(res, type);

				}

			} else if (this.readyState == 4) {
				_this.trigger("error", new Error("Can't read file"));
			}
		};
		xhr.send();
	};

	Frames.prototype._switchType = function(binStr, type) {
		if(type === "APNG")
				this._parseAPNG(binStr);
		else if(type === "XJPEG")
				this._parseXJPEG(binStr);
		else
			this.trigger("error", new Error("Don't support type"));
	};

	Frames.prototype._parseAPNG = function(imageStr) {

		if (imageStr.substr(0, 8) !== PNG_SIGNATURE) {
			this.trigger("error", new TypeError("This file is not PNG"));
			return;
		}

		var headerData, preData = "", postData = "", isAnimated = false;

		var off = 8, frame = null, length, type, data;
		do {
			length = readDWord(imageStr.substr(off, 4));
			type = imageStr.substr(off + 4, 4);

			switch (type) {
				case "IHDR":
					data = imageStr.substr(off + 8, length);
					headerData = data;
					this.width = readDWord(data.substr(0, 4));
					this.height = readDWord(data.substr(4, 4));
					break;
				case "acTL":
					isAnimated = true;
					this.numPlays = readDWord(imageStr.substr(off + 12, 4));
					break;
				case "fcTL":
					if (frame) this.frames.push(frame);
					data = imageStr.substr(off + 8, length);
					frame = {};
					frame.width = readDWord(data.substr(4, 4));
					frame.height = readDWord(data.substr(8, 4));
					frame.left = readDWord(data.substr(12, 4));
					frame.top = readDWord(data.substr(16, 4));
					var delayN = readWord(data.substr(20, 2));
					var delayD = readWord(data.substr(22, 2));
					if (delayD === 0) delayD = 100;
					frame.delay = 1000 * delayN / delayD;
					// see http://mxr.mozilla.org/mozilla/source/gfx/src/shared/gfxImageFrame.cpp#343
					if (frame.delay <= 10) frame.delay = 100;
					this.playTime += frame.delay;
					frame.disposeOp = data.charCodeAt(24);
					frame.blendOp = data.charCodeAt(25);
					frame.dataParts = [];
					break;
				case "fdAT":
					if (frame) frame.dataParts.push(imageStr.substr(off + 12, length - 4));
					break;
				case "IDAT":
					if (frame) frame.dataParts.push(imageStr.substr(off + 8, length));
					break;
				case "IEND":
					postData = imageStr.substr(off, length + 12);
					break;
				default:
					preData += imageStr.substr(off, length + 12);
			}
			off += length + 12;
		} while (type !== "IEND" && off < imageStr.length);
		if (frame) this.frames.push(frame);

		frame = null;

		if (!isAnimated) {
			this.trigger("error", new Error("Non-animated PNG"));
			return;
		}

		// make Image
		var loadedImages = 0, _this = this;
		for (var i = 0, l = this.frames.length; i < l; ++i) {
			var img = new Image();
			frame = this.frames[i];
			frame.img = img;

			img.onload = function () {
				++loadedImages;
				if (loadedImages === _this.frames.length) { // Load End
					_this._loadend();
				}
			};

			img.onerror = function () {
				_this.trigger("error", new Error("Image creation error"));
			};

			var db = new DataBuilder();
			db.append(PNG_SIGNATURE);
			headerData = writeDWord(frame.width) + writeDWord(frame.height) + headerData.substr(8);
			db.append(writeChunk("IHDR", headerData));
			db.append(preData);
			for (var j = 0; j < frame.dataParts.length; ++j)
				db.append(writeChunk("IDAT", frame.dataParts[j]));
			db.append(postData);
			img.src = db.getUrl("image/png");
			delete frame.dataParts;
		}
	};

	Frames.prototype._parseXJPEG = function(imageStr) {

		var marker = String.fromCharCode(0xff);
		var SOI = marker + String.fromCharCode(0xd8);
		var EOI = marker + String.fromCharCode(0xd9);

		var data = imageStr.match(new RegExp(SOI+"[\\s\\S]+?"+EOI, "g"));

		if(!("length" in data)) {
			this.trigger("error", new Error("Can't read JPEG Binary String"));
			return;
		}

		var frame;
		for(var i = 0, l=data.length; i<l; ++i) {
			var SOFv = [], v = 0xc0;
			while(v <= 0xcf) {
				if(v !== 0xc4 && v !== 0xc8 && v !== 0xcc)
					SOFv.push(String.fromCharCode(v));
				++v;
			}

			frame = {};
			var start = data[i].search(new RegExp(marker+"["+SOFv.join("")+"]"));

			frame.height = readWord(data[i].substr(start + 5, 2));
			frame.width = readWord(data[i].substr(start + 7, 2));
			frame.top = frame.left = 0;

			this.frames.push(frame);
		}

		if(data.length !== this.frames.length) {
			this.trigger("error", new Error("Shotage JPEG SOF data"));
			return;
		}

		this.height = this.frames[0].height;
		this.width = this.frames[0].width;

		// make image
		var loadedImages = 0, _this = this;
		for (var i = 0, l=this.frames.length; i < l; ++i) {
			var img = new Image();
			this.frames[i].img = img;

			img.onload = function () {
				++loadedImages;
				if (loadedImages === _this.frames.length) { // Load End
					_this._loadend();
				}
			};

			img.onerror = function () {
				_this.trigger("error", new Error("Image creation error"));
			};

			var db = new DataBuilder();
			db.append(data[i]);
			img.src = db.getUrl("image/jpeg");
		}

	};


	// utility

	// "\x89PNG\x0d\x0a\x1a\x0a"
	var PNG_SIGNATURE = String.fromCharCode(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);

	function readDWord(data) {
		var x = 0;
		for (var i = 0; i < 4; ++i) x += (data.charCodeAt(i) << ((3 - i) * 8));
		return x;
	}

	function readWord(data) {
		var x = 0;
		for (var i = 0; i < 2; ++i) x += (data.charCodeAt(i) << ((1 - i) * 8));
		return x;
	}

	function writeChunk(type, data) {
		var res = "";
		res += writeDWord(data.length);
		res += type;
		res += data;
		res += writeDWord(crc32(type + data));
		return res;
	}

	function writeDWord(num) {
		return String.fromCharCode(
			((num >> 24) & 0xff),
			((num >> 16) & 0xff),
			((num >> 8) & 0xff),
			(num & 0xff)
		);
	}

	function DataBuilder() {
		this.parts = [];
	}
	DataBuilder.prototype.append = function (data) {
		this.parts.push(data);
	};
	DataBuilder.prototype.getUrl = function (contentType) {
		if (window.btoa) {
			return "data:" + contentType + ";base64," + btoa(this.parts.join(""));
		} else { // IE
			return "data:" + contentType + "," + escape(this.parts.join(""));
		}
	};


	// crc32
	var table = new Array(256);

	for(var i=0; i<256; ++i) {
		var c=i;
		for (var k=0; k<8; ++k) c = (c&1) ? 0xEDB88320 ^ (c>>>1) : c>>>1;
		table[i] = c;
	}

	function crc32(str) {
		var crc = -1;
		for( var i = 0, l = str.length; i < l; ++i )
			crc = ( crc >>> 8 ) ^ table[( crc ^ str.charCodeAt( i ) ) & 0xFF];
		return crc ^ (-1);
	}

})(this);