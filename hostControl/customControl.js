let screenSize = robot.getScreenSize();
// let pressedKeys = [];
// let prevMouseBtns = { left: 0, right: 0, middle: 0 };

this.socket.on("controllerState", (data) => {
	// let cNum = data["cNum"];
	// let btns = data["btns"];
	// let LX = data["axes"][0];
	// let LY = data["axes"][1];
	// let RX = data["axes"][2];
	// let RY = data["axes"][3];
	// let LT = data["axes"][4];
	// let RT = data["axes"][5];
	// this.controllerManager.sendState(cNum, btns, LX, LY, RX, RY, LT, RT);

	this.controllerManager.sendState(
		data.cNum,
		data.btns,
		data.axes[0],
		data.axes[1],
		data.axes[2],
		data.axes[3],
		data.axes[4],
		data.axes[5],
	);
});

this.socket.on("keyboardState", (data) => {
	// data.keys will be a list of keys pressed:
	for (let i = 0; i < data.keys; i++) {
		data.keys[i] = data.keys[i].replace(/[^0-9a-z]/gi, "");
	}
	for (let i = 0; i < data.keys.length; i++) {
		let wasPressed = this.pressedKeys.indexOf(data.keys[i]) > -1;
		if (!wasPressed) {
			robot.keyToggle(data.keys[i], "down");
			this.pressedKeys.push(data.keys[i]);
		}
	}
	for (let i = 0; i < this.pressedKeys.length; i++) {
		let isStillPressed = data.keys.indexOf(this.pressedKeys[i]) > -1;
		if (!isStillPressed) {
			// unpress keys that are no longer held:
			robot.keyToggle(this.pressedKeys[i], "up");
			this.pressedKeys.splice(i, 1);
		}
	}
});

this.socket.on("mouseState", (data) => {
	for (let which in this.prevMouseBtns) {
		if (this.prevMouseBtns[which] != data.btns[which]) {
			robot.mouseToggle(data.btns[which] ? "down" : "up", which);
			this.prevMouseBtns[which] = data.btns[which];
		}
	}
	let x = Math.round((data.x / 1280) * screenSize.width);
	let y = Math.round((data.y / 720) * screenSize.height);
	robot.moveMouse(x, y);
});

this.socket.on("chatMessage", (msgObj) => {
	console.log(msgObj);
	// ignore replayed messages:
	if (msgObj.isReplay) {
		return;
	}
	if (msgObj.text == "!test") {
		this.socket.emit("botMessage", { text: "reply!" });
	}
});

this.socket.on("chatMessage", (msgObj) => {
	// ignore replayed messages:
	if (msgObj.isReplay) {
		return;
	}
	if (msgObj.text == "!test") {
		this.socket.emit("botMessage", "reply!");
	}
});
