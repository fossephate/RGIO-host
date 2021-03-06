import socketio from "socket.io-client";
import {
	XboxControllerManager,
	SwitchControllerManager /*, KeyboardMouseManager*/,
} from "./ControlManagers.mjs";
import robot from "robotjs";
try {
	window.robot = robot;
} catch (error) {
	console.log(error);
}

export default class HostControl {
	constructor(hostConnection, options) {
		this.streamKey = null;
		this.hostConnection = hostConnection || null;

		this.controllerManager = null;
		this.authHostTimer = null;
		this.settings = options;

		this.pressedKeys = [];
		this.prevMouseBtns = { left: 0, right: 0, middle: 0 };
		this.prevMousePos = { x: 0, y: 0 };
	}

	setupAuthentication = (streamKey) => {
		this.hostConnection.on("connect", () => {
			this.hostConnection.emit("hostAuthenticate", {
				streamKey: streamKey,
			});
		});

		clearInterval(this.authHostTimer);
		this.authHostTimer = setInterval(() => {
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

		if (options.streamKey) {
			this.setupAuthentication(options.streamKey);
		}
	};

	init = () => {
		if (this.settings.switchControllerCount > 0) {
			this.controllerManager = new SwitchControllerManager(
				this.settings.switchControllerCount,
				this.settings.serialPortLocation,
				this.settings.serialPortNumbers,
			);
		} else if (this.settings.virtualXboxControllerCount > 0) {
			this.controllerManager = new XboxControllerManager(
				this.settings.virtualXboxControllerCount,
			);
		}

		if (
			this.settings.switchControllerCount > 0 ||
			this.settings.virtualXboxControllerCount > 0
		) {
			this.controllerManager.init();
		}

		if (this.settings.keyboardEnabled || this.settings.mouseEnabled) {
			// set delay to 0ms:
			robot.setKeyboardDelay(0);
			robot.setMouseDelay(0);
		}
	};

	destroy = () => {
		if (this.hostConnection) {
			this.hostConnection.removeAllListeners();
			this.hostConnection.destroy();
			this.hostConnection = null;
		}
		clearInterval(this.authHostTimer);

		if (this.controllerManager) {
			this.controllerManager.destroy();
		}
	};

	stop = () => {
		this.destroy();
	};

	start = (customControl) => {
		this.init();
		eval(customControl);
		// eval.call(window,'(function (element) {'+src+'})')(element);
	};
}
