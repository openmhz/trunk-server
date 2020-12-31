var path = require("path")
var webpack = require("webpack")
var assetsPath = path.join(__dirname, "..", "public", "assets")
var publicPath = "/assets/"
const paths = require('./paths')
const autoprefixer = require('autoprefixer')
const isDev = process.env.NODE_ENV === 'development'
// Some apps do not use client-side routing with pushState.
// For these, "homepage" can be set to "." to enable relative asset paths.
const shouldUseRelativeAssetPaths = paths.servedPath === './'
// Note: defined here because it will be used more than once.
const cssFilename = 'static/css/[name].[contenthash:8].css'
const cssClassName = isDev ? '[path][name]__[local]--[hash:base64:5]' : '[hash:base64:5]'
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const extractLess = new ExtractTextPlugin({
  filename: cssFilename,
  disable: true
})

// Options for autoPrefixer
const autoprefixerOptions = {
  browsers: [
    '>1%',
    'last 4 versions',
    'Firefox ESR',
    'not ie < 9', // React doesn't support IE8 anyway
  ],
  flexbox: 'no-2009',
}

// ExtractTextPlugin expects the build output to be flat.
// (See https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/27)
// However, our output is structured with css, js and media folders.
// To have this structure working with relative paths, we have to use custom options.
const extractTextPluginOptions = shouldUseRelativeAssetPaths
  ? // Making sure that the publicPath goes back to to build folder.
  { publicPath: Array(cssFilename.split('/').length).join('../') }
  : {}
// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.NODE_ENV === 'production' && process.env.GENERATE_SOURCEMAP !== 'false'



module.exports = {

	module: {
		rules: [{
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
    },
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
		extractLess
	]
}
