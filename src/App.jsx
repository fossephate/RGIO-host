// react:
import React, { Component } from "react";

// react-router:
import { Route, Switch, withRouter } from "react-router";

// material ui:
import { withStyles } from "@material-ui/core/styles";
// components:
import TitleBar from "src/components/TitleBar.jsx";
import VideoSettingsForm from "src/components/Forms/VideoSettingsForm.jsx";
import MyAppBar from "src/components/MyAppBar.jsx";
import Chat from "src/components/Stream/Chat/Chat.jsx";

// modals:
import LoginRegisterModal from "src/components/Modals/LoginRegisterModal.jsx";
import AccountModal from "src/components/Modals/AccountModal.jsx";
import InputMapperModal from "src/components/Modals/InputMapperModal.jsx";

// imports:
// const { execFile, spawn, exec } = require("child_process");
const { spawn } = require("child_process");
const app = require("electron").remote.app;
const { desktopCapturer } = require("electron");

// redux:
import { connect } from "react-redux";
import { updateStream } from "src/actions/stream.js";
import { updateClientInfo, authenticate } from "src/actions/clientInfo.js";
// redux-saga:
import handleStreamActions from "src/sagas/stream";
import handleStreamEvents from "src/sockets/stream";

// libs:
import HostControl from "src/../hostControl/hostControl.js";
import socketio from "socket.io-client";
import Lagless4Host from "src/libs/lagless/lagless4.js";

// recompose:
import { compose } from "recompose";

// device sizes:
import { device } from "src/constants/DeviceSizes.js";

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
	},
});

class App extends Component {
	constructor(props) {
		super(props);

		this.args = [];
		this.videoHostInstance = null;
		this.controllerHostInstance = null;
		this.hostControl = null;

		this.accountConnection = this.props.accountConnection;
		this.hostConnection = null;
		this.videoConnection = null;

		this.killProcesses = this.killProcesses.bind(this);
		this.handleStartStreaming = this.handleStartStreaming.bind(this);
		this.handleStopStreaming = this.handleStopStreaming.bind(this);
		this.handleGetSettings = this.handleGetSettings.bind(this);
		this.handleClose = this.handleClose.bind(this);

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
				resolution: 540,
				videoBitrate: 1,
				captureRate: 30,
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
		setTimeout(() => {
			if (this.props.loggedIn) {
				this.props.history.replace("/");
			} else {
				this.props.history.replace("/login");
			}
		}, 500);
	}

	componentWillUnmount() {
		this.killProcesses();
	}

	shouldComponentUpdate(nextProps, nextState) {
		// if (this.props.loggedIn !== nextProps.loggedIn) {
		// 	return true;
		// }

		if (this.props.history.location.pathname === "/" && !this.props.loggedIn) {
			this.props.history.push("/login");
		}

		if (this.props.history.location.pathname === "/login" && this.props.loggedIn) {
			this.props.history.push("/");
		}

		// if (this.state != nextState) {
		// 	return true;
		// }
		// return false;
		return true;
	}

	killProcesses() {
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
		if (this.videoHostInstance) {
			// this.videoHostInstance.stdin.pause();
			this.videoHostInstance.kill();
			spawn("taskkill", ["/f", "/t", "/im", "ffmpeg.exe"]);
			// process.kill(-this.videoHostInstance.pid);
		}
		if (this.controlHost) {
			this.controlHost.deinit();
		}
	}

	handleStartStreaming(args) {
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
					alert(data.reason);
				}
			},
		);
	}

	startStreaming(args) {
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

		// // listen to events and dispatch actions:
		handleStreamEvents(this.hostConnection, this.props.store.dispatch);
		// handle outgoing events & listen to actions:
		// and maybe dispatch more actions:
		this.props.sagaMiddleware.run(handleStreamActions, {
			socket: this.hostConnection,
			dispatch: this.props.store.dispatch,
		});

		// start video host:
		let videoHostLocation = app.getAppPath() + "\\hostVideo\\hostVideo.exe";

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

			let lagless4Host = new Lagless4Host(this.videoConnection, args.streamKey);

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
										lagless4Host.run(stream);
									} catch (error) {
										alert(error);
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
										lagless4Host.run(stream);
									} catch (error) {
										alert(error);
									}
									return;
								}
							}
						}
					});

				// this.audioDeviceNames = audioDeviceNames;
				// this.setState({});
			});
		} else {
			let myArgs = [
				`--host1=${args.host1}`,
				`--port1=${args.port1}`,
				// `--host2=${args.host2}`,
				// `--port2=${args.port2}`,
				`--resolution=${args.resolution}`,
				`--videoBitrate=${args.videoBitrate}`,
				`--captureRate=${args.captureRate}`,
				// `--audioDevice=${args.audioDevice}`,
			];

			if (args.capture === "window") {
				myArgs.push(`--windowTitle=${args.windowTitle}`);
			} else {
				myArgs.push(`--width=${args.width}`);
				myArgs.push(`--height=${args.height}`);
				myArgs.push(`--offsetX=${args.offsetX}`);
				myArgs.push(`--offsetY=${args.offsetY}`);
			}

			if (args.audioDevice) {
				myArgs.push(`--audioDevice=${args.audioDevice}`);
			}

			myArgs.push(`--host2=${args.videoIP}`);
			myArgs.push(`--port2=${args.videoPort}`);
			myArgs.push(`--streamKey=${args.streamKey}`);

			this.videoHostInstance = spawn(videoHostLocation, myArgs);

			this.videoHostInstance.stderr.on("data", (data) => {
				console.log("stderr: " + data);
			});
		}

		// start control host:

		let catLocation = app.getAppPath() + "\\hostControl\\cat.exe";
		let customScriptLocation = app.getAppPath() + "\\hostControl\\customControl.js";
		// read customControl.js file from disk:
		let catProc = spawn(catLocation, [customScriptLocation]);
		catProc.stdout.setEncoding("utf8");
		catProc.stdout.on("data", (data) => {
			data = data.toString();
			this.hostControl = new HostControl(args.hostIP, args.hostPort, args.streamKey, {
				controllerCount: args.controllerCount,
				keyboardEnabled: args.keyboardEnabled,
				mouseEnabled: args.mouseEnabled,
			});
			this.hostControl.init();
			this.hostControl.run(data);
		});
	}

	handleStopStreaming(suppressError) {
		this.killProcesses();
		this.killProcesses();
		this.props.accountConnection.emit(
			"stopStreaming",
			{ authToken: this.props.authToken },
			(data) => {
				if (!data.success && !suppressError) {
					alert(data.reason);
				}
			},
		);
	}

	handleGetSettings() {
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
					alert(data.reason);
				}
			},
		);
	}

	handleClose() {
		this.handleStopStreaming(true);
		setTimeout(() => {
			app.quit();
		}, 1000);
	}

	toggleDrawer() {
		alert("test");
	}

	render() {
		console.log("re-rendering app.");

		const { classes } = this.props;

		return (
			<div className={classes.root}>
				<TitleBar handleClose={this.handleClose} />
				<MyAppBar handleToggleDrawer={this.toggleDrawer} handleClose={this.handleClose} />
				{this.props.loggedIn && (
					<div className={classes.settingsContainer}>
						<VideoSettingsForm
							onSubmit={this.handleStartStreaming}
							onStopStreaming={this.handleStopStreaming}
							onGetSettings={this.handleGetSettings}
							initialValues={this.state.formInitialValues}
						/>
						<Chat hide={false} />
					</div>
				)}
				<video />
				<div className={classes.versionNumber}>v0.0.82</div>
				{/* selects the first matching path: */}
				<Switch>
					<Route
						path="/(login|register)"
						render={(props) => {
							return <LoginRegisterModal {...props} history={this.props.history} />;
						}}
					/>
					<Route
						path="/account"
						render={(props) => {
							return <AccountModal {...props} />;
						}}
					/>
					<Route
						path="/remap"
						render={(props) => {
							return <InputMapperModal {...props} inputHandler={inputHandler} />;
						}}
					/>
				</Switch>
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	return {
		authToken: state.clientInfo.authToken,
		loggedIn: state.clientInfo.loggedIn,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		updateStream: (settings) => {
			dispatch(updateStream(settings));
		},
		updateClientInfo: (data) => {
			dispatch(updateClientInfo(data));
		},
		authenticate: (data) => {
			dispatch(authenticate(data));
		},
	};
};

export default compose(
	withRouter,
	withStyles(styles),
	connect(mapStateToProps, mapDispatchToProps),
)(App);
