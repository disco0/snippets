"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var webpack_1 = __importDefault(require("webpack"));
var package_json_1 = __importDefault(require("./package.json"));
var copy_webpack_plugin_1 = __importDefault(require("copy-webpack-plugin"));
var html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
var clean_webpack_plugin_1 = require("clean-webpack-plugin");
var mini_css_extract_plugin_1 = __importDefault(require("mini-css-extract-plugin"));
var AfterEmitPlugin = function (fn) { return ({
    apply: function (compiler) {
        compiler.hooks.afterEmit.tap("AfterEmitPlugin", fn);
    }
}); };
var buildManifest = function () {
    var name = package_json_1.default.name, description = package_json_1.default.description, version = package_json_1.default.version;
    var manifest = Object.assign(require("./src/manifest.json"), {
        name: name,
        description: description,
        version: version
    });
    fs_1.default.writeFileSync("build/manifest.json", JSON.stringify(manifest, null, 2));
};
var html = [
    new html_webpack_plugin_1.default({
        chunks: ["panel"],
        filename: "panel.html",
        title: "Snippets",
        template: "./src/panel.html"
    }),
    new html_webpack_plugin_1.default({
        chunks: ["devtools"],
        filename: "devtools.html",
        title: "Snippets"
    })
];
var devServerHtml = [
    new html_webpack_plugin_1.default({
        template: "./src/panel.html",
        chunks: ["test"],
        filename: "index.html"
    })
];
var extractCssLoader = {
    loader: mini_css_extract_plugin_1.default.loader,
    options: { hmr: false }
};
var config = function (env, args) {
    var isDevServer = env && env.devServer;
    var isProduction = args.mode === "production";
    var entry = isDevServer
        ? { test: "./src/test.js" }
        : {
            background: "./src/background.js",
            devtools: "./src/devtools.js",
            panel: "./src/panel.js"
        };
    return {
        mode: args.mode || "development",
        devtool: isProduction ? false : "cheap-module-eval-source-map",
        entry: entry,
        output: {
            path: path_1.default.resolve(__dirname, "build")
        },
        module: {
            strictExportPresence: true,
            rules: [
                {
                    oneOf: [
                        {
                            test: /\.styl$/,
                            use: ['style-loader', 'css-loader', 'stylus-native-loader'],
                        },
                        {
                            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                            loader: "url-loader",
                            options: {
                                limit: 10000,
                                fallback: "file-loader",
                                name: "[name].[ext]"
                            }
                        },
                        {
                            test: /\.(js|jsx)$/,
                            loader: "babel-loader",
                            options: { cacheDirectory: true }
                        },
                        {
                            test: /\.css$/,
                            use: [
                                isProduction ? extractCssLoader : "style-loader",
                                "css-loader"
                            ]
                        },
                        {
                            test: /\.(ttf|eot|woff|woff2)$/,
                            loader: "file-loader",
                            options: { name: "fonts/[name].[ext]" }
                        },
                        {
                            // Exclude a few other extensions so they get processed by Webpack's
                            // internal loaders.
                            exclude: [/\.js$/, /\.html$/, /\.json$/, /\.ejs$/],
                            loader: "file-loader",
                            options: { name: "[name].[ext]" }
                        }
                    ]
                }
            ]
        },
        plugins: __spreadArrays([
            new webpack_1.default.DefinePlugin({
                SNIPPETS_VERSION: JSON.stringify(package_json_1.default.version),
                "process.env.NODE_ENV": JSON.stringify(args.mode || "development")
            }),
            new clean_webpack_plugin_1.CleanWebpackPlugin({ verbose: true }),
            new copy_webpack_plugin_1.default({
                patterns: [{ from: "static", to: "./" }]
            }),
            AfterEmitPlugin(buildManifest),
            isProduction && new mini_css_extract_plugin_1.default()
        ], (isDevServer ? devServerHtml : html)).filter(Boolean),
        optimization: {
            //// Until stylus loading is worked out
            // minimize: isProduction
            minimize: false
        },
        performance: {
            hints: false
        }
    };
};
exports.default = config;
