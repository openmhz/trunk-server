var path = require("path")
var webpack = require("webpack")
var assetsPath = path.join(__dirname, "..", "public", "assets")
var publicPath = "/assets/"
const configMerge = require('webpack-merge')
const commonConfig = require('./webpack.config.common')

const paths = require('./paths')

// This is the development configuration.
// It is focused on developer experience and fast rebuilds.
// The production configuration is different and lives in a separate file.
module.exports = configMerge(commonConfig, {
	name: "browser",
	mode: 'development',
	devtool: "eval-source-map",

	// The base directory (absolute path!) for resolving the entry option.
	context: path.join(__dirname, "..", "src", "client"),

	entry: {
		app: [
			"./client",
			"webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true"
		]
	},

	output: {
		path: assetsPath,
		filename: "[name].js",
		publicPath: publicPath
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
		extensions: [".js", ".jsx"],
		modules: [
      path.resolve('src'),
      'node_modules',
    ],
	},

	plugins: [
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoEmitOnErrorsPlugin(),
		new webpack.DefinePlugin({
			"process.env": {
				NODE_ENV: JSON.stringify("development")
			}
		})
	]
})
