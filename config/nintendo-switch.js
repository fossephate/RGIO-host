let screenSize = robot.getScreenSize();
let controllersEnabled = true;
let currentSwitchGame = "";
let voting = false;

this.hostConnection.on("controllerState", (data) => {
	if (this.controllerManager && controllersEnabled) {
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
	acnh: {pos: 1, name: "Animal Crossing: New Horizons"},
	// "arms":			{ "pos": 0, "name": "Arms" },
	baba: { pos: 2, name: "Baba Is You" },
	// "brawlhalla":	{ "pos": 2, "name": "Brawlhalla" },
	castle: { pos: 3, name: "Castle Crashers Remastered" },
	celeste: { pos: 4, name: "Celeste" },
	deltarune: { pos: 5, name: "DELTARUNE Chapter 1" },
	// "fortnite":		{ "pos": 6, "name": "Fortnite" },
	hollow: { pos: 6, name: "Hollow Knight" },
	// "human":		{ "pos": 8, "name": "Human: Fall Flat" },
	katamari: { pos: 7, name: "Katamari Damacy REROLL" },
	kirby: { pos: 8, name: "Kirby Star Allies" },
	lm3: { pos: 9, name: "Luigi's Mansion 3" },
	mk8: { pos: 10, name: "Mario Kart 8 Deluxe" },
	mta: { pos: 11, name: "Mario Tennis Aces" },
	nsmbud: { pos: 12, name: "New Super Mario Bros. U Deluxe" },
	nes: { pos: 13, name: "Nintendo Entertainment System - Nintendo Switch Online" },
	// "paladins":		{ "pos": 15, "name": "Paladins" },
	sword: { pos: 14, name: "Pokemon Sword" },
	rocketleague: { pos: 15, name: "Rocket League" },
	shovelknight: { pos: 16, name: "Shovel Knight: Treasure Trove" },
	snipperclips: { pos: 17, name: "Snipperclips" },
	sonic: { pos: 18, name: "Sonic Mania" },
	splatoon2: { pos: 19, name: "Splatoon 2" },
	smm2: { pos: 20, name: "SUPER MARIO MAKER 2" },
	smo: { pos: 21, name: "SUPER MARIO ODYSSEY" },
	snes: { pos: 22, name: "Super Nintendo Entertainment System - Nintendo Switch Online" },
	smash: { pos: 23, name: "Super Smash Bros. Ultimate" },
	tetris: { pos: 24, name: "TETRIS 99" },
	// "skyrim":		{ "pos": 23, "name": "The Elder Scrolls V: Skyrim" },
	jackbox3: { pos: 25, name: "The Jackbox Party Pack 3" },
	jackbox4: { pos: 26, name: "The Jackbox Party Pack 4" },
	jackbox5: { pos: 27, name: "The Jackbox Party Pack 5" },
	botw: { pos: 28, name: "The Legend of Zelda: Breath of the Wild" },
	link: { pos: 29, name: "The Legend of Zelda: Link's Awakening" },
	undertale: { pos: 30, name: "Undertale" },
	goose: { pos: 31, name: "Untitled Goose Game" },
	// "wizard":		{ "pos": 31, "name": "Wizard of Legend" },
};


function end_switch_goto_vote(game, delay) {

	let msg = `With ${this.yeaVotes} votes to leave and ${self.nayVotes} to stay`;

	let leaving = false;
	let timeGotoisDisabled = 0;

	if (this.yeaVotes > this.nayVotes) {
		msg = msg + " We will be LEAVING"
		leaving = true;
		timeGotoisDisabled = 10 * 60 * 1000// 10 minutes
	} else {
		msg = msg + " We will be STAYING";
		timeGotoisDisabled = 4 * 60 * 1000;// 4 minutes
	}

	gotoUsed = true;
	setTimeout(() => {
		gotoUsed = false;
	}, timeGotoisDisabled);
	// gotoTimer = Timer(timeGotoisDisabled, self.reenable_goto)
	// gotoTimer.start()

	this.hostConnection.emit("botMessage", { text: msg});

	voting = false;

	// del voted[:]

	if (leaving) {
		goto_switch_game(game, delay)
	}
}

function sleep(ms) {
	return new Promise((resolve) => {
	  setTimeout(resolve, ms);
	});
}

function execute_sequence(list) {
	let running_total = 0;


	for (let i = 0; i < list.length; i++) {

	}
}

function reset_and_send(controller) {
	controller.reset();
	controller.send();
}

async function send_then_reset(controller, delay) {
	controller.setBtns();
	controller.send();
	await sleep(delay);
	controller.reset();
	controller.send();
}

async function goto_switch_game(controllers, gameObj) {
	// disable controls while we do this:
	controllersEnabled = false;
	// self.chatEnabled = false;

	// update current game:
	currentSwitchGame = gameObj.name;

	// reset controllers
	for (let i = 0; i < controllers.length; i++) {
		controllers[i].reset()
		// send in thread to prevent main thread from crashing when the hardware fails:
		// sendThread = Thread(target=send_and_reset, args=(0.1, 1, i))
		// sendThread.start()
		// destroyThread = Thread(target=thread_destroyer, args=(sendThread, 0.1))
		// destroyThread.start()
	}

	let controller = controllers[0];

	// get to game selection screen:
	controller.home = 1
	await send_then_reset(controller, 100);
	
	await sleep(2000);
	controller.axes[0] = -1;
	await send_then_reset(controller, 100);
	controller.a = 1
	await send_then_reset(controller, 100);

	await sleep(2000);

	let index = gameObj.pos;
	let timesToMoveDown = parseInt(index / 6);
	let timesToMoveRight = (index % 6);
	// console.log(index, timesToMoveDown, timesToMoveRight)
	let waitTime = 500;
	// navigate to game
	for (let i = 0; i < timesToMoveRight; i++) {
		controller.axes[0] = 1;
		await send_then_reset(controller, 100);
		await sleep(waitTime);
	}
	for (let i = 0; i < timesToMoveDown; i++) {
		controller.axes[1] = -1;
		await send_then_reset(controller, 100);
		await sleep(waitTime);
	}

	// sleep(0.5)


	// select left most profile:
	controller.a = 1
	await send_then_reset(controller, 100);
	await sleep(1000);
	controller.a = 1
	await send_then_reset(controller, 100);
	await sleep(3000);
	controller.axes[0] = -1;
	await send_then_reset(controller, 500);

	// # mash a:
	for (let i = 0; i < 15; i++) {
		controller.a = 1
		await send_then_reset(controller, 100);
		await sleep(1000);
	}

	controllersEnabled = true;
}

function handle_goto(gameShorthand) {

	if (switchGames[results[2]]) {
			
	} else {
		this.hostConnection.emit("botMessage", { text: "game not recognized"});
	}

	

}

this.hostConnection.on("chatMessage", (msgObj) => {
	// console.log(msgObj);
	// ignore replayed messages:
	if (msgObj.isReplay) {
		return;
	}

	let text = msgObj.text;
	let reg;
	let results;


	// if (text === "!test") {
	// 	this.hostConnection.emit("botMessage", { text: "reply!" });
	// 	goto_switch_game(this.controllerManager.controllers, switchGames["goose"]);
	// }

	reg = /^!goto ([A-Za-z0-9]+)$/;
	results = reg.exec(text);
	if (results) {
		// handle_goto(results[2]);
		if (switchGames[results[1]]) {
			goto_switch_game(this.controllerManager.controllers, switchGames[results[1]]);
		}
	}



});
