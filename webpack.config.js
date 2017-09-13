const path = require("path");
const copy = require("copy-webpack-plugin");

// For testing, do export QUARTERMASTER_TESTING=true
// This will cause the files to be built
const TESTING = process.env.NODE_ENV === "testing";
const contentBase = TESTING ? "./spec" : "./build";
const outpath = "build";  //TESTING ? "spec" : "build";
const componentsTest = "./spec/components.test.js";
const genericTest = "./src/components/generic-view.js";
const entrypt = TESTING ? genericTest : "./src/app/index.js";
const outfile = TESTING ? "test.js" : "app.js";
let copied = [];
if (!TESTING) {
    copied = [new copy([
        {
            from: "./src/app/index.html",
        },
        {
            from: "./src/app/manifest.json",
        },
        {
            from: "./src/app/subscriptions.css",
        },
        {
            from: './node_modules/jasmine-core/lib/jasmine-core/jasmine.css',
            to: "../jasmine/jasmine.css"
        },
        {
            from: './node_modules/jasmine-core/lib/jasmine-core/jasmine.js',
            to: "../jasmine/jasmine.js"
        },
        {
            from: './node_modules/jasmine-core/lib/jasmine-core/jasmine-html.js',
            to: "../jasmine/jasmine-html.js"
        },
        {
            from: './node_modules/jasmine-core/lib/jasmine-core/boot.js',
            to: "../jasmine/boot.js"
        }
    ])];
}

module.exports = {
    devtool: "source-map",
    entry: [ entrypt ],
    externals: {"cockpit": "cockpit"},
    output: {
        filename: outfile,
        path: path.resolve(__dirname, outpath),
        sourceMapFilename: "[file].map"
    },
    devServer: {
        contentBase: contentBase,
        port: 9000
    },
    plugins: copied,
    module: {
        rules: [
            {
                exclude: /node_modules/,
                loader: 'babel-loader',
                test: /\.jsx?$/
            },
            {
                exclude: /node_modules/,
                loader: 'style-loader!css-loader',
                test: /\.css$/
            }
        ]
    }
}