// react:
import React, { PureComponent } from "react";

// react-router:
import { withRouter } from "react-router";

// redux:
import { connect } from "react-redux";

// main components:
import MyAppBar from "shared/components/general/MyAppBar.jsx";

// material ui:
import { withStyles } from "@material-ui/core/styles";

// components:
import { Button, MenuItem, Menu, IconButton, Typography } from "@material-ui/core";
import { fade } from "@material-ui/core/styles/colorManipulator";

// icons:
// import {
// 	SystemUpdateAltOutlined as SystemUpdateAltOutlinedIcon,
// 	Update as UpdateIcon,
// 	More as MoreIcon,
// 	Menu as MenuIcon,
// 	Search as SearchIcon,
// 	AccountCircle,
// } from "@material-ui/icons";

import {
	SystemUpdateAltOutlined as SystemUpdateAltOutlinedIcon,
	Update as UpdateIcon,
	More as MoreIcon,
	Menu as MenuIcon,
	Search as SearchIcon,
	AccountCircle as AccountCircleIcon,
} from "@material-ui/icons";

// recompose:
import { compose } from "recompose";

// elctron ipc:
import { ipcRenderer } from "electron";
const { dialog } = require("electron");

// jss:
const styles = (theme) => ({
	root: {
		WebkitAppRegion: "drag",
		"& input, & button, & textarea": {
			WebkitAppRegion: "no-drag",
		},
		marginTop: "24px",
		"&>header": {
			top: "24px !important",
		},
	},
	grow: {
		flexGrow: 1,
	},
});

class AppBar extends PureComponent {
	constructor(props) {
		super(props);

		this.state = {
			updateAvailable: false,
			downloading: false,
		};

		this.clicked = false;
	}

	componentDidMount() {
		ipcRenderer.on("updateAvailable", (event, data) => {
			if (data && !this.clicked) {
				// ipcRenderer.send("askToUpdate");
			}

			if (data && this.clicked && !this.state.downloading) {
				this.setState({ downloading: true });
				ipcRenderer.send("downloadUpdate");
			}

			if (!data && this.clicked) {
				ipcRenderer.send("showNoUpdateMessage");
			}

			if (data) {
				this.setState({ updateAvailable: true });
			}

			this.clicked = false;
		});
	}

	componentWillUnmount() {
		ipcRenderer.removeAllListeners();
	}

	handleUpdate = () => {
		ipcRenderer.send("downloadUpdate");
	};

	handleCheckForUpdates = () => {
		this.clicked = true;
		ipcRenderer.send("checkForUpdates");
	};

	handleLoginRegister = () => {
		this.props.history.push("/login");
	};

	handleLoginRegister = () => {
		this.props.history.push("/login");
	};

	handleAccount = () => {
		this.props.history.push("/account");
	};

	render() {
		console.log("re-rendering streamsappbar.");

		const { classes } = this.props;

		if (this.props.hide) {
			return null;
		}

		const mobileMenu = (
			<div>
				<MenuItem onClick={this.handleAccount}>
					<IconButton color="inherit">
						<AccountCircleIcon />
					</IconButton>
					<p>Profile</p>
				</MenuItem>
			</div>
		);

		let main = (
			<>
				<IconButton
					className={classes.menuButton}
					color="inherit"
					aria-label="Open drawer"
					onClick={this.props.handleToggleDrawer}
				>
					<MenuIcon />
				</IconButton>
				<Typography className={classes.title} variant="h6" color="inherit" noWrap>
					Remote Games Host
				</Typography>
			</>
		);

		let desktop = (
			<>
				{this.state.updateAvailable ? (
					<IconButton onClick={this.handleUpdate} color="inherit">
						<SystemUpdateAltOutlinedIcon />
					</IconButton>
				) : (
					<IconButton onClick={this.handleCheckForUpdates} color="inherit">
						<UpdateIcon />
					</IconButton>
				)}
				<IconButton onClick={this.handleAccount} color="inherit">
					<AccountCircleIcon />
				</IconButton>
			</>
		);

		let mobile = <div></div>;

		return (
			<MyAppBar
				rootClasses={classes.root}
				main={main}
				desktop={desktop}
				mobile={mobile}
				mobileMenu={mobileMenu}
			></MyAppBar>
		);
	}
}

const mapStateToProps = (state) => {
	return {
		loggedIn: state.client.loggedIn,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {};
};

export default compose(
	withRouter,
	withStyles(styles),
	connect(mapStateToProps, mapDispatchToProps),
)(AppBar);
