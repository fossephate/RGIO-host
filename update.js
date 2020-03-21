const { autoUpdater } = require("electron-updater");
const { app, ipcMain, dialog } = require("electron");

function setupUpdate(mainWindow) {
	autoUpdater.autoDownload = false;

	autoUpdater.on("error", (error) => {
		dialog.showErrorBox(
			"Error: ",
			error == null ? "unknown" : (error.stack || error).toString(),
		);
	});

	autoUpdater.on("update-available", () => {
		mainWindow.webContents.send("updateAvailable", true);
	});

	autoUpdater.on("update-not-available", () => {
		mainWindow.webContents.send("updateAvailable", false);
	});

	// autoUpdater.on("update-downloaded", () => {
	// 	setImmediate(() => autoUpdater.quitAndInstall());
	// });

	autoUpdater.on("update-downloaded", () => {
		dialog.showMessageBox(
			{
				title: "Update Downloaded",
				message: "Update Downloaded! The update will install on application exit.",
			},
			() => {
				setImmediate(() => autoUpdater.quitAndInstall());
			},
		);
	});

	ipcMain.on("checkForUpdates", (event, arg) => {
		autoUpdater.checkForUpdates();
	});

	ipcMain.on("downloadUpdate", (event, arg) => {
		autoUpdater.downloadUpdate();
		dialog.showMessageBox({
			title: "Downloading Update",
			message: "Downloading Update!",
		});
	});

	autoUpdater.on("download-progress", (progressObj) => {
		let log_message = "Download speed: " + progressObj.bytesPerSecond;
		log_message = log_message + " - Downloaded " + progressObj.percent + "%";
		log_message =
			log_message + " (" + progressObj.transferred + "/" + progressObj.total + ")";
		console.log(log_message);
	});

	ipcMain.on("showNoUpdateMessage", (event, arg) => {
		dialog.showMessageBox({
			title: "No Update Available",
			message: "The application is up-to-date.",
		});
	});

	ipcMain.on("askToUpdate", (event, arg) => {
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

	if (app.isPackaged) {
		autoUpdater.checkForUpdates();
	}
}

module.exports = setupUpdate;
