// react:
import React, { Component } from "react";

// react-router:
import { Route, Switch, withRouter } from "react-router";

// material ui:
import { withStyles } from "@material-ui/core/styles";
// components:

import VideoSettingsForm from "src/components/forms/VideoSettingsForm.jsx";
import TitleBar from "src/components/appBar/TitleBar.jsx";
import AppBar from "src/components/appBar/AppBar.jsx";
import Chat from "shared/components/chat/Chat.jsx";

// modals:
import LoginRegisterModal from "shared/components/modals/LoginRegisterModal.jsx";
import AccountModal from "shared/components/modals/AccountModal.jsx";

// imports:
// const { execFile, spawn, exec } = require("child_process");
const { spawn } = require("child_process");
const app = require("electron").remote.app;
const { desktopCapturer } = require("electron");

// redux:
import { connect } from "react-redux";
// redux-saga:
import handleStreamActions from "src/sagas/stream";
import handleStreamEvents from "src/sockets/stream";
// actions:
import { openAlert } from "shared/features/alert.js";

// libs:
import { device } from "shared/libs/utils.js";
import HostControl from "src/../hostControl/HostControl.js";
import { Lagless2Host } from "src/libs/lagless/lagless2.js";
import { Lagless4Host } from "src/libs/lagless/lagless4.js";
import socketio from "socket.io-client";

// recompose:
import { compose } from "recompose";

let os = "windows";
let platform;

if (require.main === module) {
	platform = process.platform;
} else {
	platform = window.process.platform;
}

switch (platform) {
	case "win32":
		os = "windows";
		break;
	case "linux":
		os = "linux";
		break;
	default:
		os = "linux";
		break;
}

// jss:
const styles = (theme) => ({
	root: {
		width: "100%",
		gridGap: "5px",
		// allow title bar to be re-sized:
		// padding: "5px 5px 0px 5px",
		// "&>div:nth-child(2)": {
		// 	margin: "-5px -5px 0px -5px",
		// },
	},
	[device.tablet]: {
		root: {},
	},
	[device.laptop]: {
		root: {},
	},
	settingsContainer: {
		overflowY: "auto",
		height: "calc(100vh - 72px)",
		display: "flex",
		flexDirection: "row",
		padding: "2%",
	},
	versionNumber: {
		color: "#fff",
		position: "absolute",
		right: "25px",
		bottom: "5px",
		zIndex: 3000,
	},
});

class App extends Component {
	constructor(props) {
		super(props);

		this.args = [];
		this.controllerHostInstance = null;
		this.hostControl = null;

		this.accountConnection = this.props.accountConnection;
		this.hostConnection = null;
		this.videoConnection = null;
		this.stream = null;

		// this.initialValues = {};

		this.state = {
			formInitialValues: {
				// host1: "https://remotegames.io",
				// port1: 8099,
				streamTitle: "",
				region: "US East",
				width: 1280,
				height: 720,
				windowTitle: null,
				windowTitleDropdown: 0,
				audioDevice: null,
				audioDeviceDropdown: 0,
				videoDevice: null,
				videoDeviceDropdown: 0,
				resolution: 540,
				videoBitrate: 1500,
				videoBufferSize: 512,
				audioBufferSize: 128,
				groupOfPictures: 60,
				captureRate: 60,
				framerate: 30,
				capture: "window",
				streamType: "mpeg2",
				offsetX: 0,
				offsetY: 0,
				controllerCount: 1,
			},
		};

		// this.regionMap = {
		// 	"US East": {
		// 		host1: "https://remotegames.io",
		// 		port1: 8099,
		// 	},
		// };
	}

	componentDidMount() {
		this.killProcesses();
		if (!this.props.loggedIn) {
			this.props.history.replace("/login");
		}
		// localforage.clear();
		setTimeout(() => {
			if (this.props.history.location.pathname !== "/" && this.props.loggedIn) {
				this.props.history.replace("/");
			}
		}, 1000);
		setTimeout(() => {
			if (this.props.history.location.pathname !== "/" && this.props.loggedIn) {
				this.props.history.replace("/");
			}
		}, 5000);
	}

	componentWillUnmount() {
		this.killProcesses();
	}

	shouldComponentUpdate(nextProps, nextState) {
		// if (this.props.loggedIn !== nextProps.loggedIn) {
		// 	return true;
		// }

		let pathname = this.props.history.location.pathname;

		if (!this.props.loggedIn && pathname !== "/login" && pathname !== "/register") {
			this.props.history.push("/login");
		}

		if (this.props.loggedIn && (pathname === "/login" || pathname === "/register")) {
			this.props.history.push("/");
		}

		// if (this.state != nextState) {
		// 	return true;
		// }
		// return false;
		return true;
	}

	killProcesses = () => {
		if (this.hostConnection) {
			this.hostConnection.removeAllListeners();
			this.hostConnection.destroy();
			this.hostConnection = null;
		}
		if (this.videoConnection) {
			this.videoConnection.removeAllListeners();
			this.videoConnection.destroy();
			this.videoConnection = null;
		}
		if (this.stream) {
			this.stream.destroy();
			this.stream = null;
		}
		if (this.hostControl) {
			this.hostControl.destroy();
			this.hostControl = null;
		}
	};

	handleStartStreaming = (args) => {
		// this.args = args;
		// this.props.socket.emit("stopStreaming", { authToken: this.props.authToken });
		// console.log(args);
		this.props.accountConnection.emit(
			"startStreaming",
			{
				authToken: this.props.authToken,
				streamSettings: {
					...args,
				},
			},
			(data) => {
				if (data.success) {
					this.killProcesses();
					this.killProcesses();
					setTimeout(() => {
						this.startStreaming({ ...args, ...data });
					}, 2000);
				} else {
					// alert(data.reason);
					this.props.openAlert({ title: data.reason });
				}
			},
		);
	};

	startStreaming = (args) => {
		if (this.hostConnection) {
			this.hostConnection.removeAllListeners();
			this.hostConnection.destroy();
			this.hostConnection = null;
		}
		if (this.videoConnection) {
			this.videoConnection.removeAllListeners();
			this.videoConnection.destroy();
			this.videoConnection = null;
		}

		this.hostConnection = socketio(`https://${args.hostIP}`, {
			path: `/${args.hostPort}/socket.io`,
			transports: ["polling", "websocket", "xhr-polling", "jsonp-polling"],
		});

		this.hostConnection.on("disconnect", () => {
			this.handleStopStreaming(true);
		});

		// // listen to events and dispatch actions:
		handleStreamEvents(this.hostConnection, this.props.store.dispatch);
		// handle outgoing events & listen to actions:
		// and maybe dispatch more actions:
		this.props.sagaMiddleware.run(handleStreamActions, {
			socket: this.hostConnection,
			dispatch: this.props.store.dispatch,
		});

		// start video host:

		// todo set host2 and port2 based on region and args:
		args = { ...args, host1: "https://remotegames.io", port1: 8099 };
		console.log(args);

		if (args.windowTitleDropdown !== 0) {
			args.windowTitle = args.windowTitleDropdown;
		}
		if (args.audioDeviceDropdown !== 0) {
			args.audioDevice = args.audioDeviceDropdown;
		}

		if (args.streamType === "webRTC") {
			this.videoConnection = socketio(`https://${args.videoIP}`, {
				path: `/${args.videoPort}/socket.io`,
				transports: ["polling", "websocket", "xhr-polling", "jsonp-polling"],
			});

			this.stream = new Lagless4Host(this.videoConnection, args.streamKey);

			navigator.mediaDevices.enumerateDevices().then((sources) => {
				console.log(sources);

				let audioConstraint = null;
				let videoConstraint = null;

				if (!args.audioDevice) {
					audioConstraint = false;
				} else if (args.audioDevice === "Desktop Audio") {
					audioConstraint = {
						mandatory: {
							chromeMediaSource: "desktop",
						},
					};
				}

				if (args.capture === "desktop") {
					videoConstraint = {
						mandatory: {
							chromeMediaSource: "desktop",
							// minWidth: 1280,
							// maxWidth: 1280,
							// minHeight: 720,
							// maxHeight: 720,
						},
					};
				}

				desktopCapturer
					.getSources({ types: ["window", "screen"] })
					.then(async (sources) => {
						if (args.windowTitle) {
							for (const source of sources) {
								if (source.name === args.windowTitle) {
									try {
										const stream = await navigator.mediaDevices.getUserMedia({
											audio: audioConstraint,
											video: { mandatory: { chromeMediaSourceId: source.id } },
										});
										this.stream.start(stream);
									} catch (error) {
										this.props.openAlert({ title: error });
									}
									return;
								}
							}
						} else {
							for (const source of sources) {
								if (source.name === "Screen 1") {
									try {
										const stream = await navigator.mediaDevices.getUserMedia({
											audio: audioConstraint,
											video: {
												...videoConstraint,
												mandatory: {
													chromeMediaSource: "desktop",
													chromeMediaSourceId: source.id,
												},
											},
										});
										this.stream.start(stream);
									} catch (error) {
										this.props.openAlert({ title: error });
									}
									return;
								}
							}
						}
					});
			});
		} else if (args.streamType === "mpeg2") {
			this.videoConnection = socketio(`https://${args.videoIP}`, {
				path: `/${args.videoPort}/socket.io`,
				transports: ["polling", "websocket", "xhr-polling", "jsonp-polling"],
			});

			this.stream = new Lagless2Host(
				args,
				app.getAppPath(),
				this.hostConnection,
				this.videoConnection,
			);

			this.stream.setupAuthentication(args.streamKey);

			this.stream.start();
		}

		// start control host:
		let catLocation;
		if (os === "windows") {
			catLocation = app.getAppPath() + "\\misc\\utils\\cat.exe";
		} else if (os === "linux") {
			// catLocation = app.getAppPath() + "\\misc\\utils\\cat";
			catLocation = "cat";
		}

		let customScriptLocation = app.getAppPath() + "\\hostControl\\customControl.js";
		// read customControl.js file from disk:
		let catProc = spawn(catLocation, [customScriptLocation]);
		catProc.stdout.setEncoding("utf8");
		catProc.stdout.on("data", (data) => {
			data = data.toString();
			this.hostControl = new HostControl(this.hostConnection, {
				controllerCount: args.controllerCount,
				keyboardEnabled: args.keyboardEnabled,
				mouseEnabled: args.mouseEnabled,
				controlSwitch: args.controlSwitch,
			});
			// this.hostControl.connectServers({
			// 	hostIP: args.hostIP,
			// 	hostPort: args.hostPort,
			// 	streamKey: args.streamKey,
			// });
			this.hostControl.init();
			this.hostControl.start(data);
		});
	};

	handleStopStreaming = (suppressError) => {
		this.killProcesses();
		this.killProcesses();
		this.props.accountConnection.emit(
			"stopStreaming",
			{ authToken: this.props.authToken },
			(data) => {
				if (!data.success && !suppressError) {
					// alert(data.reason);
					this.props.openAlert({ title: data.reason });
				}
			},
		);
	};

	handleGetSettings = () => {
		this.handleStopStreaming(true);

		this.props.accountConnection.emit(
			"getStreamSettings",
			{ authToken: this.props.authToken },
			(data) => {
				if (data.success) {
					this.setState({
						formInitialValues: {
							...this.state.formInitialValues,
							...data.streamSettings,
						},
					});
				} else {
					this.props.openAlert({ title: data.reason });
				}
			},
		);
	};

	handleClose = () => {
		this.handleStopStreaming(true);
		setTimeout(() => {
			app.quit();
		}, 1000);
	};

	toggleDrawer = () => {
		this.props.openAlert({ title: "test" });
	};

	render() {
		console.log("re-rendering app.");

		const { classes } = this.props;

		return (
			<div className={classes.root}>
				<TitleBar handleClose={this.handleClose} />
				<AppBar handleToggleDrawer={this.toggleDrawer} handleClose={this.handleClose} />

				<div className={classes.versionNumber}>v{APPLICATION_VERSION}</div>
				{/* selects the first matching path: */}
				<Switch>
					<Route
						path="/(login|register)"
						render={(props) => {
							return (
								<LoginRegisterModal
									{...props}
									local={true}
									history={this.props.history}
								/>
							);
						}}
					/>
					<Route
						path="/account"
						render={(props) => {
							return <AccountModal {...props} local={true} />;
						}}
					/>

					<Route
						path="/"
						render={(props) => {
							return (
								<>
									<div className={classes.settingsContainer}>
										<VideoSettingsForm
											onSubmit={this.handleStartStreaming}
											onStopStreaming={this.handleStopStreaming}
											onGetSettings={this.handleGetSettings}
											initialValues={this.state.formInitialValues}
										/>
										<Chat hide={false} />
									</div>
									<video />
								</>
							);
						}}
					/>
				</Switch>
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	return {
		authToken: state.client.authToken,
		loggedIn: state.client.loggedIn,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		openAlert: (data) => {
			dispatch(openAlert(data));
		},
	};
};

export default compose(
	withRouter,
	withStyles(styles),
	connect(mapStateToProps, mapDispatchToProps),
)(App);
