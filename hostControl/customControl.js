this.socket.on("controllerState", (data) => {
	let cNum = data["cNum"];
	let btns = data["btns"];
	let LX = data["axes"][0];
	let LY = data["axes"][1];
	let RX = data["axes"][2];
	let RY = data["axes"][3];
	let LT = data["axes"][4];
	let RT = data["axes"][5];

	this.controllerManager.sendState(cNum, btns, LX, LY, RX, RY, LT, RT);
});

let keysPressed = [];

this.socket.on("keyboardState", (data) => {
	// data.keys will be a list of keys pressed:
	// console.log(data.keys);
	// for (let i = 0; i < data.keys; i++) {
	// 	data.keys[i] = data.keys[i].replace(/[^0-9a-z]/gi, "");
	// }
	// for (let i = 0; i < data.keys.length; i++) {
	// 	let wasPressed = keysPressed.indexOf(data.keys[i]) > -1;
	// 	if (!wasPressed) {
	// 		robot.keyToggle(data.keys[i], "down");
	// 		keysPressed.push(data.keys[i]);
	// 	}
	// }
	// for (let i = 0; i < keysPressed.length; i++) {
	// 	let isStillPressed = data.keys.indexOf(keysPressed[i]) > -1;
	// 	if (!isStillPressed) {
	// 		// unpress keys that are no longer held:
	// 		robot.keyToggle(keysPressed[i], "up");
	// 		keysPressed.splice(i, 1);
	// 	}
	// }
});

this.socket.on("mouseState", (data) => {
	// data.coords will be an array [x, y] (rel)
	// data.state will be
	// alert(data);

	console.log(data);
});

this.socket.on("chatMessage", (msgObj) => {
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
		this.socket.emit("botMessage", { text: "reply!" });
	}
});
