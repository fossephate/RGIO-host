// react:
import React, { PureComponent } from "react";

import MessageList from "./MessageList.jsx";
import SendMessageForm from "./SendMessageForm.jsx";

// material ui:
import { withStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";

// libs:
import { device } from "shared/libs/utils.js";

// jss:
const styles = (theme) => ({
	root: {
		gridArea: "chat",
		display: "flex",
		flexDirection: "column",
		justifyContent: "space-between",
		flex: "1",
		padding: "5px",
		minWidth: "300px",
	},
	[device.tablet]: {
		root: {
			// position: "absolute",
			// width: "60%",
			// width: "100%",
			// padding: "5px",
		},
	},
	[device.laptop]: {
		root: {
			// position: "",
			// width: "100%",
			// padding: "5px",
		},
	},
});

// @withStyles(styles)
class Chat extends PureComponent {

	constructor(props) {
		super(props);
	}

	render() {

		const { classes } = this.props;

		if (this.props.hide) {
			return null;
		}

		return (
			<Paper id="chat" className={classes.root}>
				<MessageList/>
				<SendMessageForm/>
			</Paper>
		);
	}

}

export default withStyles(styles)(Chat);
