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

let switchGames = [
	{
	  name: "A Hat in Time",
	  short: "hat"
	},
	{
	  name: "Animal Crossing: New Horizons",
	  short: "acnh"
	},
	{
	  name: "Arms",
	  short: "arms"
	},
	{
	  name: "Baba Is You",
	  short: "baba"
	},
	// "Brawlhalla",
	{
	  name: "Castle Crashers Remastered",
	  short: "castle"
	},
	{
	  name: "Celeste",
	  short: "celeste"
	},
	{
	  name: "DELTARUNE Chapter 1&2",
	  short: "deltarune"
	},
	{
	  name: "Fortnite",
	  short: "fortnite"
	},
	{
	  name: "Hollow Knight",
	  short: "hollow"
	},
	// "Human: Fall Flat",
	{
	  name: "Katamari Damacy REROLL",
	  short: "katamari"
	},
	{
	  name: "Kirby and the Forgotten Land",
	  short: "kirby2"
	},
	{
	  name: "Kirby Star Allies",
	  short: "kirby"
	},
	{
	  name: "Luigi's Mansion 3",
	  short: "lm3"
	},
	{
	  name: "Mario Kart 8 Deluxe",
	  short: "mk8"
	},
	{
	  name: "Mario Tennis Aces",
	  short: "mta"
	},
	{
	  name: "New Super Mario Bros. U Deluxe",
	  short: "nsmbud"
	},
	{
		name: "Nickelodeon Kart Racers",
		short: "nick"
	  },
	{
	  name: "Nintendo 64 - Nintendo Switch Online",
	  short: "n64"
	},
	{
	  name: "Nintendo Entertainment System - Nintendo Switch Online",
	  short: "nes"
	},
	{
	  name: "Persona 5 Royal",
	  short: "p5"
	},
	// "Paladins",
	{
	  name: "Pokemon Sword",
	  short: "sword"
	},
	{
	  name: "Rocket League",
	  short: "rocketleague"
	},
	{
	  name: "Shovel Knight: Treasure Trove",
	  short: "shovelknight"
	},
	{
	  name: "Snipperclips",
	  short: "snipperclips"
	},
	{
	  name: "Sonic Mania",
	  short: "sonic"
	},
	{
	  name: "Splatoon 2",
	  short: "splatoon2"
	},
	// "Splatoon 3",
	{
	  name: "SUPER MARIO MAKER 2",
	  short: "smm2"
	},
	{
	  name: "SUPER MARIO ODYSSEY",
	  short: "smo"
	},
	{
	  name: "Super Nintendo Entertainment System - Nintendo Switch Online",
	  short: "snes"
	},
	{
	  name: "Super Smash Bros. Ultimate",
	  short: "smash"
	},
	{
	  name: "TETRIS 99",
	  short: "tetris"
	},
	{
	  name: "The Elder Scrolls V: Skyrim",
	  short: "skyrim"
	},
	{
	  name: "The Jackbox Party Pack 3",
	  short: "jackbox3"
	},
	{
	  name: "The Jackbox Party Pack 4",
	  short: "jackbox4"
	},
	{
	  name: "The Jackbox Party Pack 5",
	  short: "jackbox5"
	},
	{
	  name: "The Legend of Zelda: Breath of the Wild",
	  short: "botw"
	},
	{
	  name: "The Legend of Zelda: Link's Awakening",
	  short: "link"
	},
	{
	  name: "Undertale",
	  short: "undertale"
	},
	{
	  name: "Untitled Goose Game",
	  short: "goose"
	},
	// "Wizard of Legend",
  ];


function end_switch_goto_vote(gameIndex, delay) {

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
		goto_switch_game(gameIndex, delay)
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

async function goto_switch_game(controllers, gameIndex) {
	// disable controls while we do this:
	controllersEnabled = false;
	// self.chatEnabled = false;

	let gameObj = switchGames[gameIndex];

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

	if (controller == undefined) {
		console.log("controller was null!");
		return;
	}

	// get to game selection screen:
	controller.home = 1
	await send_then_reset(controller, 100);
	
	await sleep(2000);
	controller.axes[0] = -1;
	await send_then_reset(controller, 100);
	controller.a = 1
	await send_then_reset(controller, 100);

	await sleep(2000);

	let index = gameIndex;
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


	if (text === "!test") {
		this.hostConnection.emit("botMessage", { text: "reply!" });
		// goto_switch_game(this.controllerManager.controllers, switchGames["goose"]);
	}

	reg = /^!goto ([A-Za-z0-9]+)$/;
	results = reg.exec(text);
	if (results) {
		// handle_goto(results[2]);
		// index where short
		let index = switchGames.findIndex(x => x.short === results[1]);
		if (index > -1) {
			goto_switch_game(this.controllerManager.controllers, index);
		}
	}

	reg = /^!help$/;
	results = reg.exec(text);
	if (results) {
		this.hostConnection.emit("botMessage", { text: "use !games for the list of games! !goto <game> to switch games" });
	}


	reg = /^!games$/;
	results = reg.exec(text);
	if (results) {
		let gamesList = [];
		for (let gameShort in switchGames) {
			gamesList.push(`${gameShort}: ${switchGames[gameShort].name}`);
		}
		this.hostConnection.emit("botMessage", { text: gamesList.join(", ") });
	}



});
