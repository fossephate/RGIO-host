import * as types from "./ActionTypes.js";

export const updateStream = (data) => {
	return {
		type: types.UPDATE_STREAM,
		payload: {
			stream: data,
		},
	};
};
