// const IS_MODULE = require.main === module;
let HOST_OS = "windows";
let platform;

// if (IS_MODULE) {
// 	platform = process.platform;
// } else {
// 	platform = window.process.platform;
// }

platform = process.platform;

switch (platform) {
	case "win32":
		HOST_OS = "windows";
		break;
	case "linux":
		HOST_OS = "linux";
		break;
	default:
		HOST_OS = "linux";
		break;
}

import socketio from "socket.io-client";
import HostControl from "../../../hostControl/HostControl.mjs";
import { Lagless2Host } from "./lagless2.mjs";
import { Lagless4Host } from "./lagless4.mjs";
import { spawn } from "child_process";
import desktopCapturer from "electron";

// import socketio from "socket.io-client";
// import HostControl from "../../../hostControl/HostControl.js";
// import { Lagless2Host } from "./lagless2.js";
// import { Lagless4Host } from "./lagless4.js";
// // import Lagless2Host from "./lagless2.js";
// // import Lagless4Host from "./lagless4.js";
// import { spawn } from "child_process";
// import desktopCapturer from "electron";

// const HostStream = require("./src/libs/lagless/HostStream.mjs");
// import HostStream from "./src/libs/lagless/HostStream.mjs";

// const socketio = require("socket.io-client");
// const HostControl = require("src/../hostControl/HostControl.js");
// const Lagless2Host = require("src/libs/lagless/lagless2.js").Lagless2Host;
// const Lagless4Host = require("src/libs/lagless/lagless4.js").Lagless4Host;
// const { spawn } = require("child_process");
// const { desktopCapturer } = require("electron");

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

export default class HostStream {
	constructor(args) {
		this.accountConnection = null;
		this.hostConnection = null;
		this.videoConnection = null;

		this.videoStream = null;
		this.hostControl = null;

		this.authToken = null;
		this.streamKey = null;

		this.args = args;
	}

	connectAccountServer = (options) => {
		if (options.connection) {
			this.accountConnection = options.connection;
		} else if (options.ip && options.port) {
			this.accountConnection = socketio(`https://${options.ip}`, {
				path: `/${options.port}/socket.io`,
				reconnect: true,
			});
		}
	};

	startStreaming = (args) => {
		if (this.hostConnection) {
			this.hostConnection.removeAllListeners();
			this.hostConnection.destroy();
			this.hostConnection = null;
		}
		if (this.videoConnection) {
			this.videoConnection.removeAllListeners();
			this.videoConnection.destroy();
			this.videoConnection = null;
		}

		this.hostConnection = socketio(`https://${args.hostIP}`, {
			path: `/${args.hostPort}/socket.io`,
			transports: ["polling", "websocket", "xhr-polling", "jsonp-polling"],
		});

		this.hostConnection.on("disconnect", () => {
			this.handleStopStreaming(true);
		});

		// start video host:

		// todo set host2 and port2 based on region and args:
		args = { ...args, ...this.args, os: HOST_OS /*, isModule: IS_MODULE*/ };
		this.args = args;

		this.videoConnection = socketio(`https://${args.videoIP}`, {
			path: `/${args.videoPort}/socket.io`,
			transports: ["polling", "websocket", "xhr-polling", "jsonp-polling"],
		});

		if (args.videoType === "webRTC") {
			this.videoStream = new Lagless4Host(this.videoConnection, args.streamKey);

			navigator.mediaDevices.enumerateDevices().then((sources) => {
				console.log(sources);

				let audioConstraint = null;
				let videoConstraint = null;

				if (!args.audioDevice) {
					audioConstraint = false;
				} else if (args.audioDevice === "Desktop Audio") {
					audioConstraint = {
						mandatory: {
							chromeMediaSource: "desktop",
						},
					};
				}

				if (args.capture === "desktop") {
					videoConstraint = {
						mandatory: {
							chromeMediaSource: "desktop",
							// minWidth: 1280,
							// maxWidth: 1280,
							// minHeight: 720,
							// maxHeight: 720,
						},
					};
				}

				desktopCapturer
					.getSources({ types: ["window", "screen"] })
					.then(async (sources) => {
						if (args.windowTitle) {
							for (const source of sources) {
								if (source.name === args.windowTitle) {
									try {
										const stream = await navigator.mediaDevices.getUserMedia({
											audio: audioConstraint,
											video: { mandatory: { chromeMediaSourceId: source.id } },
										});
										this.stream.start(stream);
									} catch (error) {
										// this.props.openAlert({ title: error });
									}
									return;
								}
							}
						} else {
							for (const source of sources) {
								if (source.name === "Screen 1") {
									try {
										const stream = await navigator.mediaDevices.getUserMedia({
											audio: audioConstraint,
											video: {
												...videoConstraint,
												mandatory: {
													chromeMediaSource: "desktop",
													chromeMediaSourceId: source.id,
												},
											},
										});
										this.videoStream.start(stream);
									} catch (error) {
										// this.props.openAlert({ title: error });
									}
									return;
								}
							}
						}
					});
			});
		} else if (args.videoType === "mpeg2") {
			this.videoStream = new Lagless2Host(args);
			console.log(this.videoStream);

			this.videoStream.connectServers({
				hostConnection: this.hostConnection,
				videoConnection: this.videoConnection,
				streamKey: args.streamKey,
			});
			// this.videoStream.setupAuthentication(args.streamKey);
			this.videoStream.start();
		}
	};

	stopStreaming = () => {
		this.killProcesses();
	};

	runCustomControl = (path) => {
		// start control host:
		let catLocation = this.args.catLocation;
		let customScriptLocation = path;
		// read customControl.js file from disk:
		let catProc = spawn(catLocation, [customScriptLocation]);
		catProc.stdout.setEncoding("utf8");
		catProc.stdout.on("data", (data) => {
			data = data.toString();
			this.hostControl = new HostControl(this.hostConnection, {
				streamSettings: this.args,
				controllerCount: this.args.controllerCount,
				keyboardEnabled: this.args.keyboardEnabled,
				mouseEnabled: this.args.mouseEnabled,
				controlSwitch: this.args.controlSwitch,
			});
			this.hostControl.setupAuthentication(this.args.streamKey);
			this.hostControl.start(data);
		});
	};

	killProcesses = () => {
		if (this.hostConnection) {
			this.hostConnection.removeAllListeners();
			this.hostConnection.destroy();
			this.hostConnection = null;
		}
		if (this.videoConnection) {
			this.videoConnection.removeAllListeners();
			this.videoConnection.destroy();
			this.videoConnection = null;
		}
		if (this.videoStream) {
			this.videoStream.destroy();
			this.videoStream = null;
		}
		if (this.hostControl) {
			this.hostControl.destroy();
			this.hostControl = null;
		}
	};

	destroy = () => {
		this.killProcesses();
	};

	login = (user, password) => {
		this.accountConnection.emit(
			"login",
			{ user: user, password: password, socketid: this.accountConnection.id },
			(data) => {
				if (data.success) {
					this.authToken = data.authToken;
				} else {
					console.log(data.reason);
				}
			},
		);
	};
}

// if (!IS_MODULE) {
if (true) {
	let args = getArgs();

	if (!args.user) {
		args.ffmpegLocation = `./misc/utils/ffmpeg.exe`;
		args.catLocation = `./misc/utils/cat.exe`;
		args.accountIP = "remotegames.io";
		args.accountPort = 8099;
		args.user = "fosse5";
		args.password = "";
		// return;
	}

	args = {
		...args,
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
		controllerCount: 0,

		streamTitle: "",
		region: "US East",
		width: 1280,
		height: 720,
		capture: "desktop",
		videoType: "mpeg2",
		offsetX: 0,
		offsetY: 0,
		controllerCount: 1,
	};

	let hostStream = new HostStream();
	hostStream.connectAccountServer({ ip: args.accountIP, port: args.accountPort });
	hostStream.login(args.user, args.password);

	setTimeout(() => {
		hostStream.accountConnection.emit(
			"stopStreaming",
			{
				authToken: hostStream.authToken,
			},
			(data) => {
				console.log(data);
				hostStream.accountConnection.emit(
					"startStreaming",
					{
						authToken: hostStream.authToken,
						streamSettings: {
							...args,
						},
					},
					(data) => {
						hostStream.startStreaming({ ...args, ...data });
					},
				);
			},
		);
	}, 2000);

	// if (
	// 	(myArgs.accountIP && myArgs.accountPort && myArgs.streamKey) ||
	// 	((myArgs.hostIP && myArgs.hostPort) || myArgs.videoIP,
	// 	myArgs.videoPort && myArgs.streamKey)
	// ) {
	// } else {
	// 	console.log(
	// 		"missing arguments! you need required args: --streamKey and --hostIP, --hostPort, --videoIP, --videoPort, or --accountIP, --accountPort",
	// 	);
	// 	console.log(
	// 		"optional args: width, height, offsetX, offsetY, framerate, \
	// 		resolution, captureRate, videoBitrate, windowTitle, \
	// 		audioBitrate, audioRate, videoEncoder, useCustomRecorderPort, \
	// 		videoDevice, audioDevice, combineAV, drawMouse.",
	// 	);
	// 	console.log(myArgs);
	// }

	// let stream = new Lagless2Host(myArgs);

	// if (myArgs.hostIP) {
	// 	stream.connectServers({
	// 		hostIP: myArgs.hostIP,
	// 		hostPort: myArgs.hostPort,
	// 		videoIP: myArgs.videoIP,
	// 		videoPort: myArgs.videoPort,
	// 		streamKey: myArgs.streamKey,
	// 	});

	// 	stream.run();
	// } else {
	// 	stream.getStreamInfo({
	// 		accountIP: myArgs.accountIP,
	// 		accountPort: myArgs.accountPort,
	// 		streamKey: myArgs.streamKey,
	// 	});
	// }
}
