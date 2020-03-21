// webpack.prod.js
const merge = require("webpack-merge");
const common = require("./webpack.common.js");
module.exports = merge(common, {
// import merge from "webpack-merge";
// import common from "./webpack.common.js";
// export default merge(common, {
	mode: "production",
	optimization: {
		minimize: true,
		usedExports: true,
	},
});
