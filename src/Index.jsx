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
import MyAlert from "shared/components/general/MyAlert.jsx";

// redux:
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

import rootReducer from "./reducers";

// redux-saga:
import createSagaMiddleware from "redux-saga";
import handleAccountActions from "src/sagas/account/index.js";
import handleAccountEvents from "src/sockets/account/index.js";

// libs:
import socketio from "socket.io-client";

class Index extends Component {
	constructor(props) {
		super(props);

		this.state = {
			theme: this.getTheme("dark"),
		};

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

		this.sagaMiddleware = createSagaMiddleware();

		this.store = configureStore({
			reducer: rootReducer,
			preloadedState: preloadedState,
			middleware: [this.sagaMiddleware],
		});

		this.accountConnection = socketio("https://remotegames.io", {
			path: "/8099/socket.io",
			transports: ["polling", "websocket", "xhr-polling", "jsonp-polling"],
		});

		// listen to events and dispatch actions:
		handleAccountEvents(this.accountConnection, this.store.dispatch);

		// handle outgoing events & listen to actions:
		// and maybe dispatch more actions:
		this.sagaMiddleware.run(handleAccountActions, {
			socket: this.accountConnection,
			dispatch: this.store.dispatch,
		});
	}

	getTheme = (themeName) => {
		let theme = {};
		switch (themeName) {
			case "light":
				theme = {
					palette: {
						type: "light",
						primary: {
							main: "#2181ff", // #2181ff
						},
						secondary: {
							main: "#ff3b3b",
						},
						background: {
							paper: "#fafafa",
						},
					},
				};
				break;
			case "ogdark":
				theme = {
					palette: {
						type: "dark",
						primary: {
							main: "#2181ff",
						},
						secondary: {
							main: "#ff3b3b",
						},
						background: {
							paper: "#424242",
						},
					},
				};
				break;
			case "dark":
				theme = {
					palette: {
						type: "dark",
						primary: {
							main: "#0d52a9",
						},
						secondary: {
							main: "#a90d0d",
						},
						background: {
							paper: "#202020",
						},
					},
				};
				break;
			case "spooky":
				theme = {
					palette: {
						type: "dark",
						primary: {
							main: "#ff7930",
						},
						secondary: {
							main: "#000",
							// main: "#a73ae7",
						},
						background: {
							paper: "#2f2f2f",
						},
					},
				};
				break;
		}
		return createMuiTheme(theme);
	};

	render() {
		console.log("re-rendering index");

		return (
			<Provider store={this.store}>
				<ThemeProvider theme={this.state.theme}>
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
											store={this.store}
											sagaMiddleware={this.sagaMiddleware}
											accountConnection={this.accountConnection}
										/>
									);
								}}
							/>
						</Switch>
						<MyAlert/>
					</HashRouter>
				</ThemeProvider>
			</Provider>
		);
	}
}

ReactDOM.render(<Index />, document.getElementById("root"));
