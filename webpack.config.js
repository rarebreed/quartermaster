const path = require("path");
const copy = require("copy-webpack-plugin");
const Clean = require("clean-webpack-plugin");

// For testing, do export NODE_ENV=true
// This will cause the files to be built
const TESTING = process.env.NODE_ENV === "testing";
const contentBase = "." //TESTING ? "./test" : "./build";
const outpath = TESTING ? "test" : "build";
const componentsTest = "./test/spec/components.test.js";
const genericTest = "./src/components/generic-view.js";
// Normally we use componentsTest for testing, but for one-offs, can choose genericTest
const entrypt = TESTING ? componentsTest : "./src/app/index.js";
const outfile = TESTING ? "spec/test.js" : "app.js";

// Clean up the build files
let cleanOptions = {
    root:     path.resolve(__dirname, ""),
    exclude:  TESTING ? ["components.test.js"] : [],
    verbose:  true,
    dry:      false,
    watch:    false
}
console.log(cleanOptions);
let pathsToClean = TESTING ? ["test/spec"] : ["build"];
let plugins = [new Clean(pathsToClean, cleanOptions)];

// If we're in production mode, copy these files to build which is where the plugin will link to
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
        }
    ]));
}

// Use the standalone jasmine files, and copy them to the test dir
plugins.push(new copy([
        {
            from: './jasmine/lib/jasmine-2.8.0/jasmine.css',
            to: "jasmine/jasmine.css"
        },
        {
            from: './jasmine/lib/jasmine-2.8.0/jasmine.js',
            to: "jasmine/jasmine.js"
        },
        {
            from: './jasmine/lib/jasmine-2.8.0/jasmine-html.js',
            to: "jasmine/jasmine-html.js"
        },
        {
            from: './jasmine/lib/jasmine-2.8.0/boot.js',
            to: "jasmine/boot.js"
        },
        {
            from: "./styles/quartermaster.css"
        }
]))


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
    externals: {"cockpit": "cockpit", "jasmine": "jasmine"},
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