// react:
import React, { PureComponent } from "react";
import ReactDOM from "react-dom";

// react-router:
import { Router, Route, Switch, withRouter } from "react-router";

// redux:
import { connect } from "react-redux";

// main components:

// material ui:
import { withStyles } from "@material-ui/core/styles";

// components:
import AppBar from "@material-ui/core/AppBar";
import MenuItem from "@material-ui/core/MenuItem";
import Menu from "@material-ui/core/Menu";
import { fade } from "@material-ui/core/styles/colorManipulator";
import MenuIcon from "@material-ui/icons/Menu";
import AccountCircle from "@material-ui/icons/AccountCircle";
import MailIcon from "@material-ui/icons/Mail";
import MoreIcon from "@material-ui/icons/MoreVert";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Badge from "@material-ui/core/Badge";
import Typography from "@material-ui/core/Typography";

// recompose:
import { compose } from "recompose";

// device sizes:
import { device } from "src/constants/DeviceSizes.js";

// libs:
// import classNames from "classnames";

// jss:
const styles = (theme) => ({
	root: {
		width: "100%",
		height: "48px",
		zIndex: 1100,
		WebkitAppRegion: "drag",
		"& input, & button, & textarea": {
			WebkitAppRegion: "no-drag",
		},
		marginTop: "24px",
		// position: "fixed",
		// "& h1, & h2, & h3, & h4, & h5, & h6": {
		// 	WebkitUserSelect: "none",
		// },
		"&>header": {
			top: "24px !important",
		},
	},
	[device.mobile]: {
		root: {},
	},
	[device.tablet]: {
		root: {},
	},
	[device.laptop]: {
		root: {},
	},
	grow: {
		flexGrow: 1,
	},
	menuButton: {
		marginLeft: -12,
		marginRight: 20,
	},
	title: {
		display: "none",
		[theme.breakpoints.up("sm")]: {
			display: "block",
		},
		cursor: "pointer",
	},
	search: {
		position: "relative",
		borderRadius: theme.shape.borderRadius,
		backgroundColor: fade(theme.palette.common.white, 0.15),
		"&:hover": {
			backgroundColor: fade(theme.palette.common.white, 0.25),
		},
		marginRight: theme.spacing(2),
		marginLeft: 0,
		width: "100%",
		[theme.breakpoints.up("sm")]: {
			marginLeft: theme.spacing(3),
			width: "auto",
		},
	},
	searchIcon: {
		width: theme.spacing(9),
		height: "100%",
		position: "absolute",
		pointerEvents: "none",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
	inputRoot: {
		color: "inherit",
		width: "100%",
	},
	inputInput: {
		paddingTop: theme.spacing(1),
		paddingRight: theme.spacing(1),
		paddingBottom: theme.spacing(1),
		paddingLeft: theme.spacing(10),
		transition: theme.transitions.create("width"),
		width: "100%",
		[theme.breakpoints.up("md")]: {
			width: 200,
		},
	},
	sectionDesktop: {
		display: "none",
		[theme.breakpoints.up("md")]: {
			display: "flex",
		},
	},
	sectionMobile: {
		display: "flex",
		[theme.breakpoints.up("md")]: {
			display: "none",
		},
	},
});

class MyAppBar extends PureComponent {
	constructor(props) {
		super(props);

		this.state = {
			anchorEl: null,
			mobileMoreAnchorEl: null,
		};
	}

	componentDidMount() {}

	handleLoginRegister = () => {
		this.props.history.push("/login");
	};

	handleProfileMenuOpen = (event) => {
		this.setState({ anchorEl: event.currentTarget });
	};

	handleMenuClose = () => {
		this.setState({ anchorEl: null });
		this.handleMobileMenuClose();
	};

	handleMobileMenuOpen = (event) => {
		this.setState({ mobileMoreAnchorEl: event.currentTarget });
	};

	handleMobileMenuClose = () => {
		this.setState({ mobileMoreAnchorEl: null });
	};

	render() {
		console.log("re-rendering myappbar.");

		const { anchorEl, mobileMoreAnchorEl } = this.state;
		const { classes } = this.props;
		const isMenuOpen = Boolean(anchorEl);
		const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

		const renderMenu = (
			<Menu
				anchorEl={anchorEl}
				anchorOrigin={{ vertical: "top", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				open={isMenuOpen}
				onClose={this.handleMenuClose}
			>
				{/* <MenuItem
					onClick={() => {
						this.handleMenuClose();
					}}
				>
					Profile
				</MenuItem> */}
				<MenuItem
					onClick={() => {
						this.handleMenuClose();
						this.props.history.push("/account");
					}}
				>
					My account
				</MenuItem>
			</Menu>
		);

		const renderMobileMenu = (
			<Menu
				anchorEl={mobileMoreAnchorEl}
				anchorOrigin={{ vertical: "top", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				open={isMobileMenuOpen}
				onClose={this.handleMenuClose}
			>
				<MenuItem onClick={this.handleMobileMenuClose}>
					<IconButton color="inherit">
						<Badge badgeContent={0} color="secondary">
							<MailIcon />
						</Badge>
					</IconButton>
					<p>Messages</p>
				</MenuItem>
				{/* <MenuItem onClick={this.handleMobileMenuClose}>
					<IconButton color="inherit">
						<Badge badgeContent={0} color="secondary">
							<NotificationsIcon />
						</Badge>
					</IconButton>
					<p>Notifications</p>
				</MenuItem> */}
				<MenuItem onClick={this.handleProfileMenuOpen}>
					<IconButton color="inherit">
						<AccountCircle />
					</IconButton>
					<p>Profile</p>
				</MenuItem>
			</Menu>
		);

		return (
			<div className={classes.root}>
				<AppBar position="fixed">
					<Toolbar variant="dense">
						<IconButton
							className={classes.menuButton}
							color="inherit"
							aria-label="Open drawer"
							onClick={this.props.handleToggleDrawer}
						>
							<MenuIcon />
						</IconButton>
						<Typography
							className={classes.title}
							variant="h6"
							color="inherit"
							noWrap
							onClick={() => {
								this.props.history.push("/");
							}}
						>
							{/* <Button color="inherit" > */}
							Remote Games Host
							{/* </Button> */}
						</Typography>
						{/* <div className={classes.search}>
							<div className={classes.searchIcon}>
								<SearchIcon />
							</div>
							<InputBase
								placeholder="Search…"
								classes={{
									root: classes.inputRoot,
									input: classes.inputInput,
								}}
							/>
						</div> */}
						<div className={classes.grow} />
						{/* <Button
							color="default"
							onClick={() => {
								window.location.href = "https://discord.io/remotegames/";
							}}
						>
							Discord Server
						</Button> */}
						{this.props.loggedIn && (
							<>
								<div className={classes.sectionDesktop}>
									<IconButton color="inherit">
										<Badge badgeContent={0} color="secondary">
											<MailIcon />
										</Badge>
									</IconButton>
									{/* <IconButton color="inherit">
										<Badge badgeContent={0} color="secondary">
											<NotificationsIcon />
										</Badge>
									</IconButton> */}
									<IconButton
										aria-owns={isMenuOpen ? "material-appbar" : undefined}
										aria-haspopup="true"
										onClick={this.handleProfileMenuOpen}
										color="inherit"
									>
										<AccountCircle />
									</IconButton>
								</div>
								<div className={classes.sectionMobile}>
									<IconButton
										aria-haspopup="true"
										onClick={this.handleMobileMenuOpen}
										color="inherit"
									>
										<MoreIcon />
									</IconButton>
								</div>
							</>
						)}
					</Toolbar>
				</AppBar>
				{renderMenu}
				{renderMobileMenu}
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	return {
		loggedIn: state.clientInfo.loggedIn,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {};
};

export default compose(
	withRouter,
	withStyles(styles),
	connect(
		mapStateToProps,
		mapDispatchToProps,
	),
)(MyAppBar);
