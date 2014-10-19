/*!
 * Animation Image Splitter v1.0.0 | MIT Licence | 2014 Kenta Moriuchi (@printf_moriken)
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
		this.numPlays = 0;
		this.frames = [];
		this.playTime = 0;

		this._onload = [];
		this.loaded = false;

		this._urlToFrames(url, type);
	}

	Frames.prototype.on = function(ev, func) {
		if(ev === "load") {
			this._onload.push(func);
		}
	};

	Frames.prototype._urlToFrames = function(url, type) {
		var _this = this;
		var xhr = new XMLHttpRequest();

		// XHR 2
		var useResponseType = ("responseType" in xhr);
		
		// old Safari
		var useXUserDefined = ("overrideMimeType" in xhr);

		xhr.open('GET', url, true);
		if (useResponseType) { // XHR 2
			xhr.responseType = "blob";
		} else if (useXUserDefined) { // old Safari
			xhr.overrideMimeType('text/plain; charset=x-user-defined');
		}

		xhr.onreadystatechange = function(e) {
			if (this.readyState == 4 && this.status == 200) {

				if (useResponseType) {

					var reader = new FileReader();

					if("readAsBinaryString" in reader) {

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
				throw new Error("Can't read APNG date");
			}
		};
		xhr.send();	
	};

	Frames.prototype._switchType = function(binStr, type) {
		if(type === "image/png") {
			this._parseAPNG(binStr);
		} else if(type === "image/jpeg") {
			this._parseMJPEG(binStr);
		}
	};

	Frames.prototype._parseAPNG = function(imageData) {

		if (imageData.substr(0, 8) !== PNG_SIGNATURE) {
			throw new TypeError("This File is not PNG");
		}

		var headerData, preData = "", postData = "", isAnimated = false;

		var off = 8, frame = null, length, type, data;
		do {
			length = readDWord(imageData.substr(off, 4));
			type = imageData.substr(off + 4, 4);

			switch (type) {
				case "IHDR":
					data = imageData.substr(off + 8, length);
					headerData = data;
					this.width = readDWord(data.substr(0, 4));
					this.height = readDWord(data.substr(4, 4));
					break;
				case "acTL":
					isAnimated = true;
					this.numPlays = readDWord(imageData.substr(off + 12, 4));
					break;
				case "fcTL":
					if (frame) this.frames.push(frame);
					data = imageData.substr(off + 8, length);
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
					if (frame) frame.dataParts.push(imageData.substr(off + 12, length - 4));
					break;
				case "IDAT":
					if (frame) frame.dataParts.push(imageData.substr(off + 8, length));
					break;
				case "IEND":
					postData = imageData.substr(off, length + 12);
					break;
				default:
					preData += imageData.substr(off, length + 12);
			}
			off += length + 12;
		} while (type !== "IEND" && off < imageData.length);
		if (frame) this.frames.push(frame);
		frame = null;

		if (!isAnimated) {
			throw new TypeError("Non-animated PNG");
		}

		// make Image
		var loadedImages = 0, _this = this;
		for (var i = 0, l = this.frames.length; i < l; ++i) {
			var img = new Image();
			frame = this.frames[i];
			frame.img = img;

			img.onload = function () {
				++loadedImages;
				if (loadedImages == _this.frames.length) { // Load End
					_this._loadend();
				}
			};

			img.onerror = function () {
				throw new Error("Image creation error");
			};

			var db = new DataBuilder();
			db.append(PNG_SIGNATURE);
			headerData = writeDWord(frame.width) + writeDWord(frame.height) + headerData.substr(8);
			db.append(writeChunk("IHDR", headerData));
			db.append(preData);
			for (var j = 0; j < frame.dataParts.length; ++j) {
				db.append(writeChunk("IDAT", frame.dataParts[j]));
			}
			db.append(postData);

			img.src = db.getUrl("image/png");
			delete frame.dataParts;
		}
	};

	Frames.prototype._parseMJPEG = function(imageData) {

		var marker = String.fromCharCode(0xff);
		var SOI = marker + String.fromCharCode(0xd8);
		var EOI = marker + String.fromCharCode(0xd9);

		var mSecParFrame = 0, mul = 1;
		for(var k=0; k<4; ++k) {
			mSecParFrame += imageData.charCodeAt(32+k) * mul;
			mul *= 256;
		}
		mSecParFrame /= 1000;

		var data = imageData.match(new RegExp(SOI+"[\\s\\S]+?"+EOI, "g"));

		var frame;
		for(var i=0, l=data.length; i<l; ++i){
			var SOFv = [], v = 0xc0;
			while(v <= 0xcf) {
				if(v !== 0xc4 && v !== 0xc8 && v !== 0xcc)
					SOFv.push(String.fromCharCode(v));
				++v;
			}

			frame = {};
			var start = data[i].search(new RegExp(marker+"["+SOFv.join("")+"]"));
			
			frame.height = readWord(data[i].substr(start+5, 2));
			frame.width = readWord(data[i].substr(start+7, 2));
			frame.top = frame.left = 0;
			frame.delay = mSecParFrame;
			this.playTime += mSecParFrame;

			this.frames.push(frame);
		}

		if(data.length !== this.frames.length) {
			throw new Error("Shotage MJPG SOF data");
		}

		this.height = this.frames[0].height;
		this.width = this.frames[0].width;

		// make image
		var loadedImages = 0, _this = this;
		for (var j = 0, len = this.frames.length; j < l; ++j) {
			var img = new Image();
			this.frames[j].img = img;

			img.onload = function () {
				++loadedImages;
				if (loadedImages == _this.frames.length) { // Load End
					_this._loadend();
				}
			};

			img.onerror = function () {
				throw new Error("Image creation error");
			};

			var db = new DataBuilder();
			db.append(data[j]);

			img.src = db.getUrl("image/jpeg");
		}

	};

	Frames.prototype._loadend = function() {
		this.loaded = true;
		for(var i=0, l=this._onload.length; i<l; ++i) {
			this._onload.shift().call(this);
		}
		delete this._onload;
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