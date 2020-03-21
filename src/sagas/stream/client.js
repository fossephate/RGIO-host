import { takeEvery } from "redux-saga/effects";

const handleClientActions = (params) => {
	let list = [];
	list.push(
		takeEvery("AUTHENTICATE", (action) => {
			params.socket.emit("authenticate", { authToken: action.payload.authToken });
		}),
	);
	return list;
};

export default handleClientActions;
