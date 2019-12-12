import SimplePeer from "simple-peer";

let BandwidthHandler = (function() {
	function setBAS(sdp, bandwidth, isScreen) {
		if (!bandwidth) {
			return sdp;
		}

		if (typeof isFirefox !== "undefined" && isFirefox) {
			return sdp;
		}

		if (isScreen) {
			if (!bandwidth.screen) {
				console.warn(
					"It seems that you are not using bandwidth for screen. Screen sharing is expected to fail.",
				);
			} else if (bandwidth.screen < 300) {
				console.warn(
					"It seems that you are using wrong bandwidth value for screen. Screen sharing is expected to fail.",
				);
			}
		}

		// if screen; must use at least 300kbs
		if (bandwidth.screen && isScreen) {
			sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, "");
			sdp = sdp.replace(
				/a=mid:video\r\n/g,
				"a=mid:video\r\nb=AS:" + bandwidth.screen + "\r\n",
			);
		}

		// remove existing bandwidth lines
		if (bandwidth.audio || bandwidth.video || bandwidth.data) {
			sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, "");
		}

		if (bandwidth.audio) {
			sdp = sdp.replace(
				/a=mid:audio\r\n/g,
				"a=mid:audio\r\nb=AS:" + bandwidth.audio + "\r\n",
			);
		}

		if (bandwidth.video) {
			sdp = sdp.replace(
				/a=mid:video\r\n/g,
				"a=mid:video\r\nb=AS:" + (isScreen ? bandwidth.screen : bandwidth.video) + "\r\n",
			);
		}

		return sdp;
	}

	// Find the line in sdpLines that starts with |prefix|, and, if specified,
	// contains |substr| (case-insensitive search).
	function findLine(sdpLines, prefix, substr) {
		return findLineInRange(sdpLines, 0, -1, prefix, substr);
	}

	// Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
	// and, if specified, contains |substr| (case-insensitive search).
	function findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
		var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
		for (var i = startLine; i < realEndLine; ++i) {
			if (sdpLines[i].indexOf(prefix) === 0) {
				if (!substr || sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
					return i;
				}
			}
		}
		return null;
	}

	// Gets the codec payload type from an a=rtpmap:X line.
	function getCodecPayloadType(sdpLine) {
		var pattern = new RegExp("a=rtpmap:(\\d+) \\w+\\/\\d+");
		var result = sdpLine.match(pattern);
		return result && result.length === 2 ? result[1] : null;
	}

	function setVideoBitrates(sdp, params) {
		params = params || {};
		var xgoogle_min_bitrate = params.min;
		var xgoogle_max_bitrate = params.max;

		var sdpLines = sdp.split("\r\n");

		// VP8
		var vp8Index = findLine(sdpLines, "a=rtpmap", "VP8/90000");
		var vp8Payload;
		if (vp8Index) {
			vp8Payload = getCodecPayloadType(sdpLines[vp8Index]);
		}

		if (!vp8Payload) {
			return sdp;
		}

		var rtxIndex = findLine(sdpLines, "a=rtpmap", "rtx/90000");
		var rtxPayload;
		if (rtxIndex) {
			rtxPayload = getCodecPayloadType(sdpLines[rtxIndex]);
		}

		if (!rtxIndex) {
			return sdp;
		}

		var rtxFmtpLineIndex = findLine(sdpLines, "a=fmtp:" + rtxPayload.toString());
		if (rtxFmtpLineIndex !== null) {
			var appendrtxNext = "\r\n";
			appendrtxNext +=
				"a=fmtp:" +
				vp8Payload +
				" x-google-min-bitrate=" +
				(xgoogle_min_bitrate || "228") +
				"; x-google-max-bitrate=" +
				(xgoogle_max_bitrate || "228");
			sdpLines[rtxFmtpLineIndex] = sdpLines[rtxFmtpLineIndex].concat(appendrtxNext);
			sdp = sdpLines.join("\r\n");
		}

		return sdp;
	}

	function setOpusAttributes(sdp, params) {
		params = params || {};

		var sdpLines = sdp.split("\r\n");

		// Opus
		var opusIndex = findLine(sdpLines, "a=rtpmap", "opus/48000");
		var opusPayload;
		if (opusIndex) {
			opusPayload = getCodecPayloadType(sdpLines[opusIndex]);
		}

		if (!opusPayload) {
			return sdp;
		}

		var opusFmtpLineIndex = findLine(sdpLines, "a=fmtp:" + opusPayload.toString());
		if (opusFmtpLineIndex === null) {
			return sdp;
		}

		var appendOpusNext = "";
		appendOpusNext +=
			"; stereo=" + (typeof params.stereo != "undefined" ? params.stereo : "1");
		appendOpusNext +=
			"; sprop-stereo=" +
			(typeof params["sprop-stereo"] != "undefined" ? params["sprop-stereo"] : "1");

		if (typeof params.maxaveragebitrate != "undefined") {
			appendOpusNext +=
				"; maxaveragebitrate=" + (params.maxaveragebitrate || 128 * 1024 * 8);
		}

		if (typeof params.maxplaybackrate != "undefined") {
			appendOpusNext += "; maxplaybackrate=" + (params.maxplaybackrate || 128 * 1024 * 8);
		}

		if (typeof params.cbr != "undefined") {
			appendOpusNext += "; cbr=" + (typeof params.cbr != "undefined" ? params.cbr : "1");
		}

		if (typeof params.useinbandfec != "undefined") {
			appendOpusNext += "; useinbandfec=" + params.useinbandfec;
		}

		if (typeof params.usedtx != "undefined") {
			appendOpusNext += "; usedtx=" + params.usedtx;
		}

		if (typeof params.maxptime != "undefined") {
			appendOpusNext += "\r\na=maxptime:" + params.maxptime;
		}

		sdpLines[opusFmtpLineIndex] = sdpLines[opusFmtpLineIndex].concat(appendOpusNext);

		sdp = sdpLines.join("\r\n");
		return sdp;
	}

	return {
		setApplicationSpecificBandwidth: function(sdp, bandwidth, isScreen) {
			return setBAS(sdp, bandwidth, isScreen);
		},
		setVideoBitrates: function(sdp, params) {
			return setVideoBitrates(sdp, params);
		},
		setOpusAttributes: function(sdp, params) {
			return setOpusAttributes(sdp, params);
		},
	};
})();

function mySDPTransform(sdp) {
	let bandwidth = {
		screen: 300, // 300kbits minimum
		audio: 500, // 500kbits  minimum
		video: 256, // 256kbits (both min-max)
	};

	let isScreenSharing = false;

	sdp = BandwidthHandler.setApplicationSpecificBandwidth(sdp, bandwidth, isScreenSharing);
	sdp = BandwidthHandler.setVideoBitrates(sdp, {
		min: bandwidth.video,
		max: bandwidth.video,
	});
	let audioParams = {
		stereo: 0, // to disable stereo (to force mono audio)
		"sprop-stereo": 0,
		useinbandfec: 0, // use inband fec
		usedtx: 0, // use dtx
		ptime: 3,
		maxptime: 10,
		cbr: 0, // disable cbr
		maxaveragebitrate: 1000 * 1024 * 8, // 1000 kbits
		maxplaybackrate: 500 * 1024 * 8, // 48 khz?
	};
	sdp = BandwidthHandler.setOpusAttributes(sdp, audioParams);

	return sdp;
}

export default class Lagless4Host {
	constructor(socket, streamKey) {
		this.socket = socket;
		this.streamKey = streamKey;

		this.clients = [];
		this.stream = null;

		this.timer = null;
		this.peer = null;

		this.findClientByID = this.findClientByID.bind(this);
		this.run = this.run.bind(this);
		this.pause = this.pause.bind(this);
		this.resume = this.resume.bind(this);
	}

	findClientByID(id) {
		let index = -1;
		for (let i = 0; i < this.clients.length; i++) {
			if (this.clients[i].id == id) {
				index = i;
				return index;
			}
		}
		return index;
	}

	pause() {
		clearInterval(this.timer);
		if (this.socket) {
			this.socket.close();
		}
	}

	resume() {}

	run(stream) {
		this.stream = stream;

		this.timer = setInterval(() => {
			this.socket.emit("authenticate", { streamKey: this.streamKey });
		}, 5000);

		this.socket.on("createNewPeer", (data) => {
			let id = data.id;

			this.peer = new SimplePeer({
				initiator: true,
				trickle: true,
				stream: this.stream,
				sdpTransform: mySDPTransform,
			});

			this.peer.on("error", (error) => {
				console.log("error", error);
			});

			this.peer.on("signal", (data) => {
				console.log("SIGNAL", JSON.stringify(data));
				this.socket.emit("hostPeerSignalReply", {
					id: id,
					data: JSON.stringify(data),
				});
			});

			this.peer.on("connect", () => {
				console.log("CONNECT");
				this.peer.send(Math.random());
			});

			this.peer.on("data", (data) => {
				console.log("data: " + data);
			});

			this.clients.push({ id: id, peer: this.peer });
		});

		this.socket.on("clientPeerSignal", (data) => {
			let index = this.findClientByID(data.id);
			if (index == -1) {
				return;
			}
			this.clients[index].peer.signal(JSON.parse(data.data));
		});
	}
}
