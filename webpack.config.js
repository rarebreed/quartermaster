const path = require("path");
const copy = require("copy-webpack-plugin");



module.exports = {
    devtool: "source-map",
    entry: ["./src/app/index.js"],
    externals: {"cockpit": "cockpit"},
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "build"),
        sourceMapFilename: "[file].map"
    },
    devServer: {
        contentBase: "./build",
        port: 9000
    },
    plugins: [new copy([
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
    ])],
    module: {
        rules: [
            {
                exclude: /node_modules/,
                loader: 'babel-loader',
                test: /\.jsx?$/
            }
        ]
    }
}