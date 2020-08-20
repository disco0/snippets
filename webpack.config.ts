import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import type { Compiler, Configuration } from 'webpack'
import package_ from'./package.json'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'


const AfterEmitPlugin = (fn: () => void) => ({
  apply: (compiler: Compiler) => {
    compiler.hooks.afterEmit.tap("AfterEmitPlugin", fn);
  }
});

const buildManifest = () => {
  const { name, description, version } = package_;
  const manifest = Object.assign(require("./src/manifest.json"), {
    name,
    description,
    version
  });
  fs.writeFileSync("build/manifest.json", JSON.stringify(manifest, null, 2));
};

const html = [
  new HtmlWebpackPlugin({
    chunks: ["panel"],
    filename: "panel.html",
    title: "Snippets",
    template: "./src/panel.html"
  }),
  new HtmlWebpackPlugin({
    chunks: ["devtools"],
    filename: "devtools.html",
    title: "Snippets"
  })
];

const devServerHtml = [
  new HtmlWebpackPlugin({
    template: "./src/panel.html",
    chunks: ["test"],
    filename: "index.html"
  })
];

const extractCssLoader = {
  loader: MiniCssExtractPlugin.loader,
  options: { hmr: false }
};



const config = (env, args: webpack.CliConfigOptions): Configuration => {
  const isDevServer = env && env.devServer;
  const isProduction = args.mode === "production";
  const entry = isDevServer
    ? { test: "./src/test.js" }
    : {
        background: "./src/background.js",
        devtools: "./src/devtools.js",
        panel: "./src/panel.js"
      };

  return {
    mode: args.mode || "development",

    devtool: isProduction ? false : "cheap-module-eval-source-map",

    entry,

    output: {
      path: path.resolve(__dirname, "build")
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

    plugins: [
      new webpack.DefinePlugin({
        SNIPPETS_VERSION: JSON.stringify(package_.version),
        "process.env.NODE_ENV": JSON.stringify(args.mode || "development")
      }),
      new CleanWebpackPlugin({verbose: true}),
      new CopyWebpackPlugin({
        patterns: [ { from: "static", to: "./" } ]
      }),
      AfterEmitPlugin(buildManifest),
      isProduction && new MiniCssExtractPlugin(),
      ...(isDevServer ? devServerHtml : html)
    ].filter(Boolean),

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

export default config