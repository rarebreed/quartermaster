const path = require("path");
const copy = require("copy-webpack-plugin");
const Clean = require("clean-webpack-plugin");

// For testing, do export QUARTERMASTER_TESTING=true
// This will cause the files to be built
const TESTING = process.env.NODE_ENV === "testing";
const contentBase = "." //TESTING ? "./spec" : "./build";
const outpath = TESTING ? "spec" : "build";
const componentsTest = "./spec/components.test.js";
const genericTest = "./src/components/generic-view.js";
// Normally we use componentsTest for testing, but for one-offs, can choose genericTest
const entrypt = TESTING ? componentsTest : "./src/app/index.js";
const outfile = TESTING ? "test.js" : "app.js";
let cleanOptions = {
    root:     path.resolve(__dirname, ""),
    exclude:  [],
    verbose:  true,
    dry:      false,
    watch:    false
}
console.log(cleanOptions);
let pathsToClean = ["build"];
let plugins = [new Clean(pathsToClean, cleanOptions)];
//let plugins = [];

if (!TESTING) {
    plugins.unshift(new copy([
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
    ]));
}

const dbug = `=================
TESTING: ${TESTING}
contentBase: ${contentBase}
outpath: ${outpath}
componentsTest: ${componentsTest}
genericTest: ${genericTest}
entrypt: ${entrypt}
outfile: ${outfile}
plugins: ${plugins}
===================`
console.log(dbug);

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
    plugins: plugins,
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