const { spawn } = require("child_process");
const http = require("http");
const socketio = require("socket.io-client");

// todo:
// re-combine with client side lagless2

function getArgs() {
	let args = {};
	process.argv.slice(2, process.argv.length).forEach((arg) => {
		// long arg
		if (arg.slice(0, 2) === "--") {
			const longArg = arg.split("=");
			args[longArg[0].slice(2, longArg[0].length)] = longArg[1];
		}
		// flags
		else if (arg[0] === "-") {
			const flags = arg.slice(1, arg.length).split("");
			flags.forEach((flag) => {
				args[flag] = true;
			});
		}
	});
	return args;
}

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
	constructor(args, appPath, hostConnection, videoConnection, accountConnection) {
		this.accountConnection = accountConnection || null;
		this.hostConnection = hostConnection || null;
		this.videoConnection = videoConnection || null;
		this.ffmpegInstanceVideo = null;
		this.ffmpegInstanceAudio = null;
		this.appPath = appPath || null;
		// this.authHostTimer = null;
		this.authVideoTimer = null;

		this.videoStreamTimer = null;
		this.audioStreamTimer = null;

		this.stopped = false;

		this.settings = {
			...args,
			debug: false,
			combineAV: args.combineAV || false,
			framerate: args.framerate || 30,
			captureRate: args.captureRate || 60,
			resolution: args.resolution || 540,
			videoBitrate: args.videoBitrate || 2000,
			offsetX: args.offsetX || 0,
			offsetY: args.offsetY || 0,
			width: args.width || 1280,
			height: args.height || 720,
			windowTitle: args.windowTitle || null,
			videoDevice: args.videoDevice || null,
			audioDevice: args.audioDevice || null,
			audioBitrate: args.audioBitrate || 128,
			audioRate: args.audioRate || 44100,
			videoEncoder: args.videoEncoder || "mpeg1video",
			// videoEncoder: args.videoEncoder || "mpeg2video",
			drawMouse: args.drawMouse || false,
			useCustomRecorderPort: args.useCustomRecorderPort || false,
			audioBufferSize: args.audioBufferSize || 128,
			videoBufferSize: args.videoBufferSize || 512,
			groupOfPictures: args.groupOfPictures || 60,
			displayNumber: args.displayNumber || null,
			screenNumber: args.screenNumber || null,
		};

		this.os = "windows";
		let platform;

		if (require.main === module) {
			platform = process.platform;
		} else {
			platform = window.process.platform;
		}

		switch (platform) {
			case "win32":
				this.os = "windows";
				break;
			case "linux":
				this.os = "linux";
				break;
			default:
				this.os = "linux";
				break;
		}

		let path;
		if (require.main === module) {
			if (process.pkg) {
				path = process.execPath;
				let index = path.lastIndexOf("\\");
				let n = path.length - index;
				path = path.slice(0, -n);
			} else {
				path = process.cwd();
			}
		} else {
			path = this.appPath;
		}

		this.ffmpegLocation;
		if (this.os === "windows") {
			this.ffmpegLocation = path + "\\misc\\utils\\ffmpeg.exe";
		} else if (this.os === "linux") {
			// ffmpegLocation = path + "\\ffmpeg\\ffmpeg";
			this.ffmpegLocation = "ffmpeg";
		}
	}

	connectServers = (options) => {
		// this.hostConnection = socketio(`https://${options.hostIP}`, {
		// 	path: `/${options.hostPort}/socket.io`,
		// 	reconnect: true,
		// });

		this.videoConnection = socketio(`https://${options.videoIP}`, {
			path: `/${options.videoPort}/socket.io`,
			reconnect: true,
		});

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
			if (window.log) {
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
			if (window.log) {
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
			let displayNumber = settings.displayNumber;
			let screenNumber = settings.screenNumber;
			if (displayNumber === null || (screenNumber === null && require.main !== module)) {
				let reg = /^:(\d+)\.(\d+)$/;
				let results = reg.exec(process.env.DISPLAY);
				displayNumber = results[1];
				screenNumber = results[2];
			}
			videoFormat = "x11grab";
			videoInput = `:${displayNumber}.${screenNumber}+${settings.offsetX},${settings.offsetY}`;
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
			// audio and video combined:
			// args = [
			// 	// video:
			// 	"-f gdigrab",
			// 	`-offset_x ${settings.offsetX}`,
			// 	`-offset_y ${settings.offsetY}`,
			// 	`-video_size ${settings.width}x${settings.height}`,
			// 	// `-r ${settings.captureRate}`,
			// 	`-framerate ${settings.captureRate}`,
			// 	"-draw_mouse 0",
			// 	`-i title=${settings.windowTitle}`,
			// 	// "-show_region 1",
			// 	// audio:
			// 	"-f dshow",
			// 	"-ar 44100", // 44100
			// 	"-ac 1", // new
			// 	"-audio_buffer_size 0",// new
			// 	`-i audio=${settings.audioDevice}`,
			// 	// output settings:
			// 	"-f mpegts",
			// 	// audio:
			// 	"-c:a mp2",
			// 	`-b:a ${settings.audioBitrate}}k`,
			// 	// "-tune zerolatency",// new// might be x264 only
			// 	"-async 1",// audio sync method// new
			//	`-audio_buffer_size ${settings.audioBufferSize}`,
			//	`-bufsize ${settings.audioBufferSize}`,
			// 	"-muxdelay 0.001",
			// 	// video:
			// 	// "-vf", "fps=fps=1/" + settings.framerate,// disabled for testing
			// 	"-vf", `scale=${(settings.resolution * (16 / 9))}:${settings.resolution}`,
			// 	"-b:v", `${settings.videoBitrate}k`,
			// 	"-bf", 0, // new
			// 	"-me_method", "zero", // epzs / zero// new
			// 	`-g ${settings.groupOfPictures}`, // group of pictures (gop)
			//	`-video_buffer_size ${settings.videoBufferSize}`,
			// 	`-c:v ${settings.videoEncoder}`, // mpeg1video
			// 	"-",
			// ];
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
			audioFormat = "alsa";
			audioInput = `hw:${settings.audioDevice}`;
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
			"-muxdelay 0.001",
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
		if (this.settings.audioDevice) {
			console.log("ffmpeg " + this.getAudioArgs(this.settings).join(" "));
		}

		if (this.settings.useCustomRecorderPort) {
			this.createHTTPServer(this.settings.useCustomRecorderPort);
		} else {
			this.createVideoStream(this.settings);
			if (this.settings.audioDevice) {
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

if (require.main === module) {
	let myArgs = getArgs();

	if (
		(myArgs.accountIP && myArgs.accountPort && myArgs.streamKey) ||
		((myArgs.hostIP && myArgs.hostPort) || myArgs.videoIP,
		myArgs.videoPort && myArgs.streamKey)
	) {
	} else {
		console.log(
			"missing arguments! you need required args: --streamKey and --hostIP, --hostPort, --videoIP, --videoPort, or --accountIP, --accountPort",
		);
		console.log(
			"optional args: width, height, offsetX, offsetY, framerate, \
			resolution, captureRate, videoBitrate, windowTitle, \
			audioBitrate, audioRate, videoEncoder, useCustomRecorderPort, \
			videoDevice, audioDevice, combineAV, drawMouse.",
		);
		console.log(myArgs);
	}

	let stream = new Lagless2Host(myArgs);

	if (myArgs.hostIP) {
		stream.connectServers({
			hostIP: myArgs.hostIP,
			hostPort: myArgs.hostPort,
			videoIP: myArgs.videoIP,
			videoPort: myArgs.videoPort,
			streamKey: myArgs.streamKey,
		});

		stream.run();
	} else {
		stream.getStreamInfo({
			accountIP: myArgs.accountIP,
			accountPort: myArgs.accountPort,
			streamKey: myArgs.streamKey,
		});
	}

	// restart to prevent freezing:
	// setInterval(() => {
	// 	lagless2Host.createVideoStream(settings);
	// }, 60000 * 2); // 2 minutes
	// if (myArgs.audioDevice) {
	// 	setInterval(() => {
	// 		lagless2Host.createAudioStream(settings);
	// 	}, 60000 * 10); // 10 minutes
	// }
} else {
	console.log("required as a module");
}
