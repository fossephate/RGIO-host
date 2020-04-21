// const { spawn } = require("child_process");
// const http = require("http");
// const socketio = require("socket.io-client");

// import { spawn } from "child_process";
import child_process from "child_process";
const spawn = child_process.spawn;
import http from "http";
import socketio from "socket.io-client";
// const IS_MODULE = require.main === module;

// todo:
// re-combine with client side lagless2

function convertArgs(list) {
	let final = [];
	for (let i = 0; i < list.length; i++) {
		if (!!list[i]) {
			// split by first occurence of space:
			let splitArgs = [list[i].split(/ (.+)/)[0], list[i].split(/ (.+)/)[1]];
			for (let j = 0; j < splitArgs.length; j++) {
				if (!!splitArgs[j]) {
					final.push(splitArgs[j]);
				}
			}
		}
	}
	return final;
}

export class Lagless2Host {
	constructor(args) {
		this.accountConnection = null;
		this.hostConnection = null;
		this.videoConnection = null;

		this.ffmpegInstanceVideo = null;
		this.ffmpegInstanceAudio = null;
		// this.authHostTimer = null;
		this.authVideoTimer = null;

		this.videoStreamTimer = null;
		this.audioStreamTimer = null;

		this.stopped = false;

		this.settings = {
			debug: false,
			combineAV: false,
			framerate: 30,
			captureRate: 60,
			resolution: 540,
			videoBitrate: 2000,
			offsetX: 0,
			offsetY: 0,
			width: 1280,
			height: 720,
			windowTitle: null,
			videoDevice: null,
			audioDevice: null,
			audioBitrate: 128,
			audioRate: 44100,
			muxDelay: 0.001,
			videoEncoder: "mpeg1video",
			// videoEncoder: args.videoEncoder || "mpeg2video",
			usePulse: false,
			drawMouse: false,
			useCustomRecorderPort: false,
			audioBufferSize: 128,
			videoBufferSize: 512,
			groupOfPictures: 60,
			displayNumber: null,
			screenNumber: null,
			...args,
		};

		this.os = args.os;

		// let path;
		// if (args.isModule) {
		// 	if (process.pkg) {
		// 		path = process.execPath;
		// 		let index = path.lastIndexOf("\\");
		// 		let n = path.length - index;
		// 		path = path.slice(0, -n);
		// 	} else {
		// 		path = process.cwd();
		// 	}
		// } else {
		// 	path = this.appPath;
		// }

		this.ffmpegLocation = args.ffmpegLocation;
		console.log(this.ffmpegLocation);
		// if (this.os === "windows") {
		// 	this.ffmpegLocation = `${path}/misc/utils/ffmpeg.exe`;
		// } else if (this.os === "linux") {
		// 	this.ffmpegLocation = `${path}/misc/utils/ffmpeg`;
		// 	// this.ffmpegLocation = "ffmpeg";
		// }
	}

	connectServers = (options) => {
		if (options.hostIP && options.hostPort) {
			this.hostConnection = socketio(`https://${options.hostIP}`, {
				path: `/${options.hostPort}/socket.io`,
				reconnect: true,
			});
		}

		if (options.videoIP && options.videoPort) {
			this.videoConnection = socketio(`https://${options.videoIP}`, {
				path: `/${options.videoPort}/socket.io`,
				reconnect: true,
			});
		}

		if (options.hostConnection) {
			this.hostConnection = options.hostConnection;
		}
		if (options.videoConnection) {
			this.videoConnection = options.videoConnection;
		}

		console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
		console.log(
			`${options.hostIP}:${options.hostPort} ${options.videoIP}:${options.videoPort}`,
		);
		console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");

		this.setupAuthentication(options.streamKey);
	};

	setupAuthentication = (streamKey) => {
		// this.hostConnection.on("connect", () => {
		// 	this.hostConnection.emit("authenticate", { streamKey: streamKey });
		// });
		// this.authHostTimer = setInterval(() => {
		// 	this.hostConnection.emit("authenticate", { streamKey: streamKey });
		// }, 10000);

		this.videoConnection.on("connect", () => {
			this.videoConnection.sendBuffer = [];
			this.videoConnection.emit("hostAuthenticate", { streamKey: streamKey });
		});
		this.videoConnection.on("disconnect", () => {
			this.stop();
		});
		this.authVideoTimer = setInterval(() => {
			this.videoConnection.emit("hostAuthenticate", { streamKey: streamKey });
			if (this.videoConnection.sendBuffer.length > 2000) {
				this.videoConnection.sendBuffer.splice(
					0,
					this.videoConnection.sendBuffer.length - 2000,
				);
			}
		}, 10000);
	};

	getStreamInfo = (options) => {
		this.accountConnection = socketio(`https://${options.accountIP}`, {
			path: `/${options.accountPort}/socket.io`,
			reconnect: true,
		});

		this.accountConnection.on("connect", () => {
			this.accountConnection.emit(
				"getStreamInfo",
				{ streamKey: options.streamKey },
				(data) => {
					if (!data.success) {
						// todo: send startStreaming
						console.log(`ERROR: ${data.reason}`);
					} else {
						this.connectServers({
							hostIP: data.hostServerIP,
							hostPort: data.hostServerPort,
							videoIP: data.videoServerIP,
							videoPort: data.videoServerPort,
							streamKey: options.streamKey,
						});

						this.run();
					}
				},
			);
		});
	};

	handleVideoClose = (code) => {
		clearTimeout(this.videoStreamTimer);
		console.log(`closing code: ${code}`);
		if (!this.stopped) {
			this.createVideoStream(this.settings);
		}
	};

	handleAudioClose = (code) => {
		clearTimeout(this.audioStreamTimer);
		console.log(`closing code: ${code}`);
		if (!this.stopped) {
			this.createAudioStream(this.settings);
		}
	};

	createVideoStream = (settings) => {
		console.log("restarting ffmpeg (video)");
		try {
			this.ffmpegInstanceVideo.kill();
		} catch (error) {
			console.log("ffmpeg (video) was already killed / doesn't exist.");
		}

		this.ffmpegInstanceVideo = spawn(this.ffmpegLocation, this.getVideoArgs(settings));

		// if (settings.debug) {
		// this.ffmpegInstanceVideo.stdout.on("data", (data) => {
		// 	console.log(`stdout: ${data}`);
		// });
		this.ffmpegInstanceVideo.stderr.on("data", (data) => {
			// if (window.log) {
			if (false) {
				console.log(`stderr (video): ${data}`);
			}
		});
		// }
		this.ffmpegInstanceVideo.on("close", this.handleVideoClose);
		this.ffmpegInstanceVideo.stdout.on("data", this.sendVideoStream);
	};

	createAudioStream = (settings) => {
		console.log("restarting ffmpeg (audio)");
		try {
			this.ffmpegInstanceAudio.kill();
		} catch (error) {
			console.log("ffmpeg (audio) was already killed / doesn't exist.");
		}

		this.ffmpegInstanceAudio = spawn(this.ffmpegLocation, this.getAudioArgs(settings));
		// if (settings.debug) {
		// this.ffmpegInstanceAudio.stdout.on("data", (data) => {
		// 	console.log(`stdout: ${data}`);
		// });
		this.ffmpegInstanceAudio.stderr.on("data", (data) => {
			if (/*window.log*/false) {
				console.log(`stderr (audio): ${data}`);
			}
		});
		// }
		this.ffmpegInstanceAudio.on("close", this.handleAudioClose);
		this.ffmpegInstanceAudio.stdout.on("data", this.sendAudioStream);
	};

	// https://stackoverflow.com/questions/51143100/framerate-vs-r-vs-filter-fps
	// https://trac.ffmpeg.org/wiki/StreamingGuide
	// You may be able to decrease initial "startup" latency by specifing that I-frames come
	// "more frequently" (or basically always, in the case of x264's zerolatency setting),
	// though this can increase frame size and decrease quality, see ​here for some more background.
	// Basically for typical x264 streams, it inserts an I-frame every 250 frames. This means that new clients that connect
	// to the stream may have to wait up to 250 frames before they can start receiving the stream (or start with old data).
	// So increasing I-frame frequency (makes the stream larger, but might decrease latency).
	// For real time captures you can also decrease latency of audio in windows dshow by using the dshow audio_buffer_size ​setting.
	// You can also decrease latency by tuning any broadcast server you are using to minimize latency,
	// and finally by tuning the client that receives the stream to not "cache" any incoming data, which, if it does, increases latency.
	// audio_buffer_size

	// https://stackoverflow.com/questions/43312975/record-sound-on-ubuntu-docker-image

	getVideoArgs = (settings) => {
		let widthHeightArgs = !settings.windowTitle
			? `-video_size ${settings.width}x${settings.height}`
			: null;
		let videoInput;
		let videoFormat;
		if (this.os === "windows") {
			if (settings.videoDevice && settings.capture == "device") {
				videoFormat = "dshow";
				videoInput = `video=${settings.videoDevice}`;
			} else {
				// capture with gdigrab:
				videoFormat = "gdigrab";
				videoInput = settings.windowTitle ? `title=${settings.windowTitle}` : "desktop";
			}
		} else if (this.os === "linux") {
			let dsString = null;
			let displayNumber = settings.displayNumber;
			let screenNumber = settings.screenNumber;
			if (displayNumber === null || (screenNumber === null && !IS_MODULE)) {
				let reg = /^:(\d+)(?:\.(\d+))?$/;
				let results = reg.exec(process.env.DISPLAY);
				if (results[2]) {
					displayNumber = results[1];
					screenNumber = results[2];
					dsString = `:${displayNumber}.${screenNumber}`;
				} else {
					dsString = `:${results[1]}`;
				}
			}
			videoFormat = "x11grab";
			videoInput = `${dsString}+${settings.offsetX},${settings.offsetY}`;
		}

		let args;

		if (!settings.combineAV) {
			args = [
				// input:
				`-f ${videoFormat}`,
				this.os === "windows" && !settings.videoDevice && `-offset_x ${settings.offsetX}`,
				this.os === "windows" && !settings.videoDevice && `-offset_y ${settings.offsetY}`,
				widthHeightArgs,
				`-framerate ${settings.captureRate}`,
				!settings.videoDevice && settings.drawMouse && "-draw_mouse 1",
				`-i ${videoInput}`,

				// output settings:
				"-f mpegts",
				// `-vf fps=fps=1/${settings.framerate}`,// disabled for testing
				// `-vf fps=fps=${settings.framerate}`,// disabled for testing
				`-r ${settings.framerate}`,
				// `-vf scale=${settings.resolution * (16 / 9)}:${settings.resolution}`,
				`-vf scale=${settings.resolution * (settings.width / settings.height)}:${
					settings.resolution
				}`,
				`-b:v ${settings.videoBitrate}k`,
				"-bf 0", // new
				"-me_method zero", // epzs / zero// new
				`-g ${settings.groupOfPictures}`, // group of pictures (gop)
				// `-video_buffer_size ${settings.videoBufferSize}`,
				`-bufsize ${settings.videoBufferSize}k`,
				`-maxrate ${settings.videoBitrate}k`,
				`-c:v ${settings.videoEncoder}`, // mpeg1video
				"-",
			];
		} else {
			// copied from getAudioArgs:
			let audioInput;
			let audioFormat;
			if (this.os === "windows") {
				audioFormat = "dshow";
				audioInput = `audio=${settings.audioDevice}`;
			} else if (this.os === "linux") {
				if (settings.usePulse) {
					audioFormat = "pulse"
					audioInput = `${settings.audioDevice}`;
				} else {
					audioFormat = "alsa";
					audioInput = `hw:${settings.audioDevice}`;
				}
			}

			// audio and video combined:
			args = [
				// video:
				`-f ${videoFormat}`,
				this.os === "windows" && !settings.videoDevice && `-offset_x ${settings.offsetX}`,
				this.os === "windows" && !settings.videoDevice && `-offset_y ${settings.offsetY}`,
				widthHeightArgs,
				`-framerate ${settings.captureRate}`,
				!settings.videoDevice && settings.drawMouse && "-draw_mouse 1",
				`-i title=${videoInput}`,

				// audio:
				`-f ${audioFormat}`,
				`-i ${audioInput}`,

				// output settings:
				"-f mpegts",
				// audio:
				`-ar ${settings.audioRate}`, // 44100
				"-ac 1", // new
				// this.os === "windows" && `-audio_buffer_size ${settings.audioBufferSize}k`, // new
				// `-audio_buffer_size ${settings.audioBufferSize}k`,
				// `-bufsize ${settings.audioBufferSize}k`,
				"-c:a mp2",
				`-b:a ${settings.audioBitrate}k`,
				"-async 1", // audio sync method// new
				`-muxdelay ${settings.muxDelay}`,

				// video:
				`-r ${settings.framerate}`,
				`-vf scale=${settings.resolution * (settings.width / settings.height)}:${
					settings.resolution
				}`,
				`-b:v ${settings.videoBitrate}k`,
				`-maxrate ${settings.videoBitrate}k`,
				"-bf 0", // new
				"-me_method zero", // epzs / zero// new
				`-g ${settings.groupOfPictures}`, // group of pictures (gop)
				// `-video_buffer_size ${settings.videoBufferSize}`,
				`-bufsize ${settings.videoBufferSize}`,
				`-c:v ${settings.videoEncoder}`, // mpeg1video
				"-",
			];
		}

		return convertArgs(args);
	};

	getAudioArgs = (settings) => {
		let audioInput;
		let audioFormat;
		if (this.os === "windows") {
			audioFormat = "dshow";
			audioInput = `audio=${settings.audioDevice}`;
		} else if (this.os === "linux") {
			if (settings.usePulse) {
				audioFormat = "pulse"
				audioInput = `${settings.audioDevice}`;
			} else {
				audioFormat = "alsa";
				audioInput = `hw:${settings.audioDevice}`;
			}
		}

		// audio:
		let args = [
			// input:
			`-f ${audioFormat}`,
			`-i ${audioInput}`,

			// output:
			"-f mpegts",
			`-ar ${settings.audioRate}`, // 44100
			"-ac 1", // new
			// this.os === "windows" && `-audio_buffer_size ${settings.audioBufferSize}k`, // new
			// `-audio_buffer_size ${settings.audioBufferSize}k`,
			`-bufsize ${settings.audioBufferSize}k`,
			"-c:a mp2",
			`-b:a ${settings.audioBitrate}k`,
			"-async 1", // audio sync method// new
			`-muxdelay ${settings.muxDelay}`,
			"-",
		];
		return convertArgs(args);
	};

	createHTTPServer = (port) => {
		http
			.createServer((request, response) => {
				response.connection.setTimeout(0);

				console.log(
					`Stream Connected: ${request.socket.remoteAddress}:${request.socket.remotePort}`,
				);

				request.on("data", this.sendVideoStream);

				request.on("end", () => {
					console.log("stream ended");
				});
			})
			.listen(port);
	};

	sendVideoStream = (data) => {
		clearTimeout(this.videoStreamTimer);
		this.videoStreamTimer = setTimeout(this.handleVideoClose, 3000);
		this.videoConnection.emit("videoData", data);
	};

	sendAudioStream = (data) => {
		clearTimeout(this.audioStreamTimer);
		this.audioStreamTimer = setTimeout(this.handleAudioClose, 3000);
		this.videoConnection.emit("videoData", data);
	};

	start = () => {
		this.stopped = false;
		clearTimeout(this.videoStreamTimer);
		clearTimeout(this.audioStreamTimer);
		console.log("ffmpeg " + this.getVideoArgs(this.settings).join(" "));
		if (this.settings.audioDevice && !this.settings.combineAV) {
			console.log("ffmpeg " + this.getAudioArgs(this.settings).join(" "));
		}

		if (this.settings.useCustomRecorderPort) {
			this.createHTTPServer(this.settings.useCustomRecorderPort);
		} else {
			this.createVideoStream(this.settings);
			if (this.settings.audioDevice && !this.settings.combineAV) {
				this.createAudioStream(this.settings);
			}
		}
	};

	stop = () => {
		this.stopped = true;
		// clearInterval(this.authHostTimer);
		clearInterval(this.authVideoTimer);
		clearTimeout(this.videoStreamTimer);
		clearTimeout(this.audioStreamTimer);
		try {
			this.ffmpegInstanceVideo.off("close", this.handleVideoClose);
			this.ffmpegInstanceVideo.kill();
			this.ffmpegInstanceVideo = null;
		} catch (error) {
			console.log("ffmpeg (video) was already killed / doesn't exist.");
		}
		try {
			this.ffmpegInstanceAudio.off("close", this.handleAudioClose);
			this.ffmpegInstanceAudio.kill();
			this.ffmpegInstanceAudio = null;
		} catch (error) {
			console.log("ffmpeg (audio) was already killed / doesn't exist.");
		}
	};

	destroy = () => {
		this.stop();
	};
}