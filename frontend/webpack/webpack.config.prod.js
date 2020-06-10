var path = require("path")
var webpack = require("webpack")
var assetsPath = path.join(__dirname, "..", "public", "assets")
var publicPath = "/assets/"
const configMerge = require('webpack-merge')
const commonConfig = require('./webpack.config.common')
const paths = require('./paths')

// This is the production configuration.
// It compiles slowly and is focused on producing a fast and minimal bundle.
// The development configuration is different and lives in a separate file.
module.exports = configMerge(commonConfig, {
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
    }
	],
  },
  resolve: {
    alias: {
      '../../theme.config$': path.resolve(paths.appSrc, 'styling/theme.config'),
      heading: path.resolve(paths.appSrc, 'styling/heading.less'),
    },
  },
	plugins: [
		new webpack.DefinePlugin({
			"process.env": {
				NODE_ENV: JSON.stringify("production")
			}
		})
	]
})
