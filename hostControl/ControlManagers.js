import SwitchController from "./SwitchController.js";

const { spawn } = require("child_process");
const app = require("electron").remote.app;

export class ControllerManager {
	constructor(controllerCount) {
		this.controllerCount = controllerCount;
		this.p = null;
		this.switchControllers = [];

		this.switchMode = false;
	}

	init = () => {
		if (this.switchMode) {
			// switch:
			for (let i = 0; i < 8; i++) {
				let controller = new SwitchController();
				// let controller = {};
				controller.connect(`COM${i + 1}`);
				setTimeout(() => {
					if (controller.synced) {
						this.switchControllers.push(controller);
					} else {
						controller.closeConnection();
					}
				}, 1000);
			}

			setTimeout(() => {
				for (let i = 0; i < this.switchControllers.length; i++) {
					console.log(`controller: ${i} synced!`);
					this.switchControllers[i].cNum = i;
				}
			}, 3000);
		} else {
			// xbox controllers:
			// let path = "controller\\controller.exe";
			let path = app.getAppPath() + "\\hostControl\\controller\\controller.exe";
			this.p = spawn(path, [this.controllerCount]);
			this.p.stdin.setEncoding("utf-8");
			// this.p.stdout.pipe(process.stdout);
		}
	};

	destroy = () => {
		if (this.switchMode) {
			for (let i = 0; i < this.switchControllers.length; i++) {
				this.switchControllers[i].closeConnection();
			}
		} else {
			if (this.p) {
				this.p.stdin.end();
				this.p.kill();
				this.p = null;
			}
		}
	};

	sendState = (cNum, btns, LX, LY, RX, RY, LT, RT) => {
		if (!this.switchMode) {
			if (!this.p) {
				return;
			}
			let data = `${cNum} ${btns} ${LX} ${LY} ${RX} ${RY} ${LT} ${RT}\n`;
			this.p.stdin.write(data);
		} else {
			if (!this.switchControllers[cNum]) {
				console.log("controller not available!");
				return;
			}
			
			this.switchControllers[cNum].axes[0] = LX;
			this.switchControllers[cNum].axes[1] = LY;
			this.switchControllers[cNum].axes[2] = RX;
			this.switchControllers[cNum].axes[3] = RY;
			this.switchControllers[cNum].setPacked(btns);
			this.switchControllers[cNum].send();
		}
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
