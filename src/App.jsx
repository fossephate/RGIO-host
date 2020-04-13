const IS_MODULE = require.main === module;
let HOST_OS = "windows";
let platform;

if (IS_MODULE) {
	platform = process.platform;
} else {
	platform = window.process.platform;
}

switch (platform) {
	case "win32":
		HOST_OS = "windows";
		break;
	case "linux":
		HOST_OS = "linux";
		break;
	default:
		HOST_OS = "linux";
		break;
}

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
// const { spawn } = require("child_process");
// const { desktopCapturer } = require("electron");
const app = require("electron").remote.app;

// redux:
import { connect } from "react-redux";
// redux-saga:
import handleStreamActions from "src/sagas/stream";
import handleStreamEvents from "src/sockets/stream";
// actions:
import { openAlert } from "shared/features/alert.js";

// libs:
import { device } from "shared/libs/utils.js";
// import HostControl from "src/../hostControl/HostControl.js";
// import { Lagless2Host } from "src/libs/lagless/lagless2.js";
// import { Lagless4Host } from "src/libs/lagless/lagless4.js";
// import socketio from "socket.io-client";

// recompose:
import { compose } from "recompose";
import HostStream from "src/libs/lagless/HostStream.js";

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

		this.hostControl = null;

		this.accountConnection = this.props.accountConnection;

		let args = {};
		if (HOST_OS === "windows") {
			args.catLocation = `${app.getAppPath()}/misc/utils/cat.exe`;
			args.ffmpegLocation = `${app.getAppPath()}/misc/utils/ffmpeg.exe`;
		} else if (HOST_OS === "linux") {
			// catLocation = `${app.getAppPath()}/misc/utils/cat`;
			args.catLocation = "cat";
			args.ffmpegLocation = `${app.getAppPath()}/misc/utils/ffmpeg`;
		}

		this.hostStream = new HostStream(args);
		this.hostStream.connectAccountServer({ connection: this.accountConnection });

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
				videoType: "mpeg2",
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
		this.hostStream.killProcesses();
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
		this.hostStream.killProcesses();
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

	handleStartStreaming = (args) => {
		if (args.windowTitleDropdown !== 0) {
			args.windowTitle = args.windowTitleDropdown;
		}
		if (args.audioDeviceDropdown !== 0) {
			args.audioDevice = args.audioDeviceDropdown;
		}

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
					this.hostStream.killProcesses();
					setTimeout(() => {
						this.hostStream.startStreaming({ ...args, ...data });
						this.hostStream.runCustomControl(
							`${app.getAppPath()}/hostControl/customControl.js`,
						);

						// // listen to events and dispatch actions:
						handleStreamEvents(this.hostStream.hostConnection, this.props.store.dispatch);
						// handle outgoing events & listen to actions:
						// and maybe dispatch more actions:
						this.props.sagaMiddleware.run(handleStreamActions, {
							socket: this.hostStream.hostConnection,
							dispatch: this.props.store.dispatch,
						});
					}, 2000);
				} else {
					// alert(data.reason);
					this.props.openAlert({ title: data.reason });
				}
			},
		);
	};

	handleStopStreaming = (suppressError) => {
		this.hostStream.stopStreaming();
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
