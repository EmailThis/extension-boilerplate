require('babel-polyfill');
var webpack = require('webpack');
var Clean = require('clean-webpack-plugin');
var path = require("path");
var CopyWebpackPlugin = require('copy-webpack-plugin');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');

var _entryDirname = "./src/scripts" ;
var __targetDirname = "./build/" + process.env.TYPE ;
var env = process.env.TYPE


var plugins = [
    new Clean([__targetDirname+'/bundle/*.hot-update.*']),
    new UglifyJSPlugin({
        compress: {
           warnings: true
        }
    }),
    new CopyWebpackPlugin([
            { from: 'manifest.json', to: path.resolve(__targetDirname)},
            { from: './src/icons', to: path.resolve(__targetDirname + "/icons")},
            { from: './src/_locales', to: path.resolve(__targetDirname + "/_locales")},
            { from: './src/images/shared/', to: path.resolve(__targetDirname + "/images")},
            { from: './src/images/chrome', to: path.resolve(__targetDirname + "/images")},
            { from: './src/options.html', to: path.resolve(__targetDirname)},
            { from: './src/popup.html', to: path.resolve(__targetDirname)},
            { from: './src/styles', to: path.resolve(__targetDirname + "/styles")},
    ]),
];

module.exports = {
    //context: __entryDirname,
    root: path.resolve('.'),
    // devtool: 'eval',
    entry: {
        main: _entryDirname+"/popup.js",
        background: _entryDirname+"/background.js",
        contentscript: _entryDirname+"/contentscript.js",
        options: _entryDirname+"/options.js"
    },
    output: {
        path: path.resolve(__targetDirname + "/scripts"),
        filename: "[name].js"
    },
    module: {
        loaders: [
            {
                test: /\.scss$/,
                loader: "style-loader!css-loader!sass-loader",
                include: [path.resolve('./build/chrome/styles')]
            },
            {
                test: /\.styl/,
                loaders: "style-loader!css-loader!stylus-loader",
            },
            {
                test: /\.css$/,
                loader: "style-loader!css-loader",
            },
            {
                test: /.(png|woff(2)?|eot|ttf|svg)(\?[a-z0-9=\.]+)?$/,
                loader: 'url-loader?limit=100000'
            },
            {
                //tell webpack to use babel-loader for all *.jsx files
                test: /(\.js$|\.jsx$)/,
                exclude: /node_modules/,
                loaders: ['babel?cacheDirectory=./temp/']
                // ,'jsx-loader?insertPragma=React.DOM&harmony']
            }
        ]
    },
    
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    plugins: plugins
};
