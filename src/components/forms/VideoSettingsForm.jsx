// react:
import React, { Component } from "react";

// redux:
import { connect } from "react-redux";
import { Field, reduxForm, formValueSelector } from "redux-form";

// material ui:
import {
	TextField,
	Checkbox,
	InputLabel,
	FormControlLabel,
	FormControl,
	FormHelperText,
	Link,
	Select,
	Radio,
	RadioGroup,
	Button,
	MenuItem,
	OutlinedInput,
} from "@material-ui/core";

import { withStyles } from "@material-ui/core/styles";

// recompose:
import { compose } from "recompose";

// libs:
import { device } from "shared/libs/utils.js";

const { desktopCapturer } = require("electron");

// imports:
const { execFile } = require("child_process");
const app = require("electron").remote.app;
const { spawn } = require("child_process");

const validate = (values) => {
	const errors = {};
	const requiredFields = ["username", "password1", "password2", "email"];
	requiredFields.forEach((field) => {
		if (!values[field]) {
			errors[field] = "Required";
		}
	});
	if (values.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
		errors.email = "Invalid email address";
	}
	return errors;
};

const renderTextField = ({
	label,
	input,
	meta: { touched, invalid, error },
	...custom
}) => (
	<TextField
		label={label}
		placeholder={label}
		error={touched && invalid}
		helperText={touched && error}
		{...input}
		{...custom}
	/>
);

const renderCheckbox = ({ input, label }) => (
	<div>
		<FormControlLabel
			control={
				<Checkbox checked={input.value ? true : false} onChange={input.onChange} />
			}
			label={label}
		/>
	</div>
);

const renderTOS = ({ input }) => (
	<div>
		<Checkbox checked={input.value ? true : false} onChange={input.onChange} />
		<span>I have read and agree to the </span>
		<Link href="https://remotegames.io/tos.html">Terms and Conditions</Link>
	</div>
);

// const radioButton = ({ input, ...rest }) => (
// 	<FormControl>
// 		<RadioGroup {...input} {...rest}>
// 			<FormControlLabel
// 				value="window"
// 				control={<Radio color="primary" />}
// 				label="Capture Window"
// 			/>
// 			<FormControlLabel
// 				value="desktop"
// 				control={<Radio color="primary" />}
// 				label="Capture Desktop"
// 			/>
// 		</RadioGroup>
// 	</FormControl>
// );

const renderRadioGroup = ({ input, ...rest }) => (
	<RadioGroup
		{...input}
		{...rest}
		value={input.value}
		onChange={(event, value) => input.onChange(value)}
	/>
);

const renderFromHelper = ({ touched, error }) => {
	if (!(touched && error)) {
		return;
	} else {
		return <FormHelperText>{touched && error}</FormHelperText>;
	}
};

const renderSelectField = ({
	input,
	label,
	meta: { touched, error },
	children,
	variant,
	labelWidth,
	...custom
}) => (
	<FormControl error={touched && error}>
		<InputLabel variant={variant} htmlFor={label + "Select"}>
			{label}
		</InputLabel>
		<Select
			autoWidth={true}
			{...input}
			{...custom}
			inputProps={
				variant !== "outlined" && variant !== "filled"
					? {
							id: label + "Select",
							labelWidth: labelWidth,
					  }
					: undefined
			}
			input={
				variant === "outlined" ? (
					<OutlinedInput id={label + "Select"} labelWidth={labelWidth} />
				) : undefined
			}
		>
			{children}
		</Select>
		{renderFromHelper({ touched, error })}
	</FormControl>
);

// jss:
const styles = (theme) => ({
	root: {
		display: "grid",
		gridGap: "10px",
		padding: "10px 10px 0 10px",
		width: "100%",
		userSelect: "none",
		overflowY: "auto",
		marginRight: "15px",

		"&>div": {
			display: "grid",
			gridTemplateColumns: "1fr 1fr 1fr",
			gridGap: "10px",
		},
	},
	[device.tablet]: {
		root: {
			width: "80%",
		},
	},
	buttons: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-evenly",
		// position: "relative",
		// marginLeft: "5px",
		// marginRight: "5px",
		// textAlign: "center",
	},
	dropdownContainer: {
		display: "flex",
		gridColumn: "1/3",
		border: "2px solid #000",
		borderRadius: "5px",
		// backgroundColor: "#6a6a6a50",
		"&>div": {
			width: "50%",
			// backgroundColor: "#6a6a6a50",
		},
		"&>div:first-child": {
			marginRight: "10px",
		},
		margin: "auto 0",
		padding: "10px",
		// "&:before": {
		// 	content: '""',
		// 	border: "3px solid #000",
		// 	borderRadius: "5px",
		// },
	},
});

class VideoSettingsForm extends Component {
	constructor(props) {
		super(props);

		this.windowTitles = [];
		this.dshowDevices = [];
		this.audioDeviceNames = [];
		this.driversNeeded = false;
		this.state = {
			TOSAgreed: false,
		};
	}

	checkForDrivers = () => {
		// check for ViGEm Drivers:
		this.driversNeeded = false;

		if (window.process.platform === "win32") {
			this.driversNeeded = true;

			let childProcess;
			let key64 = "HKLM\\SOFTWARE\\WOW6432Node\\Nefarius Software Solutions e.U.";
			let key32 = "HKLM\\SOFTWARE\\Nefarius Software Solutions e.U.";

			childProcess = spawn("reg.exe", ["QUERY", key64]);
			childProcess.stdout.on("data", (data) => {
				this.driversNeeded = false;
			});

			childProcess = spawn("reg.exe", ["QUERY", key32]);
			childProcess.stdout.on("data", (data) => {
				this.driversNeeded = false;
			});
		} else if (window.process.platform === "linux") {
		}
	};

	componentDidMount() {
		this.getWindowTitles();
		if (window.process.platform === "win32") {
			this.getDshowDevices();
		}
		this.getAudioDeviceNames();
		this.checkForDrivers();
		setTimeout(() => {
			this.setState({});
		}, 1000);
	}

	shouldComponentUpdate() {
		return true;
	}

	agreeTOS = (event) => {
		this.setState({ TOSAgreed: event.target.checked });
	};

	handleInstallDrivers = () => {
		if (window.process.platform === "win32") {
			let installerLocation = app.getAppPath() + "\\misc\\installers\\vigem-setup.exe";
			let childProcess = spawn(installerLocation);
			childProcess.on("close", () => {
				this.checkForDrivers();
				this.setState({});
			});
			childProcess.on("exit", () => {
				this.checkForDrivers();
				this.setState({});
			});
		}
	};

	// getRegions() {
	// 	let regions = ["US East"];
	// 	let menuItems = [];

	// 	for (let i = 0; i < regions.length; i++) {
	// 		menuItems.push(
	// 			<MenuItem key={i} value={regions[i]}>
	// 				{regions[i]}
	// 			</MenuItem>,
	// 		);
	// 	}
	// 	return menuItems;
	// }

	getWindowTitles = () => {
		let windowTitles = [];

		desktopCapturer.getSources({ types: ["window", "screen"] }).then(async (sources) => {
			for (const source of sources) {
				windowTitles.push(source.name);
			}
			this.windowTitles = windowTitles;
		});
	};

	getDshowDevices = () => {
		let ffmpegLocation = app.getAppPath() + "\\utils\\ffmpeg.exe";
		let childProcess = require("child_process").execFile(
			ffmpegLocation,
			["-list_devices", "true", "-f", "dshow", "-i", "dummy"],
			(error, stdout, stderr) => {
				// window.testString = stderr;
				let dshowDevices = stderr.match(/"(?!@)(.+)"/g);
				if (!dshowDevices) {
					dshowDevices = [];
				} else {
					for (let i = 0; i < dshowDevices.length; i++) {
						dshowDevices[i] = dshowDevices[i].split('"')[1];
					}
				}
				this.dshowDevices = dshowDevices;
			},
		);
	};

	getWindowTitleMenuItems = () => {
		let menuItems = [];
		menuItems.push(
			<MenuItem key={0} value={0}>
				None (or manually typed)
			</MenuItem>,
		);
		for (let i = 0; i < this.windowTitles.length; i++) {
			menuItems.push(
				<MenuItem key={i + 1} value={this.windowTitles[i]}>
					{this.windowTitles[i]}
				</MenuItem>,
			);
		}
		return menuItems;
	};

	getDshowDeviceMenuItems = () => {
		let menuItems = [];
		menuItems.push(
			<MenuItem key={0} value={0}>
				None (or manually typed)
			</MenuItem>,
		);
		for (let i = 0; i < this.dshowDevices.length; i++) {
			menuItems.push(
				<MenuItem key={i + 1} value={this.dshowDevices[i]}>
					{this.dshowDevices[i]}
				</MenuItem>,
			);
		}
		return menuItems;
	};

	getAudioDeviceNames = () => {
		let audioDeviceNames = [];
		// let ffmpegLocation = app.getAppPath() + "\\hostVideo\\ffmpeg\\ffmpeg.exe";
		// let childProcess = require("child_process").execFile(
		// 	ffmpegLocation,
		// 	["-list_devices", "true", "-f", "dshow", "-i", "dummy"],
		// 	(err, stdout, stderr) => {
		// 		// window.testString = stderr;
		// 		audioDeviceNames = stderr.match(/"(?!@)(.+)"/g);
		// 		if (!audioDeviceNames) {
		// 			audioDeviceNames = [];
		// 		} else {
		// 			for (let i = 0; i < audioDeviceNames.length; i++) {
		// 				audioDeviceNames[i] = audioDeviceNames[i].split('"')[1];
		// 			}
		// 		}
		// 		this.audioDeviceNames = audioDeviceNames;
		// 	},
		// );

		audioDeviceNames.push("Desktop Audio");

		navigator.mediaDevices.enumerateDevices().then((sources) => {
			for (let i = 0; i < sources.length; i++) {
				let source = sources[i];

				if (source.deviceId === "default" || source.deviceId === "communications") {
					continue;
				}

				if (source.kind === "audioinput") {
					audioDeviceNames.push(source.label);
				}
			}

			this.audioDeviceNames = audioDeviceNames;
			this.setState({});
		});
	};

	getAudioDeviceMenuItems() {
		let menuItems = [];
		menuItems.push(
			<MenuItem key={0} value={0}>
				None (or manually typed)
			</MenuItem>,
		);
		for (let i = 0; i < this.audioDeviceNames.length; i++) {
			menuItems.push(
				<MenuItem key={i + 1} value={this.audioDeviceNames[i]}>
					{this.audioDeviceNames[i]}
				</MenuItem>,
			);
		}
		return menuItems;
	}

	render() {
		const { handleSubmit, pristine, reset, submitting, classes, capture } = this.props;

		return (
			<form onSubmit={handleSubmit} className={classes.root}>
				{/* <div>
					<Field
						name="host1"
						component={renderTextField}
						label="Host"
						variant="outlined"
					/>
					<Field
						name="port1"
						component={renderTextField}
						label="Port"
						variant="outlined"
						type="number"
					/>
				</div> */}

				{/* <div>
					<Field
						name="region"
						component={renderSelectField}
						label="Region"
						variant="outlined"
						labelWidth={50}
					>
						{this.getRegions()}
					</Field>
				</div> */}

				<div>
					<Field
						name="streamTitle"
						component={renderTextField}
						label="Stream Title"
						variant="outlined"
					/>
					<Field
						name="thumbnailURL"
						component={renderTextField}
						label="Thumbnail URL"
						variant="outlined"
					/>
				</div>

				{/* <div>
					<>
						<div className={classes.dropdownContainer}>
							<Field
								name="audioDeviceDropdown"
								component={renderSelectField}
								label="Audio Device Name"
								variant="outlined"
								labelWidth={100}
							>
								{this.getAudioDeviceMenuItems()}
							</Field>
							<Field
								name="audioDevice"
								component={renderTextField}
								label="Audio Device Name"
								variant="outlined"
							/>
						</div>
						<div style={{ width: 0 }} />
					</>
				</div> */}

				<div>
					<Field
						name="captureRate"
						component={renderTextField}
						label="Capture Rate"
						variant="outlined"
						type="number"
					/>
					<Field
						name="resolution"
						component={renderTextField}
						label="Resolution"
						variant="outlined"
						type="number"
					/>
					<Field
						name="videoBitrate"
						component={renderTextField}
						label="Bitrate (kb/s)"
						variant="outlined"
						type="number"
					/>
				</div>

				<div>
					<Field
						name="videoBufferSize"
						component={renderTextField}
						label="Video Buffer Size"
						variant="outlined"
						type="number"
					/>
					<Field
						name="audioBufferSize"
						component={renderTextField}
						label="Audio Buffer Size"
						variant="outlined"
						type="number"
					/>
					<Field
						name="groupOfPictures"
						component={renderTextField}
						label="Group of Pictures"
						variant="outlined"
						type="number"
					/>
				</div>

				<div>
					<Field
						name="framerate"
						component={renderTextField}
						label="Output FPS"
						variant="outlined"
						type="number"
					/>
				</div>

				<div>
					{this.driversNeeded && (
						<Button
							variant="contained"
							color="primary"
							onClick={this.handleInstallDrivers}
						>
							Install Drivers for controller support
						</Button>
					)}
					{!this.driversNeeded && (
						<Field
							name="controllerCount"
							component={renderTextField}
							label="Number of Controllers"
							variant="outlined"
							type="number"
						/>
					)}

					<Field
						name="mouseEnabled"
						component={renderCheckbox}
						label="Allow Mouse Input"
					/>
					<Field
						name="keyboardEnabled"
						component={renderCheckbox}
						label="Allow Keyboard Input"
					/>
				</div>

				<div style={{ display: "flex" }}>
					<Field name="virtualXboxControllers" component={renderCheckbox} label="Virtual Xbox Controllers" />
					<Field name="controlSwitch" component={renderCheckbox} label="Control Switch" />
				</div>

				<div style={{ display: "block" }}>
					<Field name="videoType" component={renderRadioGroup} row>
						<FormControlLabel
							value="mpeg1"
							control={<Radio color="primary" />}
							label="MPEG-1"
						/>
						<FormControlLabel
							value="webRTC"
							control={<Radio color="primary" />}
							label="WebRTC"
						/>
					</Field>
				</div>

				<div style={{ display: "block" }}>
					<Field name="capture" component={renderRadioGroup} row>
						<FormControlLabel
							value="window"
							control={<Radio color="primary" />}
							label="Capture Window"
						/>
						<FormControlLabel
							value="desktop"
							control={<Radio color="primary" />}
							label="Capture Desktop"
						/>
						<FormControlLabel
							value="device"
							control={<Radio color="primary" />}
							label="Device"
						/>
					</Field>
				</div>

				{capture === "desktop" && (
					<>
						<div>
							<Field
								name="offsetX"
								component={renderTextField}
								label="Offset X"
								variant="outlined"
								type="number"
							/>
							<Field
								name="offsetY"
								component={renderTextField}
								label="Offset Y"
								variant="outlined"
								type="number"
							/>
						</div>
						<div>
							<Field
								name="width"
								component={renderTextField}
								label="Capture Width"
								variant="outlined"
								type="number"
							/>
							<Field
								name="height"
								component={renderTextField}
								label="Capture Height"
								variant="outlined"
								type="number"
							/>
						</div>
					</>
				)}

				<div>
					{capture === "window" && (
						<>
							<div className={classes.dropdownContainer}>
								<Field
									name="windowTitleDropdown"
									component={renderSelectField}
									label="Window Title"
									labelWidth={100}
									variant="outlined"
								>
									{this.getWindowTitleMenuItems()}
								</Field>
								<Field
									name="windowTitle"
									component={renderTextField}
									label="Window Title"
									variant="outlined"
								/>
							</div>
							{/* take up the next grid slot: */}
							<div style={{ width: 0 }} />
						</>
					)}
				</div>

				<div>
					{capture === "device" && (
						<>
							<div className={classes.dropdownContainer}>
								<Field
									name="videoDeviceDropdown"
									component={renderSelectField}
									label="Video Device Name"
									labelWidth={100}
									variant="outlined"
								>
									{this.getDshowDeviceMenuItems()}
								</Field>
								<Field
									name="videoDevice"
									component={renderTextField}
									label="Video Device Name"
									variant="outlined"
								/>
							</div>
							<div style={{ width: 0 }} />

							{/* <div className={classes.dropdownContainer}>
								<Field
									name="dshowAudioDeviceDropdown"
									component={renderSelectField}
									label="Audio Device Name"
									labelWidth={100}
									variant="outlined"
								>
									{this.getDshowDeviceMenuItems()}
								</Field>
								<Field
									name="dshowAudioDevice"
									component={renderTextField}
									label="Audio Device Name"
									variant="outlined"
								/>
							</div>
							<div style={{ width: 0 }} /> */}
						</>
					)}
				</div>

				<div>
					<div className={classes.dropdownContainer}>
						<Field
							name="audioDeviceDropdown"
							component={renderSelectField}
							label="Audio Device Name"
							variant="outlined"
							labelWidth={100}
						>
							{this.getAudioDeviceMenuItems()}
						</Field>
						<Field
							name="audioDevice"
							component={renderTextField}
							label="Audio Device Name"
							variant="outlined"
						/>
					</div>
					<div style={{ width: 0 }} />
				</div>

				<div>
					<Field name="agree" component={renderTOS} onChange={this.agreeTOS} />
				</div>
				<div className={classes.buttons}>
					<Button
						variant="contained"
						color="primary"
						type="submit"
						disabled={pristine || submitting || !this.state.TOSAgreed}
					>
						Start Streaming
					</Button>
					<Button
						variant="contained"
						color="secondary"
						onClick={this.props.onStopStreaming}
					>
						Stop Streaming
					</Button>
					<Button
						variant="contained"
						color="secondary"
						onClick={this.props.onGetSettings}
					>
						Get last used settings
					</Button>
				</div>
			</form>
		);
	}
}

// let initialValues = {
// 	host1: "https://remotegames.io",
// 	port1: 8099,
// 	width: 1280,
// 	height: 720,
// 	// windowTitle: null,
// 	resolution: 540,
// 	videoBitrate: 1,
// 	captureRate: 30,
// 	capture: "window",
// 	offsetX: 0,
// 	offsetY: 0,
// 	controllerCount: 1,
// };

// export default compose(
// 	withStyles(styles),
// 	reduxForm({
// 		form: "VideoSettingsForm", // a unique identifier for this form
// 		validate,
// 		initialValues,
// 	}),
// )(VideoSettingsForm);

const mapStateToProps = (state, ownProps) => {
	return {
		initialValues: {
			videoBitrate: ownProps.videoBitrate,
		},
	};
};

// Decorate with redux-form
let VideoSettingsForm2 = reduxForm({
	form: "VideoSettingsForm", // a unique identifier for this form
	enableReinitialize: true,
	validate,
	// initialValues,
})(VideoSettingsForm);

// Decorate with connect to read form values
const selector = formValueSelector("VideoSettingsForm"); // <-- same as form name
VideoSettingsForm2 = connect((state) => {
	const capture = selector(state, "capture");
	return {
		capture,
	};
})(VideoSettingsForm2);

export default compose(withStyles(styles))(VideoSettingsForm2);
