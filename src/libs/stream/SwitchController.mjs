//!/usr/bin/env python3
// import argparse
// import serial
// import select
// import struct
// import sys
// import time
// import math

// let now = require("performance-now");
// const SerialPort = require("serialport");
// import now from "performance-now";
import SerialPort from "serialport";

const STATE_OUT_OF_SYNC = 0;
const STATE_SYNC_START = 1;
const STATE_SYNC_1 = 2;
const STATE_SYNC_2 = 3;
const STATE_SYNC_OK = 4;

// Actual Switch DPAD Values
const A_DPAD_CENTER = 0x08;
const A_DPAD_U = 0x00;
const A_DPAD_U_R = 0x01;
const A_DPAD_R = 0x02;
const A_DPAD_D_R = 0x03;
const A_DPAD_D = 0x04;
const A_DPAD_D_L = 0x05;
const A_DPAD_L = 0x06;
const A_DPAD_U_L = 0x07;

// Enum DIR Values
const DIR_CENTER = 0x00;
const DIR_U = 0x01;
const DIR_R = 0x02;
const DIR_D = 0x04;
const DIR_L = 0x08;
const DIR_U_R = DIR_U + DIR_R;
const DIR_D_R = DIR_D + DIR_R;
const DIR_U_L = DIR_U + DIR_L;
const DIR_D_L = DIR_D + DIR_L;

const BTN_NONE = 0x0000000000000000;
const BTN_Y = 0x0000000000000001;
const BTN_B = 0x0000000000000002;
const BTN_A = 0x0000000000000004;
const BTN_X = 0x0000000000000008;
const BTN_L = 0x0000000000000010;
const BTN_R = 0x0000000000000020;
const BTN_ZL = 0x0000000000000040;
const BTN_ZR = 0x0000000000000080;
const BTN_MINUS = 0x0000000000000100;
const BTN_PLUS = 0x0000000000000200;
const BTN_LCLICK = 0x0000000000000400;
const BTN_RCLICK = 0x0000000000000800;
const BTN_HOME = 0x0000000000001000;
const BTN_CAPTURE = 0x0000000000002000;

const DPAD_CENTER = 0x0000000000000000;
const DPAD_U = 0x0000000000010000;
const DPAD_R = 0x0000000000020000;
const DPAD_D = 0x0000000000040000;
const DPAD_L = 0x0000000000080000;
const DPAD_U_R = DPAD_U + DPAD_R;
const DPAD_D_R = DPAD_D + DPAD_R;
const DPAD_U_L = DPAD_U + DPAD_L;
const DPAD_D_L = DPAD_D + DPAD_L;

const LSTICK_CENTER = 0x0000000000000000;
const LSTICK_R = 0x00000000ff000000; //   0 (000)
const LSTICK_U_R = 0x0000002dff000000; //  45 (02D)
const LSTICK_U = 0x0000005aff000000; //  90 (05A)
const LSTICK_U_L = 0x00000087ff000000; // 135 (087)
const LSTICK_L = 0x000000b4ff000000; // 180 (0B4)
const LSTICK_D_L = 0x000000e1ff000000; // 225 (0E1)
const LSTICK_D = 0x0000010eff000000; // 270 (10E)
const LSTICK_D_R = 0x0000013bff000000; // 315 (13B)

const RSTICK_CENTER = 0x0000000000000000;
const RSTICK_R = 0x000ff00000000000; //   0 (000)
const RSTICK_U_R = 0x02dff00000000000; //  45 (02D)
const RSTICK_U = 0x05aff00000000000; //  90 (05A)
const RSTICK_U_L = 0x087ff00000000000; // 135 (087)
const RSTICK_L = 0x0b4ff00000000000; // 180 (0B4)
const RSTICK_D_L = 0x0e1ff00000000000; // 225 (0E1)
const RSTICK_D = 0x10eff00000000000; // 270 (10E)
const RSTICK_D_R = 0x13bff00000000000; // 315 (13B)

const NO_INPUT = BTN_NONE + DPAD_CENTER + LSTICK_CENTER + RSTICK_CENTER;

// Commands to send to MCU
const COMMAND_NOP = 0x00;
const COMMAND_SYNC_1 = 0x33;
const COMMAND_SYNC_2 = 0xcc;
const COMMAND_SYNC_START = 0xff;

// Responses from MCU
const RESP_USB_ACK = 0x90;
const RESP_UPDATE_ACK = 0x91;
const RESP_UPDATE_NACK = 0x92;
const RESP_SYNC_START = 0xff;
const RESP_SYNC_1 = 0xcc;
const RESP_SYNC_OK = 0x33;

// -------------------------------------------------------------------------

export default class SwitchController {
	constructor() {
		this.port = null;
		this.ser = null;
		this.buffer = null;
		this.synced = false;
		this.cNum = 0;

		this.btns = 0;
		this.axes = [0, 0, 0, 0];
		this.axs = [128, 128, 128, 128];

		// buttons:
		this.up = 0;
		this.down = 0;
		this.left = 0;
		this.right = 0;
		this.l = 0;
		this.zl = 0;
		this.lstick = 0;
		this.minus = 0;
		this.capture = 0;
		this.a = 0;
		this.b = 0;
		this.x = 0;
		this.y = 0;
		this.r = 0;
		this.zr = 0;
		this.rstick = 0;
		this.plus = 0;
		this.home = 0;

		this.output = "";
	}

	reset = () => {
		this.btns = 0;
		this.axes = [0, 0, 0, 0];
		// buttons:
		this.up = 0;
		this.down = 0;
		this.left = 0;
		this.right = 0;
		this.l = 0;
		this.zl = 0;
		this.lstick = 0;
		this.minus = 0;
		this.capture = 0;
		this.a = 0;
		this.b = 0;
		this.x = 0;
		this.y = 0;
		this.r = 0;
		this.zr = 0;
		this.rstick = 0;
		this.plus = 0;
		this.home = 0;
	}

	setPacked = (btns) => {
		this.btns = 0;
		if (this.is_pressed(btns, 0)) {
			this.up = 1;
			this.btns += DPAD_U;
		}
		if (this.is_pressed(btns, 1)) {
			this.down = 1;
			this.btns += DPAD_D;
		}
		if (this.is_pressed(btns, 2)) {
			this.left = 1;
			this.btns += DPAD_L;
		}
		if (this.is_pressed(btns, 3)) {
			this.right = 1;
			this.btns += DPAD_R;
		}
		if (this.is_pressed(btns, 4)) {
			this.l = 1;
			this.btns += BTN_L;
		}
		if (this.is_pressed(btns, 5)) {
			this.zl = 1;
			this.btns += BTN_ZL;
		}
		if (this.is_pressed(btns, 6)) {
			this.lstick = 1;
			this.btns += BTN_LCLICK;
		}
		if (this.is_pressed(btns, 7)) {
			this.minus = 1;
			this.btns += BTN_MINUS;
		}
		if (this.is_pressed(btns, 8)) {
			this.capture = 1;
			this.btns += BTN_CAPTURE;
		}
		if (this.is_pressed(btns, 9)) {
			this.a = 1;
			this.btns += BTN_A;
		}
		if (this.is_pressed(btns, 10)) {
			this.b = 1;
			this.btns += BTN_B;
		}
		if (this.is_pressed(btns, 11)) {
			this.x = 1;
			this.btns += BTN_X;
		}
		if (this.is_pressed(btns, 12)) {
			this.y = 1;
			this.btns += BTN_Y;
		}
		if (this.is_pressed(btns, 13)) {
			this.r = 1;
			this.btns += BTN_R;
		}
		if (this.is_pressed(btns, 14)) {
			this.zr = 1;
			this.btns += BTN_ZR;
		}
		if (this.is_pressed(btns, 15)) {
			this.rstick = 1;
			this.btns += BTN_RCLICK;
		}
		if (this.is_pressed(btns, 16)) {
			this.plus = 1;
			this.btns += BTN_PLUS;
		}
		if (this.is_pressed(btns, 17)) {
			this.home = 1;
			this.btns += BTN_HOME;
		}

		for (let i = 0; i < 4; i++) {
			if (i == 1 || i == 3) {
				this.axs[i] = Math.round(((-this.axes[i] + 1) / 2) * 255);
			} else {
				this.axs[i] = Math.round(((this.axes[i] + 1) / 2) * 255);
			}
		}
	};

	connect = (port) => {
		try {
			if (this.ser !== null && this.ser.is_open) {
				this.ser.close();
			}
			this.port = port;
			// this.ser = serial.Serial((port = this.port), (baudrate = 19200), (timeout = 1));
			this.ser = new SerialPort(this.port, { baudRate: 19200 });
			this.ser.on("data", this.handleData);
			this.sync();
		} catch (error) {
			console.log(`port: ${error} doesn't exist`);
			return "error";
		}
	}

	setBtns = () => {
		this.btns = 0;
		if (this.up) this.btns += DPAD_U;
		if (this.down) this.btns += DPAD_D;
		if (this.left) this.btns += DPAD_L;
		if (this.right) this.btns += DPAD_R;
		if (this.lstick) this.btns += BTN_LCLICK;
		if (this.l) this.btns += BTN_L;
		if (this.zl) this.btns += BTN_ZL;
		if (this.minus) this.btns += BTN_MINUS;
		if (this.capture) this.btns += BTN_CAPTURE;
		if (this.a) this.btns += BTN_A;
		if (this.b) this.btns += BTN_B;
		if (this.x) this.btns += BTN_X;
		if (this.y) this.btns += BTN_Y;
		if (this.rstick) this.btns += BTN_RCLICK;
		if (this.r) this.btns += BTN_R;
		if (this.zr) this.btns += BTN_ZR;
		if (this.plus) this.btns += BTN_PLUS;
		if (this.home) this.btns += BTN_HOME;
		for (let i = 0; i < 4; i++) {
			let n = 0;
			if (this.axes[i] == 0) {
				n = 128;
			} else if (i == 1 || i == 3) {
				n = Math.round(((-this.axes[i] + 1) / 2) * 255);
			} else {
				n = Math.round(((this.axes[i] + 1) / 2) * 255);
			}
			this.axs[i] = n;
		}
	};

	send = () => {
		let packet = this.cmd_to_packet2(this.btns, this.axs);
		this.send_packet(packet);
	};

	is_pressed = (btns, n) => {
		return (btns & (1 << n)) != 0;
	};

	// Compute x and y based on angle and intensity
	angle = (angle, intensity) => {
		let radians = angle * (Math.PI / 180);
		// y is negative because on the Y input, UP = 0 and DOWN = 255
		let x = parseInt((Math.cos(radians) * 0x7f * intensity) / 0xff) + 0x80;
		let y = -parseInt((Math.sin(radians) * 0x7f * intensity) / 0xff) + 0x80;
		return { x: x, y: y };
	};

	lstick_angle = (angle, intensity) => {
		return (intensity + (angle << 8)) << 24;
	};

	rstick_angle = (angle, intensity) => {
		return (intensity + (angle << 8)) << 44;
	};

	// Precision wait
	// p_wait = (waitTime) => {
	// 	// let t0 = time.perf_counter();
	// 	// let t1 = t0;
	// 	// while (t1 - t0 < waitTime) {
	// 	// 	t1 = time.perf_counter();
	// 	// }
	// 	let t0 = now();
	// 	let t1 = t0;
	// 	while ((t1 - t0) * 1000 < waitTime) {
	// 		t1 = now();
	// 	}
	// }

	// Compute CRC8
	// https://www.microchip.com/webdoc/AVRLibcReferenceManual/group__util__crc_1gab27eaaef6d7fd096bd7d57bf3f9ba083.html
	crc8_ccitt(old_crc, new_data) {
		let data = old_crc ^ new_data;

		for (let i = 0; i < 8; i++) {
			if ((data & 0x80) != 0) {
				data = data << 1;
				data = data ^ 0x07;
			} else {
				data = data << 1;
			}
			data = data & 0xff;
		}
		return data;
	}

	// Send a raw packet and wait for a response (CRC will be added automatically)
	send_packet = (packet, cb) => {
		if (!packet) {
			packet = [0x00, 0x00, 0x08, 0x80, 0x80, 0x80, 0x80, 0x00];
		}

		let bytes_out = [];
		bytes_out.push(...packet);

		// Compute CRC
		let crc = 0;
		for (let d of packet) {
			crc = this.crc8_ccitt(crc, d);
		}
		bytes_out.push(crc);
		this.ser.write(bytes_out);
	}

	// Convert DPAD value to actual DPAD value used by Switch
	decrypt_dpad = (dpad) => {
		let dpadDecrypt = null;
		if (dpad == DIR_U) {
			dpadDecrypt = A_DPAD_U;
		} else if (dpad == DIR_R) {
			dpadDecrypt = A_DPAD_R;
		} else if (dpad == DIR_D) {
			dpadDecrypt = A_DPAD_D;
		} else if (dpad == DIR_L) {
			dpadDecrypt = A_DPAD_L;
		} else if (dpad == DIR_U_R) {
			dpadDecrypt = A_DPAD_U_R;
		} else if (dpad == DIR_U_L) {
			dpadDecrypt = A_DPAD_U_L;
		} else if (dpad == DIR_D_R) {
			dpadDecrypt = A_DPAD_D_R;
		} else if (dpad == DIR_D_L) {
			dpadDecrypt = A_DPAD_D_L;
		} else {
			dpadDecrypt = A_DPAD_CENTER;
		}
		return dpadDecrypt;
	}

	// Convert CMD to a packet
	cmd_to_packet = (command) => {
		let cmdCopy,
			low,
			high,
			dpad,
			lstick_intensity,
			lstick_angle,
			rstick_intensity,
			rstick_angle;
		cmdCopy = command;
		low = cmdCopy & 0xff;
		cmdCopy = cmdCopy >> 8; // 8
		high = cmdCopy & 0xff;
		cmdCopy = cmdCopy >> 8; // 16
		dpad = cmdCopy & 0xff;
		cmdCopy = cmdCopy >> 8; // 24
		lstick_intensity = cmdCopy & 0xff;
		cmdCopy = cmdCopy >> 8; // 32
		lstick_angle = cmdCopy & 0xfff;
		cmdCopy = cmdCopy >> 12; // 44
		rstick_intensity = cmdCopy & 0xff;
		cmdCopy = cmdCopy >> 8; // 52
		rstick_angle = cmdCopy & 0xfff; // 60
		dpad = this.decrypt_dpad(dpad);
		let left = this.angle(lstick_angle, lstick_intensity);
		let right = this.angle(rstick_angle, rstick_intensity);

		let packet = [high, low, dpad, left.x, left.y, right.x, right.y, 0x00];
		// print (hex(command), packet, lstick_angle, lstick_intensity, rstick_angle, rstick_intensity)
		return packet;
	};

	cmd_to_packet2 = (command, axes) => {
		let cmdCopy,
			low,
			high,
			dpad,
			lstick_intensity,
			lstick_angle,
			rstick_intensity,
			rstick_angle;
		cmdCopy = command;
		low = cmdCopy & 0xff;
		cmdCopy = cmdCopy >> 8; // 8
		high = cmdCopy & 0xff;
		cmdCopy = cmdCopy >> 8; // 16
		dpad = cmdCopy & 0xff;
		cmdCopy = cmdCopy >> 8; // 24
		lstick_intensity = cmdCopy & 0xff;
		cmdCopy = cmdCopy >> 8; // 32
		lstick_angle = cmdCopy & 0xfff;
		cmdCopy = cmdCopy >> 12; // 44
		rstick_intensity = cmdCopy & 0xff;
		cmdCopy = cmdCopy >> 8; // 52
		rstick_angle = cmdCopy & 0xfff; // 60
		dpad = this.decrypt_dpad(dpad);
		let left_x = axes[0];
		let left_y = axes[1];
		let right_x = axes[2];
		let right_y = axes[3];
		let packet = [high, low, dpad, left_x, left_y, right_x, right_y, 0x00];
		// print (hex(command), packet, lstick_angle, lstick_intensity, rstick_angle, rstick_intensity)
		return packet;
	};

	// Send a formatted controller command to the MCU
	send_cmd = (command) => {
		if (!command) {
			command = NO_INPUT;
		}
		let commandSuccess = this.send_packet(this.cmd_to_packet(command));
		return commandSuccess;
	}

	//Test all buttons except for home and capture
	// testbench_btn = () => {
	// 	this.send_cmd(BTN_A);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// 	this.send_cmd(BTN_B);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// 	this.send_cmd(BTN_X);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// 	this.send_cmd(BTN_Y);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// 	this.send_cmd(BTN_PLUS);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// 	this.send_cmd(BTN_MINUS);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// 	this.send_cmd(BTN_LCLICK);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// 	this.send_cmd(BTN_RCLICK);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// };

	// Test DPAD U / R / D / L
	// testbench_dpad = () => {
	// 	this.send_cmd(DPAD_U);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// 	this.send_cmd(DPAD_R);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// 	this.send_cmd(DPAD_D);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// 	this.send_cmd(DPAD_L);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// };
	// // Test DPAD Diagonals - Does not register on switch due to dpad buttons
	// testbench_dpad_diag = () => {
	// 	this.send_cmd(DPAD_U_R);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// 	this.send_cmd(DPAD_D_R);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// 	this.send_cmd(DPAD_D_L);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// 	this.send_cmd(DPAD_U_L);
	// 	this.p_wait(0.5);
	// 	this.send_cmd();
	// 	this.p_wait(0.001);
	// };

	// testbench = () => {
	// 	this.testbench_btn();
	// 	this.testbench_dpad();
	// 	this.testbench_lstick();
	// 	this.testbench_rstick();
	// 	this.testbench_packet_speed();
	// 	return;
	// }

	// writeAndDrain = (data, cb) => {
	// 	// this.ser.write(data, (error, bytesWritten) => {
	// 	// 	console.log("eb", error, bytesWritten);
	// 	// 	this.ser.drain(cb);
	// 	// });
	// 	this.ser.write(data);
	// 	this.ser.drain(cb);
	// 	// cb();
	// };

	// waitForData = (timeToWait, cb) => {
	// 	let t = now();
	// 	let timer = setInterval(() => {
	// 		let byte = this.ser.read(1);
	// 		if (byte === null) {
	// 			let tWaiting = now() - t;
	// 			if (tWaiting > timeToWait) {
	// 				clearInterval(timer);
	// 				cb(null);
	// 			}
	// 		} else {
	// 			// console.log(typeof byte);
	// 			// console.log(Object.keys(byte));
	// 			// console.log(byte);
	// 			// console.log(byte[0]);
	// 			clearInterval(timer);
	// 			cb(byte);
	// 		}
	// 	}, 1);
	// };

	// writeDrainWait = (data, timeToWait, cb) => {
	// 	this.writeAndDrain(data, () => {
	// 		this.waitForData(timeToWait, cb);
	// 	});
	// };

	// flushWait = (timeToWait, cb) => {
	// 	this.ser.flush(() => {
	// 		this.waitForData(timeToWait, cb);
	// 	});
	// };

	handleData = (buffer) => {
		if (buffer && buffer[0] != 0x90) {
			this.synced = true;
			this.ser.off("data", this.handleData);
		}
	};

	closeConnection = () => {
		try {
			this.ser.close();
		} catch(error) {
			console.log(error);
		}
	};

	// Start MCU syncing process
	sync = () => {
		// this.ser.write([0xff, 0x33, 0xcc]);
		// this.ser.write([0x00, 0x00, 0x00, 0x00, 0x00]);

		this.ser.write([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
		this.ser.write([0x33]);
		this.ser.write([0xcc]);
		this.send_packet();
		// this.ser.write([0xff, 0x33, 0xcc, 0x00, 0x00, 0x00, 0x00, 0x00]);

		// setTimeout(() => {
		// 	this.ser.write([0xff]);
		// }, 0);
		// setTimeout(() => {
		// 	this.ser.write([0x33]);
		// }, 1000);
		// setTimeout(() => {
		// 	this.ser.write([0xcc]);
		// }, 2000);
	};
}

// setTimeout(() => {
// 	let controller = new SwitchController();
// 	controller.connect("COM3");

// 	// wait for the arduino to be ready:
// 	setTimeout(() => {
// 		setInterval(() => {
// 			// controller.send_cmd(LSTICK_U + BTN_A);
// 			// controller.p_wait(0.02);
// 			// controller.send_cmd();

// 			// controller.b = 1;
// 			// controller.setBtns();
// 			// controller.send();

// 			// // reset:
// 			// controller.reset();
// 			// controller.setBtns();
// 			// controller.send();

// 			// controller.testbench()
// 			// testbench_packet_speed(1000)
// 		}, 2000);
// 	}, 2000);

// 	// controller.testbench_btn();

// 	// const SerialPort = require("serialport");
// 	// let ser = new SerialPort("COM2", { baudRate: 19200 });
// 	// ser.on("data", (buffer) => {console.log(buffer)});
// }, 1000);
