import { combineReducers } from "redux";

import chat from "./chat.js";
import accountMap from "./accountMap.js";

const streamReducer = combineReducers({
	chat,
	accountMap,
});

export default streamReducer;
