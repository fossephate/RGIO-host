// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const remote = require("electron").remote;

function handleError(error) {
	console.log(error);
}

(function handleWindowControls() {
	// When document has loaded, initialise
	document.onreadystatechange = () => {
		if (document.readyState == "complete") {
			init();
		}
	};

	let window2;
	let minButton;
	let maxButton;
	let restoreButton;
	let closeButton;

	function toggleMaxRestoreButtons() {
		window2 = remote.getCurrentWindow();
		if (window2.isMaximized()) {
			maxButton.style.display = "none";
			restoreButton.style.display = "flex";
		} else {
			restoreButton.style.display = "none";
			maxButton.style.display = "flex";
		}
	}

	function init() {
		window2 = remote.getCurrentWindow();
		minButton = document.getElementById("min-button");
		maxButton = document.getElementById("max-button");
		restoreButton = document.getElementById("restore-button");
		closeButton = document.getElementById("close-button");

		minButton.addEventListener("click", (event) => {
			window2 = remote.getCurrentWindow();
			window2.minimize();
		});

		maxButton.addEventListener("click", (event) => {
			window2 = remote.getCurrentWindow();
			window2.maximize();
			toggleMaxRestoreButtons();
		});

		restoreButton.addEventListener("click", (event) => {
			window2 = remote.getCurrentWindow();
			window2.unmaximize();
			toggleMaxRestoreButtons();
		});

		// Toggle maximise/restore buttons when maximisation/unmaximisation
		// occurs by means other than button clicks e.g. double-clicking
		// the title bar:
		toggleMaxRestoreButtons();
		window2.on("maximize", toggleMaxRestoreButtons);
		window2.on("unmaximize", toggleMaxRestoreButtons);

		// closeButton.addEventListener("click", (event) => {
		// 	window2 = remote.getCurrentWindow();
		// 	window2.close();
		// });
	}
})();
