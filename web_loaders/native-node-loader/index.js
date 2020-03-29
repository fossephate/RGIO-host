// const loaderUtils = require("loader-utils");

// module.exports = (content) => {
// 	let resourcePath = `..\\node_modules${this.resourcePath.split("node_modules")[1]}`;
// 	let requirePath = resourcePath;
// 	console.log(`@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\n`);
// 	console.log(`\n${this.resourcePath}`);

// 	if (typeof this.emitFile === "function") {
// 		// this.emitFile(name, content, false);
// 		this.addDependency(this.resourcePath);
// 	} else {
// 		throw new Error('emitFile function is not available');
// 	}
// 	return `module.exports = __non_webpack_require__(${loaderUtils.stringifyRequest(this, requirePath)});`
// };
// module.exports.raw = true

// const loaderUtils = require("loader-utils");
// const path = require("path");

module.exports = function(content) {
	// const loaderOptions = loaderUtils.getOptions(this) || {};
	// console.log(`\n${this.resourcePath}\n`);
	// const from = ".";
	// const name = loaderUtils.interpolateName(this, "[name].[ext]", {
	// 	content,
	// 	context:
	// 		loaderOptions.context || this.rootContext || (this.config && this.config.context),
	// });

	// let from = ".";
	// let name = "robotjs.node";
	// // resourcePath: "C:\.....\node_modules\robotjs\build\Release\robotjs.node"

	// let requirePath = path.posix.relative(from, name);
	// console.log(`rqPath: ${requirePath}`);
	// if (requirePath[0] !== ".") {
	// 	requirePath = "./" + requirePath;
	// }
	// console.log(`\nrsPath: ${this.resourcePath}`);

	let results = /node_modules[/\\](.+[/\\])(.+\..+)/.exec(this.resourcePath);
	// let fileName = results[2];
	// let resourcePath = `./${fileName}`;
	let resourcePath = `${results[1]}${results[2]}`;
	resourcePath = resourcePath.replace(/\\/g, "/");

	// console.log(`\nrp: ${resourcePath}`);
	// console.log(`rsPath: ${resourcePath}`);
	// console.log(`rContext: ${this.rootContext}`);
	// console.log(`wt: ${loaderUtils.stringifyRequest(this, requirePath)}`);

	if (typeof this.emitFile === "function") {
		// this.emitFile(fileName, content, false);
		// this.addDependency(resourcePath);
	} else {
		throw new Error("emitFile function is not available");
	}

	return `module.exports = __non_webpack_require__(\"${resourcePath}\");`;
};

module.exports.raw = true;
