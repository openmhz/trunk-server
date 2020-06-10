var path = require("path")
var webpack = require("webpack")
var assetsPath = path.join(__dirname, "..", "public", "assets")
var publicPath = "/assets/"

module.exports = {
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
		},
		{
			test:/\.css$/,
			use:['style-loader','css-loader']

}, 
		// "postcss" loader applies autoprefixer to our LESS.
		// "css" loader resolves paths in CSS and adds assets as dependencies.
		// "style" loader turns CSS into JS modules that inject <style> tags.
		// In production, we use a plugin to extract that CSS to a file, but
		// in development "style" loader enables hot editing of CSS.
		{
			test: /\.less$/,
			exclude: [
				path.resolve(paths.appSrc, 'components'),
			],
			use: extractLess.extract({
				fallback: {
					loader: 'style-loader',
					options: {
						hmr: isDev,
					},
				},
				use: [
					{
						loader: require.resolve('css-loader'),
						options: {
							importLoaders: 1,
							minimize: process.env.NODE_ENV === 'production',
							sourceMap: shouldUseSourceMap,
						},
					},
					{
						loader: require.resolve('postcss-loader'),
						options: {
							// Necessary for external CSS imports to work
							// https://github.com/facebookincubator/create-react-app/issues/2677
							ident: 'postcss',
							plugins: () => [
								require('postcss-flexbugs-fixes'),
								autoprefixer(autoprefixerOptions),
							],
						},
					},
					{ loader: require.resolve('less-loader') }
				],
				...extractTextPluginOptions,
			}),
		},
		// Heads up!
		// We apply CSS modules only to our components, this allow to use them
		// and don't break SUI.
		{
			test: /\.less$/,
			include: [
				path.resolve(paths.appSrc, 'components', 'styling'),
			],
			use: extractLess.extract({
				fallback: {
					loader: require.resolve('style-loader'),
					options: {
						hmr: isDev,
					},
				},
				use: [
					{
						loader: require.resolve('css-loader'),
						options: {
							importLoaders: 1,
							localIdentName: cssClassName,
							modules: true,
							minimize: process.env.NODE_ENV === 'production',
							sourceMap: shouldUseSourceMap,
						},
					},
					{
						loader: require.resolve('postcss-loader'),
						options: {
							// Necessary for external CSS imports to work
							// https://github.com/facebookincubator/create-react-app/issues/2677
							ident: 'postcss',
							plugins: () => [
								require('postcss-flexbugs-fixes'),
								autoprefixer(autoprefixerOptions),
							],
						},
					},
					{ loader: require.resolve('less-loader') }
				],
			}),
		},

// "url" loader works like "file" loader except that it embeds assets
// smaller than specified limit in bytes as data URLs to avoid requests.
// A missing `test` is equivalent to a match.
{
	test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
	loader: require.resolve('url-loader'),
	options: {
		limit: 10000,
		name: 'static/media/[name].[hash:8].[ext]',
	},
},
// "file" loader makes sure assets end up in the `build` folder.
// When you `import` an asset, you get its filename.
{
	test: [/\.eot$/, /\.ttf$/, /\.svg$/, /\.woff$/, /\.woff2$/],
	loader: require.resolve('file-loader'),
	options: {
		name: '/static/media/[name].[hash:8].[ext]',
	},
}
],
		
  },

	resolve: {
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
}
