// react:
import React, { Component } from "react";
import ReactDOM from "react-dom";
// react-router:
import { Route, Switch } from "react-router";
import { HashRouter } from "react-router-dom";

// material ui:
import { CssBaseline } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/styles";
import { createMuiTheme } from "@material-ui/core/styles";

// components:
import App from "src/App.jsx";

// redux:
import { Provider } from "react-redux";
import { createStore, applyMiddleware, compose } from "redux";

import rootReducer from "./reducers";

// redux-saga:
import createSagaMiddleware from "redux-saga";
import handleAccountActions from "src/sagas/account/index.js";
import handleAccountEvents from "src/sockets/account/index.js";

// libs:
import socketio from "socket.io-client";
import merge from "deepmerge";

const sagaMiddleware = createSagaMiddleware();

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

let preloadedState = {
	client: {
		authToken: null,
		loggedIn: false,
		userid: null,
		username: "???",
		connectedAccounts: [],
		validUsernames: [],
		usernameIndex: 0,
		waitlisted: false,
		timePlayed: 0,
		emailVerified: false,
		roles: {},
	},
	stream: {
		// videoServerIP: null,
		// videoServerPort: null,
		// hostServerIP: null,
		// hostServerPort: null,

		chat: {
			messages: [],
			userids: [],
		},
		accountMap: {},
	},
};

const store = createStore(
	rootReducer,
	preloadedState,
	composeEnhancers(applyMiddleware(sagaMiddleware)),
);

let accountConnection = socketio("https://remotegames.io", {
	path: "/8099/socket.io",
	transports: ["polling", "websocket", "xhr-polling", "jsonp-polling"],
});

// listen to events and dispatch actions:
handleAccountEvents(accountConnection, store.dispatch);

// handle outgoing events & listen to actions:
// and maybe dispatch more actions:
sagaMiddleware.run(handleAccountActions, {
	socket: accountConnection,
	dispatch: store.dispatch,
});

class Index extends Component {
	constructor(props) {
		super(props);

		this.theme = createMuiTheme({
			palette: {
				type: "dark",
				primary: {
					main: "#2181ff", // #2181ff
				},
				secondary: {
					main: "#ff3b3b",
				},
			},
		});

		// let currentValue = null;
		// const unsubscribe = store.subscribe(() => {
		// 	let previousValue = currentValue;
		// 	currentValue = store.getState().settings.theme;
		// 	if (previousValue !== currentValue) {
		// 		console.log("theme changed");
		// 		// this.switchTheme(currentValue);
		// 		this.setState({});
		// 	}
		// });
	}

	switchTheme = (themeName) => {
		switch (themeName) {
			case "light":
				this.theme = merge(this.theme, {
					palette: {
						type: "light",
					},
				});
				break;
			case "dark":
				this.theme = merge(this.theme, {
					palette: {
						type: "dark",
					},
				});
				break;
			case "mint":
				this.theme = merge(this.theme, {
					palette: {
						type: "light",
						primary: {
							main: "#16d0f4",
						},
						secondary: {
							main: "#24d2ac",
						},
						background: {
							paper: "#5ae097",
						},
					},
				});
				break;
		}
		this.theme = createMuiTheme(this.theme);
	}

	render() {
		console.log("re-rendering index");

		return (
			<Provider store={store}>
				<ThemeProvider theme={this.theme}>
					<CssBaseline />
					<HashRouter>
						<Switch>
							// order matters here, can't do exact path or /login and /register break:
							<Route
								path="/"
								render={(props) => {
									return (
										<App
											{...props}
											store={store}
											sagaMiddleware={sagaMiddleware}
											accountConnection={accountConnection}
										/>
									);
								}}
							/>
						</Switch>
					</HashRouter>
				</ThemeProvider>
			</Provider>
		);
	}
}

ReactDOM.render(<Index />, document.getElementById("root"));
