import socketio from "socket.io-client";
import { ControllerManager/*, KeyboardMouseManager*/ } from "./ControlManagers.js";
import robot from "robotjs";
window.robot = robot;

export default class HostControl {
	constructor(hostConnection, options) {
		this.streamKey = streamKey;
		this.hostConnection = hostConnection || null;

		this.timer = null;
		this.options = options;
		this.pressedKeys = [];
		this.prevMouseBtns = { left: 0, right: 0, middle: 0 };
	}

	setupAuthentiction = (streamKey) => {

		this.hostConnection.on("connect", () => {
			this.hostConnection.emit("hostAuthenticate", {
				streamKey: streamKey,
			});
		});

		clearInterval(this.timer);
		this.timer = setInterval(() => {
			this.hostConnection.emit("hostAuthenticate", {
				streamKey: streamKey,
			});
		}, 10000);
	};

	connectServers = (options) => {
		this.hostConnection = socketio(`https://${options.hostIP}`, {
			path: `/${options.hostPort}/socket.io`,
			reconnect: true,
		});

		// console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
		// console.log(
		// 	`${options.hostIP}:${options.hostPort}`,
		// );
		// console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");

		this.setupAuthentication(options.streamKey);
	};

	init = () => {

		this.controllerManager = new ControllerManager(this.options.controllerCount);
		if (this.options.controlSwitch) {
			this.controllerManager.switchMode = true;
		}
		if (this.options.controllerCount > 0) {
			this.controllerManager.init();
		}

		if (this.options.keyboardEnabled || this.options.mouseEnabled) {
			// set delay to 0ms:
			robot.setKeyboardDelay(0);
			robot.setMouseDelay(0);
		}
	}

	destroy = () => {
		if (this.hostConnection) {
			this.hostConnection.removeAllListeners();
			this.hostConnection.destroy();
			this.hostConnection = null;
		}
		clearInterval(this.timer);

		this.controllerManager.destroy();
	};

	run = (customControl) => {
		eval(customControl);
	};
}

window.HostControl = HostControl;
