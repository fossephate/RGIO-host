// Modules to control application life and create native browser window
const { app, BrowserWindow } = require("electron");

const update = require("./update.js");

// handle automatic updating:


// https://stackoverflow.com/questions/60106922/electron-non-context-aware-native-module-in-renderer
// https://github.com/electron/electron/issues/18397
// https://github.com/serialport/node-serialport/issues/1186
// electron.app.allowRendererProcessReuse = false;
app.allowRendererProcessReuse = false;


// reload on save:
if (!app.isPackaged) {
	require("electron-reload")(__dirname);
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
global.mainWindow;

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		webPreferences: {
			nodeIntegration: true,
		},
		frame: false,
	});

	// and load the index.html of the app.
	mainWindow.loadFile("index.html");

	// Open the DevTools.
	if (!app.isPackaged) {
		mainWindow.webContents.openDevTools();
	}

	// Emitted when the window is closed.
	mainWindow.on("closed", () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});

	update(mainWindow);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
