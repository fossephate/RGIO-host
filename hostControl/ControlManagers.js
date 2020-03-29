import SwitchController from "./SwitchController.js";

const { spawn } = require("child_process");
const app = require("electron").remote.app;

export class XboxControllerManager {
	constructor(controllerCount) {
		this.controllerCount = controllerCount;
		this.p = null;
	}

	init = () => {
		// xbox controllers:
		// let path = "controller\\controller.exe";
		let path = app.getAppPath() + "\\hostControl\\controller\\controller.exe";
		this.p = spawn(path, [this.controllerCount]);
		this.p.stdin.setEncoding("utf-8");
		// this.p.stdout.pipe(process.stdout);
	};

	destroy = () => {
		if (this.p) {
			this.p.stdin.end();
			this.p.kill();
			this.p = null;
		}
	};

	sendState = (cNum, btns, LX, LY, RX, RY, LT, RT) => {
		if (!this.p) {
			return;
		}
		let data = `${cNum} ${btns} ${LX} ${LY} ${RX} ${RY} ${LT} ${RT}\n`;
		this.p.stdin.write(data);
	};
}

export class SwitchControllerManager {
	constructor(controllerCount) {
		this.controllerCount = controllerCount;
		this.controllers = [];
	}

	init = () => {
		for (let i = 0; i < 8; i++) {
			let controller = new SwitchController();
			// let controller = {};
			controller.connect(`COM${i + 1}`);
			setTimeout(() => {
				if (controller.synced) {
					this.controllers.push(controller);
				} else {
					controller.closeConnection();
				}
			}, 1000);
		}

		setTimeout(() => {
			for (let i = 0; i < this.controllers.length; i++) {
				console.log(`controller: ${i} synced!`);
				this.controllers[i].cNum = i;
			}
		}, 3000);
	};

	destroy = () => {
		for (let i = 0; i < this.controllers.length; i++) {
			this.controllers[i].closeConnection();
		}
	};

	sendState = (cNum, btns, LX, LY, RX, RY) => {
		if (!this.controllers[cNum]) {
			console.log("controller not available!");
			return;
		}

		this.controllers[cNum].axes[0] = LX;
		this.controllers[cNum].axes[1] = LY;
		this.controllers[cNum].axes[2] = RX;
		this.controllers[cNum].axes[3] = RY;
		this.controllers[cNum].setPacked(btns);
		this.controllers[cNum].send();
	};
}

export class KeyboardMouseManager {
	constructor(keyboardEnabled, mouseEnabled) {
		this.keyboardEnabled = keyboardEnabled;
		this.mouseEnabled = mouseEnabled;
		this.p = null;
	}

	init = () => {
		// let path = "controller\\controller.exe";
		let path = app.getAppPath() + "\\hostControl\\controller\\Utils.exe";
		this.p = spawn(path);
		this.p.stdin.setEncoding("utf-8");
		// this.p.stdout.pipe(process.stdout);
	};

	destroy = () => {
		if (this.p) {
			this.p.stdin.end();
			this.p.kill();
			this.p = null;
		}
	};

	sendMouseState = (x, y) => {
		if (!this.p) {
			return;
		}
		let data = `${x} ${y}\n`;
		this.p.stdin.write(data);
	};
}
