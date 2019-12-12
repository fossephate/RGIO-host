const { spawn } = require("child_process");
const http = require("http");
const socketio = require("socket.io-client");

let os = "windows";
switch (window.process.platform) {
	case "win32":
		os = "windows";
		break;
	case "linux":
		os = "linux";
		break;
	default:
		os = "linux";
		break;
}

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

// relay:
function sendStream(data) {
	videoConnection.emit("videoData", data);
}

function createHTTPServer(port) {
	http
		.createServer((request, response) => {
			response.connection.setTimeout(0);

			console.log(
				`Stream Connected: ${request.socket.remoteAddress}:${request.socket.remotePort}`,
			);

			request.on("data", sendStream);

			request.on("end", () => {
				console.log("stream ended");
			});
		})
		.listen(port);
}

// https://stackoverflow.com/questions/51143100/framerate-vs-r-vs-filter-fps
// https://trac.ffmpeg.org/wiki/StreamingGuide
// You may be able to decrease initial "startup" latency by specifing that I-frames come "more frequently" (or basically always, in the case of x264's zerolatency setting), though this can increase frame size and decrease quality, see ​here for some more background. Basically for typical x264 streams, it inserts an I-frame every 250 frames. This means that new clients that connect to the stream may have to wait up to 250 frames before they can start receiving the stream (or start with old data). So increasing I-frame frequency (makes the stream larger, but might decrease latency). For real time captures you can also decrease latency of audio in windows dshow by using the dshow audio_buffer_size ​setting. You can also decrease latency by tuning any broadcast server you are using to minimize latency, and finally by tuning the client that receives the stream to not "cache" any incoming data, which, if it does, increases latency.
// audio_buffer_size

function getVideoArgs(settings) {
	let widthHeightArgs = !settings.windowTitle
		? `-video_size ${settings.width}x${settings.height}`
		: null;
	let videoInput;
	let videoFormat;
	if (os === "windows") {
		if (settings.dshowVideoDevice) {
			videoFormat = "dshow";
			videoInput = `video=${settings.dshowVideoDevice}`;
		} else {
			// capture with gdigrab:
			videoFormat = "gdigrab";
			videoInput = settings.windowTitle ? `title=${settings.windowTitle}` : "desktop";
		}
	} else if (os === "linux") {
		videoFormat = "x11grab";
		videoInput = `:0.0+${settings.offsetX},${settings.offsetY}`;
	}

	let args;

	if (!settings.combineAV) {
		args = [
			// input:
			`-f ${videoFormat}`,
			os === "windows" && !settings.dshowVideoDevice && `-offset_x ${settings.offsetX}`,
			os === "windows" && !settings.dshowVideoDevice && `-offset_y ${settings.offsetY}`,
			widthHeightArgs,
			`-framerate ${settings.captureRate}`,
			!settings.dshowVideoDevice && settings.drawMouse && "-draw_mouse 1",
			`-i ${videoInput}`,

			// output settings:
			"-f mpegts",
			// `-vf fps=fps=1/${settings.framerate}`,// disabled for testing
			// `-vf fps=fps=${settings.framerate}`,// disabled for testing
			`-r ${settings.framerate}`,
			`-vf scale=${settings.resolution * (16 / 9)}:${settings.resolution}`,
			`-b:v ${settings.videoBitrate}k`,
			"-bf 0", // new
			"-me_method zero", // epzs / zero// new
			// "-g	10", // group of pictures (gop)// new x264
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
		// 	"-muxdelay 0.001",
		// 	// video:
		// 	// "-vf", "fps=fps=1/" + settings.framerate,// disabled for testing
		// 	"-vf", `scale=${(settings.resolution * (16 / 9))}:${settings.resolution}`,
		// 	"-b:v", `${settings.videoBitrate}k`,
		// 	"-bf", 0, // new
		// 	"-me_method", "zero", // epzs / zero// new
		// 	// "-g 10",// group of pictures (gop)// new x264
		// 	`-c:v ${settings.videoEncoder}`, // mpeg1video
		// 	"-",
		// ];
	}

	return convertArgs(args);
}

let path;
if (process.pkg) {
	path = process.execPath;
	let index = path.lastIndexOf("\\");
	let n = path.length - index;
	path = path.slice(0, -n);
} else {
	path = process.cwd();
}

let ffmpegLocation;
if (os === "windows") {
	ffmpegLocation = path + "\\ffmpeg\\ffmpeg.exe";
} else if (os === "linux") {
	// ffmpegLocation = path + "\\ffmpeg\\ffmpeg";
	ffmpegLocation = "ffmpeg";
}

// audio:
function getAudioArgs(settings) {
	let audioInput;
	let audioFormat;
	if (os === "windows") {
		audioFormat = "dshow";
		audioInput = `audio=${settings.audioDevice}`;
	} else if (os === "linux") {
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
		os === "windows" && "-audio_buffer_size 0", // new
		"-c:a mp2",
		`-b:a ${settings.audioBitrate}k`,
		"-async 1", // audio sync method// new
		"-muxdelay 0.001",
		"-",
	];
	return convertArgs(args);
}

let ffmpegInstanceVideo;
let ffmpegInstanceAudio;
let hostConnection;
let videoConnection;

function createVideoStream(settings) {
	console.log("restarting ffmpeg (video)");
	try {
		ffmpegInstanceVideo.kill();
	} catch (error) {
		console.log("ffmpeg (video) was already killed / doesn't exist.");
	}

	ffmpegInstanceVideo = spawn(ffmpegLocation, getVideoArgs(settings));

	if (settings.debug) {
		// ffmpegInstanceVideo.stdout.on("data", (data) => {
		// 	console.log(`stdout: ${data}`);
		// });
		ffmpegInstanceVideo.stderr.on("data", (data) => {
			console.log(`stderr: ${data}`);
		});
	}
	ffmpegInstanceVideo.on("close", (code) => {
		console.log(`closing code: ${code}`);
	});
	let readStream = ffmpegInstanceVideo.stdout;
	// readStream = readStream.pipe(new Splitter(NALseparator));
	readStream.on("data", sendStream);
}

function createAudioStream(settings) {
	console.log("restarting ffmpeg (audio)");
	try {
		ffmpegInstanceAudio.kill();
	} catch (error) {
		console.log("ffmpeg (audio) was already killed / doesn't exist.");
	}

	ffmpegInstanceAudio = spawn(ffmpegLocation, getAudioArgs(settings));
	if (settings.debug) {
		// ffmpegInstanceAudio.stdout.on("data", (data) => {
		// 	console.log(`stdout: ${data}`);
		// });
		ffmpegInstanceAudio.stderr.on("data", (data) => {
			console.log(`stderr: ${data}`);
		});
	}
	ffmpegInstanceAudio.on("close", (code) => {
		console.log(`closing code: ${code}`);
	});
	let readStream = ffmpegInstanceAudio.stdout;
	readStream.on("data", sendStream);
}

if (require.main === module) {
	let myArgs = getArgs();

	if (
		(!myArgs.host1, !myArgs.port1 || !myArgs.host2, !myArgs.port2 || !myArgs.streamKey)
	) {
		console.log(
			"missing arguments! you need required args: --host1, --port1, --host2, --port2, --streamKey",
		);
		console.log("host1 is the host server and host2 is the video relay server.");
		console.log(
			"optional args: width, height, offsetX, offsetY, framerate, \
			resolution, captureRate, videoBitrate, windowTitle, audioDevice, \
			audioBitrate, audioRate, videoEncoder, useCustomRecorderPort, \
			dshowVideoDevice, dshowAudioDevice, combineAV, drawMouse.",
		);
		console.log(myArgs);
		return;
	}

	let settings = {
		debug: true,
		combineAV: myArgs.combineAV || false,
		framerate: myArgs.framerate || 30,
		captureRate: myArgs.captureRate || 60,
		resolution: myArgs.resolution || 360,
		videoBitrate: myArgs.videoBitrate || 2000,
		offsetX: myArgs.offsetX || 0,
		offsetY: myArgs.offsetY || 0,
		width: myArgs.width || 1280,
		height: myArgs.height || 720,
		dshowVideoDevice: myArgs.dshowVideoDevice || null,
		dshowAudioDevice: myArgs.dshowAudioDevice || null,
		windowTitle: myArgs.windowTitle || null,
		audioDevice: myArgs.audioDevice || null,
		audioBitrate: myArgs.audioBitrate || 128,
		audioRate: myArgs.audioRate || 44100,
		videoEncoder: myArgs.videoEncoder || "mpeg1video",
		drawMouse: myArgs.drawMouse || false,
		useCustomRecorderPort: myArgs.useCustomRecorderPort || false,
	};

	console.log("ffmpeg " + getVideoArgs(settings).join(" "));
	console.log("ffmpeg " + getAudioArgs(settings).join(" "));

	hostConnection = socketio(myArgs.host1, {
		path: `/${myArgs.port1}/socket.io`,
		reconnect: true,
	});
	videoConnection = socketio(myArgs.host2, {
		path: `/${myArgs.port2}/socket.io`,
		reconnect: true,
	});

	videoConnection.on("connect", () => {
		videoConnection.emit("authenticate", { streamKey: myArgs.streamKey });
	});
	setInterval(() => {
		videoConnection.emit("authenticate", { streamKey: myArgs.streamKey });
	}, 10000);

	if (settings.useCustomRecorderPort) {
		createHTTPServer(settings.useCustomRecorderPort);
	} else {
		createVideoStream(settings);
		if (settings.audioDevice) {
			createAudioStream(settings);
		}
	}

	// restart to prevent freezing:
	// setInterval(() => {
	// 	createVideoStream(settings);
	// }, 60000 * 2); // 2 minutes
	// if (myArgs.audioDevice) {
	// 	setInterval(() => {
	// 		createAudioStream(settings);
	// 	}, 60000 * 10); // 10 minutes
	// }
} else {
	console.log("required as a module");
}

export class Relay {
	constructor() {}
}
