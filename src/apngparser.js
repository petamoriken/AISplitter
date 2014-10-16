/*!
 * APNG Parser v0.0.2 | MIT Licence | Kenta Moriuchi (@printf_moriken)
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

	function APNGParser() {
	}

	APNGParser.prototype.read = function(url) {
		var frames = new Frames(url);
		return frames;
	};

	window.APNGParser = APNGParser;


	//Image Object
	function Frames(url) {
		this.width = 0;
		this.height = 0;
		this.numPlays = 0;
		this.frames = [];
		this.playTime = 0;

		this._onload = [];
		this.loaded = false;

		this._urlToPNGFrames(url);
	}

	Frames.prototype.on = function(ev, func) {
		if(ev === "load") {
			this._onload.push(func);
		}
	};

	Frames.prototype._urlToPNGFrames = function(url) {
		var _this = this;
		var xhr = new XMLHttpRequest();

		// BlobConstructor
		var Blob = window.Blob;

		// BlobBuilder
		// Tips: window.MozBlobBuilder is deprecated in modern FF
		var BlobBuilder = (window.BlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder || window.MozBlobBuilder);

		// XHR 2
		var useResponseType = (typeof xhr.responseType !== "undefined" && (typeof Blob !== "undefined" || typeof BlobBuilder !== "undefined"));
		
		// old Safari
		var useXUserDefined = (typeof xhr.overrideMimeType !== "undefined" && !useResponseType);

		xhr.open('GET', url, true);
		if (useResponseType) { // XHR 2
			xhr.responseType = "arraybuffer";
		} else if (useXUserDefined) { //old Safari
			xhr.overrideMimeType('text/plain; charset=x-user-defined');
		}

		xhr.onreadystatechange = function (e) {
			if (this.readyState == 4 && this.status == 200) {

				if (useResponseType) { // XHR 2

					var reader = new FileReader();

					if("readAsBinaryString" in reader) {

						reader.onload = function () {
							_this._parseAPNG(this.result);
						};

						if(typeof Blob !== "undefined") { // BlobConstructor

							var b = new Blob([this.response]);
							reader.readAsBinaryString(b);

						} else { // BlobBuilder

							var bb = new BlobBuilder();
							bb.append(this.response);
							reader.readAsBinaryString(bb.getBlob());

						}

					} else { // IE 10~

						var binary = "";
						var bytes = new Uint8Array(this.response);
						var length = bytes.byteLength;
						for (var k = 0; k < length; ++k) {
							binary += String.fromCharCode(bytes[k]);
						}
						_this._parseAPNG(binary);

					}

				} else {

					var res = "";
					if (isMSIE9) { // IE9

						// see http://miskun.com/javascript/internet-explorer-and-binary-files-data-access/
						var raw = APNGIEBinaryToBinStr(this.responseBody);
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
					_this._parseAPNG(res);

				}

			} else if (this.readyState == 4) {
				console.error("Can't read APNG date");
			}
		};
		xhr.send();	
	};

	Frames.prototype._parseAPNG = function(imageData) {

		if (imageData.substr(0, 8) !== PNG_SIGNATURE) {
			console.error("This File is not PNG");
		}

		var headerData, preData = "", postData = "", isAnimated = false;

		var off = 8, frame = null;
		do {
			var length = readDWord(imageData.substr(off, 4));
			var type = imageData.substr(off + 4, 4);
			var data;

			switch (type) {
				case "IHDR":
					data = imageData.substr(off + 8, length);
					headerData = data;
					this.width = readDWord(data.substr(0, 4));
					this.height = readDWord(data.substr(4, 4));
					break;
				case "acTL":
					isAnimated = true;
					this.numPlays = readDWord(imageData.substr(off + 8 + 4, 4));
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
					if (frame) frame.dataParts.push(imageData.substr(off + 8 + 4, length - 4));
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
			off += 12 + length;
		} while (type !== "IEND" && off < imageData.length);

		if (frame) this.frames.push(frame);

		if (!isAnimated) {
			console.error("Non-animated PNG");
		}

		// make Image
		var loadedImages = 0, _this = this;
		for (var i = 0; i < this.frames.length; ++i) {
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
				console.error("Image creation error");
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

	Frames.prototype._loadend = function() {
		this.loaded = true;
		for(var i=0, l=this._onload.length; i<l; ++i) {
			this._onload.shift().call(this);
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

	if (isMSIE9) {
		// see http://miskun.com/javascript/internet-explorer-and-binary-files-data-access/
		document.addEventListener("DOMContentLoaded", function () {
			var script = document.createElement("script");
			script.setAttribute('type', 'text/vbscript');
			script.text = "Function APNGIEBinaryToBinStr(Binary)\r\n" +
				"   APNGIEBinaryToBinStr = CStr(Binary)\r\n" +
				"End Function\r\n";
			document.body.appendChild(script);
		});
	}


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