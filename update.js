/**
 * updater.js
 *
 * Please use manual update only when it is really required, otherwise please use recommended non-intrusive auto update.
 *
 * Import steps:
 * 1. create `updater.js` for the code snippet
 * 2. require `updater.js` for menu implementation, and set `checkForUpdates` callback from `updater` for the click property of `Check Updates...` MenuItem.
 */
const { app, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");

let updater;
autoUpdater.autoDownload = false;

autoUpdater.on("error", (error) => {
	dialog.showErrorBox(
		"Error: ",
		error == null ? "unknown" : (error.stack || error).toString(),
	);
});

autoUpdater.on("update-available", () => {
	dialog.showMessageBox(
		{
			type: "info",
			title: "Update Available",
			message: "An update is available, do you want to download it now?",
			buttons: ["Sure", "No"],
		},
		(buttonIndex) => {
			if (buttonIndex === 0) {
				autoUpdater.downloadUpdate();
			} else {
			}
		},
	);
});

autoUpdater.on("update-not-available", () => {
	dialog.showMessageBox({
		title: "No Update available",
		message: "Current version is up-to-date.",
	});
});

autoUpdater.on("update-downloaded", () => {
	dialog.showMessageBox(
		{
			title: "Update Downloaded",
			message: "The application will now restart in order to update.",
		},
		() => {
			setImmediate(() => autoUpdater.quitAndInstall());
		},
	);
});

// autoUpdater.on("update-downloaded", () => {
// 	dialog.showMessageBox(
// 		{
// 			title: "Update Available",
// 			message:
// 				"An update is available! The application will now restart in order to update.",
// 		},
// 		() => {
// 			setImmediate(() => autoUpdater.quitAndInstall());
// 		},
// 	);
// });

if (app.isPackaged) {
	autoUpdater.checkForUpdates();
}
