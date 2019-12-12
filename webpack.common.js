// webpack.common.js
const path = require("path");
module.exports = {
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
		publicPath: __dirname + "/bundles/",
	},
	optimization: {
		splitChunks: {
			chunks: "async", // all, async, and initial
		},
	},
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
		],
	},
	externals: [
		(() => {
			var IGNORES = ["electron", "child_process"];
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
			src: path.resolve(__dirname, "src/"),
		},
	},
	node: {
		fs: "empty",
	},
};
