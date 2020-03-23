// webpack.common.js
const path = require("path");
const webpack = require("webpack");
module.exports = {
	// import path from "path";
	// import webpack from "webpack";
	// export default {
	entry: {
		index: "./src/Index.jsx",
		// hostControl: "./hostControl/hostControl.js",
	},
	output: {
		// `filename` provides a template for naming your bundles (remember to use `[name]`)
		filename: "[name].bundle.js",
		// `chunkFilename` provides a template for naming code-split bundles (optional)
		chunkFilename: "[name].bundle.js",
		// `path` is the folder where Webpack will place your bundles
		path: __dirname + "/bundles/",
		// `publicPath` is where Webpack will load your bundles from (optional)
		// publicPath: __dirname + "/bundles/",
	},
	target: "electron-main", // 02/28/20
	// target: "electron-renderer",// 02/28/20
	// target: "node",// 02/28/20
	optimization: {
		splitChunks: {
			chunks: "async", // all, async, and initial
		},
	},
	plugins: [
		new webpack.DefinePlugin({
			APPLICATION_VERSION: JSON.stringify(require("./package.json").version),
		}),
	],
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				loader: "babel-loader",
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
			{
				test: /\.node$/,
				use: "node-loader",
			},
			// {
			// 	test: /\.node$/,
			// 	// use: "node-loader",
			// 	use: [
			// 		{
			// 			loader: "native-addon-loader",
			// 			options: {
			// 				name: "[name].[ext]", // default: '[name].[ext]'
			// 				from: ".", // default: '.'
			// 			},
			// 		},
			// 	],
			// },
		],
	},
	externals: [
		(() => {
			let IGNORES = ["electron", "child_process", "constants"];
			return (context, request, callback) => {
				if (IGNORES.indexOf(request) >= 0) {
					return callback(null, "require('" + request + "')");
				}
				return callback();
			};
		})(),
	],
	// 	modules: [path.resolve(__dirname, "app"), "node_modules"],
	resolve: {
		alias: {
			libs: path.resolve(__dirname, "src/libs/"),
			components: path.resolve(__dirname, "src/components/"),
			actions: path.resolve(__dirname, "src/actions/"),
			sockets: path.resolve(__dirname, "src/sockets/"),
			sagas: path.resolve(__dirname, "src/sagas/"),
			reducers: path.resolve(__dirname, "src/reducers/"),
			constants: path.resolve(__dirname, "src/constants/"),
			shared: path.resolve(__dirname, "src/shared/"),
			src: path.resolve(__dirname, "src/"),
		},
	},
	node: {
		fs: "empty",
	},
};
