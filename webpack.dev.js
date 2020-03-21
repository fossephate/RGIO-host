// webpack.dev.js
const merge = require("webpack-merge");
const common = require("./webpack.common.js");
module.exports = merge(common, {
// import merge from "webpack-merge";
// import common from "./webpack.common.mjs";
// export default merge(common, {
	mode: "development",
	devtool: "source-map",
});
