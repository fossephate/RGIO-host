import socketio from "socket.io-client";
import { XboxControllerManager, SwitchControllerManager/*, KeyboardMouseManager*/ } from "./ControlManagers.mjs";
import robot from "robotjs";
// window.robot = robot;

export default class HostControl {
	constructor(hostConnection, options) {
		this.streamKey = null;
		this.hostConnection = hostConnection || null;

		this.controllerManager = null;
		this.authHostTimer = null;
		this.options = options;
		
		this.streamSettings = options.streamSettings;
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


		if (this.options.controllerCount > 0) {
		
			if (this.options.controlSwitch) {
				this.controllerManager = new SwitchControllerManager(this.options.controllerCount);
			} else if (this.options.virtualXboxControllers) {
				this.controllerManager = new XboxControllerManager(this.options.controllerCount);
			}
			
			if (this.options.controlSwitch || this.options.virtualXboxControllers) {
				this.controllerManager.init();
			}
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
