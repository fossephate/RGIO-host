import socketio from "socket.io-client";
import { ControllerManager/*, KeyboardMouseManager*/ } from "./ControlManagers.js";
import robot from "robotjs";
window.robot = robot;

export default class HostControl {
	constructor(host, port, streamKey, options) {
		this.host = host;
		this.port = port;
		this.streamKey = streamKey;

		this.socket = null;
		this.timer = null;
		this.options = options;
		this.pressedKeys = [];
		this.prevMouseBtns = { left: 0, right: 0, middle: 0 };
	}

	init = () => {
		this.socket = socketio(`https://${this.host}`, {
			path: `/${this.port}/socket.io`,
			reconnect: true,
		});

		this.socket.on("connect", () => {
			this.socket.emit("hostAuthenticate", {
				streamKey: this.streamKey,
			});
		});
		this.timer = setInterval(() => {
			this.socket.emit("hostAuthenticate", {
				streamKey: this.streamKey,
			});
		}, 10000);

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
		if (this.socket) {
			this.socket.close();
		}
		clearInterval(this.timer);

		this.controllerManager.destroy();
	};

	run = (customControl) => {
		eval(customControl);
	};
}

window.HostControl = HostControl;
