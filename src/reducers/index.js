import { combineReducers } from "redux";
import { reducer as form } from "redux-form";

import stream from "./stream/index.js";
// import streams from "./streams/index.js";
// import account from "./account/index.js";

import client from "shared/features/client.js";
// import settings from "./settings.js";

const rootReducer = combineReducers({
	stream,
	// streams,
	// account,
	client,
	// settings,
	form,
});

export default rootReducer;
