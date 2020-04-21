let screenSize = robot.getScreenSize();

this.hostConnection.on("controllerState", (data) => {
	if (this.controllerManager) {
		this.controllerManager.sendState(data.cNum, data.btns, data.axes);
	}
});

this.hostConnection.on("keyboardState", (data) => {
	// data.keys will be a list of keys pressed:
	for (let i = 0; i < data.keys.length; i++) {
		data.keys[i] = data.keys[i].replace(/[^0-9a-z;,/\\`\-=\.\[\]]/gi, "");
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

this.hostConnection.on("mouseState", (data) => {
	for (let which in this.prevMouseBtns) {
		if (this.prevMouseBtns[which] != data.btns[which]) {
			robot.mouseToggle(data.btns[which] ? "down" : "up", which);
			this.prevMouseBtns[which] = data.btns[which];
		}
	}
	let x, y;
	if (this.streamSettings.capture === "desktop") {
		x = Math.round((data.x + this.streamSettings.offsetX) * this.streamSettings.width);
		y = Math.round((data.y + this.streamSettings.offsetY) * this.streamSettings.height);
	}

	robot.moveMouse(x, y);
	robot.scrollMouse(0, data.dScroll);
});

this.hostConnection.on("chatMessage", (msgObj) => {
	// console.log(msgObj);
	// ignore replayed messages:
	if (msgObj.isReplay) {
		return;
	}
	if (msgObj.text === "!test") {
		this.hostConnection.emit("botMessage", { text: "reply!" });
	}
});
