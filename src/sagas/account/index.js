import { all } from "redux-saga/effects";

import handleClientActions from "./clientInfo.js";

// combine sagas?:
// handles any outgoing actions w/ access to socket.io:
const handleActions = function*(params) {
	let list = [];
	list = list.concat(handleClientActions(params));

	// yield to entire list:
	yield all(list);
};

export default handleActions;
