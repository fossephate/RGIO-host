const loaderUtils = require("loader-utils");

module.exports = function (content) {
	this.resourcePath = `..\\node_modules${this.resourcePath.split("node_modules")[1]}`;
	requirePath = this.resourcePath;
	console.log(`\n${this.resourcePath}`);

	if (typeof this.emitFile === "function") {
	// this.emitFile(name, content, false);
	this.addDependency(this.resourcePath);
	} else {
	throw new Error('emitFile function is not available');
	}
	return `module.exports = __non_webpack_require__(${loaderUtils.stringifyRequest(this, requirePath)});`
}
module.exports.raw = true
