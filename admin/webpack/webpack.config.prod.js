var path = require("path")
var webpack = require("webpack")
var assetsPath = path.join(__dirname, "..", "public", "assets")
var publicPath = "/assets/"

module.exports = {
	// The configuration for the client
	name: "browser",
	mode: 'production',
	devtool: "source-map",

	// The base directory (absolute path!) for resolving the entry option.
	context: path.join(__dirname, "..", "src", "client"),

	entry: {
		app: "./client"
	},

	output: {
		path: assetsPath,
		filename: "[name].min.js",
		publicPath: publicPath
	},

	resolve: {
		extensions: [".js", ".jsx"],
		modules: [
      path.resolve('src'),
      'node_modules',
    ],
	},

	module: {
    rules: [{
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
    }],
  },

	plugins: [
		new webpack.DefinePlugin({
			"process.env": {
				NODE_ENV: JSON.stringify("production")
			}
		})
	]
}
