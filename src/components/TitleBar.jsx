// react:
import React, { PureComponent } from "react";

// material ui:
import { withStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";

// jss:
const styles = (theme) => ({
	root: {
		display: "block",
		position: "fixed",
		// position: "relative",
		height: "24px",
		// width: "calc(100% - 2px)", // Compensate for body 1px border
		width: "100%",
		background: "#1f1f1f",
		padding: "4px",
		zIndex: 1310,
		marginTop: "-24px",
	},
	draggableRegion: {
		width: "100%",
		height: "100%",
		WebkitAppRegion: "drag",
		display: "grid",
		gridTemplateColumns: "auto 138px",
	},
	windowControls: {
		display: "grid",
		gridTemplateColumns: "repeat(3, 46px)",
		position: "absolute",
		top: "0",
		right: "0",
		height: "100%",
		fontFamily: '"Segoe MDL2 Assets"',
		fontSize: "10px",
		WebkitAppRegion: "no-drag",
		"& #min-button": {
			gridColumn: "1",
		},
		"& #max-button, & #restore-button": {
			gridColumn: "2",
		},
		"& #close-button": {
			gridColumn: "3",
		},
		"& .button": {
			gridRow: "1 / span 1",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			width: "100%",
			height: "100%",
			// separate:
			userSelect: "none",
			cursor: "default",
			color: "#BBB",
		},
		"& .button:hover": {
			background: "rgba(255,255,255,0.2)",
			color: "#FFF",
		},
		"& #close-button:hover": {
			background: "#E81123",
		},
		"& #restore-button": {
			display: "none",
		},
	},
	windowTitle: {
		gridColumn: "1",
		display: "flex",
		alignItems: "center",
		fontFamily: '"Segoe UI", sans-serif',
		fontSize: "12px",
		marginLeft: "8px",
		overflowX: "hidden",
		"& span": {
			overflow: "hidden",
			textOverflow: "ellipsis",
			lineHeight: "1.5",
		},
	},
});

class TitleBar extends PureComponent {
	constructor(props) {
		super(props);
	}

	render() {
		const { classes } = this.props;

		return (
			<div className={classes.root}>
				<div className={classes.draggableRegion}>
					<div id="window-title" className={classes.windowTitle}>
						<span />
					</div>
				</div>
				<div className={classes.windowControls}>
					<div className="button" id="min-button">
						<span>&#xE921;</span>
					</div>
					<div className="button" id="max-button">
						<span>&#xE922;</span>
					</div>
					<div className="button" id="restore-button">
						<span>&#xE923;</span>
					</div>
					<div className="button" id="close-button" onClick={this.props.handleClose}>
						<span>&#xE8BB;</span>
					</div>
				</div>
			</div>
		);
	}
}

export default withStyles(styles)(TitleBar);
