import socketio from "socket.io-client";
import { ControllerManager, KeyboardMouseManager } from "./controlManager.js";

export default class HostControl {
	constructor(host, port, streamKey, options) {
		this.host = host;
		this.port = port;
		this.streamKey = streamKey;

		this.socket = null;
		this.timer = null;
		this.options = options;
		this.pressedKeys = [];
	}

	init() {
		this.socket = socketio(`https://${this.host}`, {
			path: `/${this.port}/socket.io`,
			reconnect: true,
		});

		this.socket.on("connect", () => {
			this.socket.emit("joinSecure", {
				room: "hostController",
				password: this.streamKey,
			});
		});
		this.timer = setInterval(() => {
			this.socket.emit("joinSecure", {
				room: "hostController",
				password: this.streamKey,
			});
		}, 10000);

		this.controllerManager = new ControllerManager(this.options.controllerCount);
		if (this.options.controllerCount > 0) {
			this.controllerManager = new ControllerManager(this.options.controllerCount);
			this.controllerManager.init();
		}

		if (this.options.keyboardEnabled || this.options.mouseEnabled) {
			this.keyboardMouseManager = new KeyboardMouseManager(
				this.options.keyboardEnabled,
				this.options.mouseEnabled,
			);
		}

		// set keyboard delay to 0ms:
		// robot.setKeyboardDelay(0);
	}

	deinit() {
		if (this.socket) {
			this.socket.close();
		}
		clearInterval(this.timer);

		if (this.options.controllerCount > 0) {
			this.controllerManager.deinit();
		}
	}

	run(customControl) {
		eval(customControl);
	}
}

window.HostControl = HostControl;
