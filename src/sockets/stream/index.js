// combine socket event handlers into one socket:
import chatSocketEvents from "./chat.js";
import accountMapEvents from "./accountMap.js";
import clientInfoEvents from "./clientInfo.js";

const handleEvents = (socket, dispatch) => {
	socket = chatSocketEvents(socket, dispatch);
	socket = accountMapEvents(socket, dispatch);
	socket = clientInfoEvents(socket, dispatch);

	return socket;
};

export default handleEvents;
