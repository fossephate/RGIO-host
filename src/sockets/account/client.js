import { updateClient } from "shared/features/client.js";

// libs:
import localforage from "localforage";

function getAccountInfo(socket, dispatch) {
	localforage.getItem("RemoteGames").then((value) => {
		if (value) {
			socket.emit(
				"getAccountInfo",
				{
					authToken: value,
					usernameIndex: 0,
				},
				(data) => {
					if (data.success) {
						dispatch(
							updateClient({
								...data.clientInfo,
								authToken: value,
								loggedIn: true,
							}),
						);
					} else {
						console.log(`AUTHENTICATION_FAILURE: ${data.reason}`);
						// remove the authToken if it doesn't work:
						if (data.reason === "ACCOUNT_NOT_FOUND") {
							localforage.setItem("RemoteGames", null);
							dispatch(updateClient({ authToken: null }));
						}
					}
				},
			);
		}
	});
}

// listen to events w/ given socket and dispatch actions accordingly:
const clientInfoEvents = (socket, dispatch) => {
	/* getAccountInfo */
	getAccountInfo(socket, dispatch);

	// socket.on("banned", (data) => {
	// 	localforage.setItem("banned", "banned");
	// });

	// // reconnect:
	// socket.on("disconnect", (data) => {
	// 	console.log("lost connection, attempting reconnect1.");
	// 	socket.connect();
	// 	// re-authenticate if the connection was successful
	// 	setTimeout(() => {
	// 		if (socket.connected) {
	// 			authenticate(socket, dispatch);
	// 		}
	// 	}, 1000);
	// });
	//
	// // todo: make this not necessary
	// setInterval(() => {
	// 	if (socket.connected) {
	// 		authenticate(socket, dispatch);
	// 	}
	// }, 120000); // 2 minutes

	return socket;
};

export default clientInfoEvents;
