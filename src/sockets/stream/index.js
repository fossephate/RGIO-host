// combine socket event handlers into one socket:
import chatSocketEvents from "./chat.js";
import accountMapEvents from "./accountMap.js";
import clientEvents from "./client.js";

const handleEvents = (socket, dispatch) => {
	socket = chatSocketEvents(socket, dispatch);
	socket = accountMapEvents(socket, dispatch);
	socket = clientEvents(socket, dispatch);

	return socket;
};

export default handleEvents;
