import { updateClient } from "shared/features/client.js";

// libs:
import localforage from "localforage";

function authenticate(socket, dispatch) {
	localforage.getItem("RemoteGames").then((value) => {
		if (value) {
			dispatch(updateClient({ authToken: value }));
			socket.emit(
				"authenticate",
				{
					authToken: value,
					usernameIndex: 0,
				},
				(data) => {
					if (data.success) {
						dispatch(updateClient({ ...data.clientInfo, loggedIn: true }));
					} else {
						console.log(`AUTHENTICATION_FAILURE: ${data.reason}`);
						// remove the authToken if it doesn't work:
						if (data.reason == "ACCOUNT_NOT_FOUND") {
							localforage.setItem("RemoteGames", null);
							dispatch(updateClient({ authToken: null }));
						}
					}
				},
			);
		} else {
			console.log("NO STORED AUTHTOKEN!");
		}
	});
}

// listen to events w/ given socket and dispatch actions accordingly:
const clientEvents = (socket, dispatch) => {
	/* AUTHENTICATION */
	authenticate(socket, dispatch);

	// reconnect:
	socket.on("disconnect", (data) => {
		console.log("lost connection, attempting reconnect1.");
		socket.connect();
		// re-authenticate if the connection was successful
		setTimeout(() => {
			if (socket.connected) {
				authenticate(socket, dispatch);
			}
		}, 1000);
	});

	return socket;
};

export default clientEvents;
