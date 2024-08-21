const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/'
    },
    resolve: {
        fallback: {
            "buffer": require.resolve("buffer/"),
            "stream": require.resolve("stream-browserify"),
            "path": require.resolve("path-browserify"),
            "os": require.resolve("os-browserify/browser"),
            "crypto": require.resolve("crypto-browserify"),
            "http": require.resolve("stream-http"),
            "https": require.resolve("https-browserify"),
            "zlib": require.resolve("browserify-zlib"),
            "assert": require.resolve("assert/")
        },
        alias: {
            axios: path.resolve(__dirname, 'node_modules/axios')
        }
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
            favicon: './public/favicon.ico'
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        historyApiFallback: true,
        compress: true,
        port: 3000,
    },
    mode: process.env.NODE_ENV || 'development'
};