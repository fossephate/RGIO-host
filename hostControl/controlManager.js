const { spawn } = require("child_process");
const app = require("electron").remote.app;

export class ControllerManager {
	constructor(controllerCount) {
		this.controllerCount = controllerCount;
		this.p = null;
	}

	init() {
		// let path = "controller\\controller.exe";
		let path = app.getAppPath() + "\\hostControl\\controller\\controller.exe";
		this.p = spawn(path, [this.controllerCount]);
		this.p.stdin.setEncoding("utf-8");
		// this.p.stdout.pipe(process.stdout);
	}

	deinit() {
		if (this.p) {
			this.p.stdin.end();
			this.p.kill();
			this.p = null;
		}
	}

	sendState(cNum, btns, LX, LY, RX, RY, LT, RT) {
		if (!this.p) {
			return;
		}
		let data = `${cNum} ${btns} ${LX} ${LY} ${RX} ${RY} ${LT} ${RT}\n`;
		this.p.stdin.write(data);
	}
}

export class KeyboardMouseManager {
	constructor(keyboardEnabled, mouseEnabled) {
		this.keyboardEnabled = keyboardEnabled;
		this.mouseEnabled = mouseEnabled;
		this.p = null;
	}

	init() {
		// let path = "controller\\controller.exe";
		let path = app.getAppPath() + "\\hostControl\\controller\\Utils.exe";
		this.p = spawn(path);
		this.p.stdin.setEncoding("utf-8");
		// this.p.stdout.pipe(process.stdout);
	}

	deinit() {
		if (this.p) {
			this.p.stdin.end();
			this.p.kill();
			this.p = null;
		}
	}

	sendMouseState(x, y) {
		if (!this.p) {
			return;
		}
		let data = `${x} ${y}\n`;
		this.p.stdin.write(data);
	}
}
