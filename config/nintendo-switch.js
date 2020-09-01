let screenSize = robot.getScreenSize();

this.hostConnection.on("controllerState", (data) => {
	if (this.controllerManager) {
		this.controllerManager.sendState(data.cNum, data.btns, data.axes);
	}
});

this.hostConnection.on("keyboardState", (data) => {
	// data.keys will be a list of keys pressed:
	for (let i = 0; i < data.keys.length; i++) {
		data.keys[i] = data.keys[i].replace(/[^0-9a-z;,/\\`'\-=\.\[\]]/gi, "");
	}
	for (let i = 0; i < data.keys.length; i++) {
		let wasPressed = this.pressedKeys.indexOf(data.keys[i]) > -1;
		if (!wasPressed) {
			try {
				robot.keyToggle(data.keys[i], "down");
			} catch (error) {
				console.log(`invalid key (down): ${data.keys[i]}`);
			}
			this.pressedKeys.push(data.keys[i]);
		}
	}
	for (let i = 0; i < this.pressedKeys.length; i++) {
		let isStillPressed = data.keys.indexOf(this.pressedKeys[i]) > -1;
		if (!isStillPressed) {
			// unpress keys that are no longer held:
			try {
				robot.keyToggle(this.pressedKeys[i], "up");
			} catch (error) {
				console.log(`invalid key (up): ${data.keys[i]}`);
			}
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
	if (this.settings.capture === "desktop") {
		x = Math.round((data.x + this.settings.offsetX) * this.settings.width);
		y = Math.round((data.y + this.settings.offsetY) * this.settings.height);
	}

	robot.moveMouse(x, y);
	robot.scrollMouse(0, data.dScroll);
});

let switchGames = {
	hat: { pos: 0, name: "A Hat in Time" },
	// "arms":			{ "pos": 0, "name": "Arms" },
	baba: { pos: 1, name: "Baba Is You" },
	// "brawlhalla":	{ "pos": 2, "name": "Brawlhalla" },
	castle: { pos: 2, name: "Castle Crashers Remastered" },
	celeste: { pos: 3, name: "Celeste" },
	deltarune: { pos: 4, name: "DELTARUNE Chapter 1" },
	// "fortnite":		{ "pos": 6, "name": "Fortnite" },
	hollow: { pos: 5, name: "Hollow Knight" },
	// "human":		{ "pos": 8, "name": "Human: Fall Flat" },
	katamari: { pos: 6, name: "Katamari Damacy REROLL" },
	kirby: { pos: 7, name: "Kirby Star Allies" },
	lm3: { pos: 8, name: "Luigi's Mansion 3" },
	mk8: { pos: 9, name: "Mario Kart 8 Deluxe" },
	mta: { pos: 10, name: "Mario Tennis Aces" },
	nsmbud: { pos: 11, name: "New Super Mario Bros. U Deluxe" },
	nes: { pos: 12, name: "Nintendo Entertainment System - Nintendo Switch Online" },
	// "paladins":		{ "pos": 15, "name": "Paladins" },
	sword: { pos: 13, name: "Pokemon Sword" },
	rocketleague: { pos: 14, name: "Rocket League" },
	shovelknight: { pos: 15, name: "Shovel Knight: Treasure Trove" },
	snipperclips: { pos: 16, name: "Snipperclips" },
	sonic: { pos: 17, name: "Sonic Mania" },
	splatoon2: { pos: 18, name: "Splatoon 2" },
	smm2: { pos: 19, name: "SUPER MARIO MAKER 2" },
	smo: { pos: 20, name: "SUPER MARIO ODYSSEY" },
	snes: { pos: 21, name: "Super Nintendo Entertainment System - Nintendo Switch Online" },
	smash: { pos: 22, name: "Super Smash Bros. Ultimate" },
	tetris: { pos: 23, name: "TETRIS 99" },
	// "skyrim":		{ "pos": 23, "name": "The Elder Scrolls V: Skyrim" },
	jackbox3: { pos: 24, name: "The Jackbox Party Pack 3" },
	jackbox4: { pos: 25, name: "The Jackbox Party Pack 4" },
	jackbox5: { pos: 26, name: "The Jackbox Party Pack 5" },
	botw: { pos: 27, name: "The Legend of Zelda: Breath of the Wild" },
	link: { pos: 28, name: "The Legend of Zelda: Link's Awakening" },
	undertale: { pos: 29, name: "Undertale" },
	goose: { pos: 30, name: "Untitled Goose Game" },
	// "wizard":		{ "pos": 31, "name": "Wizard of Legend" },
};

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
