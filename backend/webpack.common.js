// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pathsPlugin = require('tsconfig-paths-webpack-plugin');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Dotenv = require('dotenv-webpack');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TerserPlugin = require('terser-webpack-plugin');

const {
    NODE_ENV = 'production',
} = process.env;

module.exports = {
    entry: './src/api/indexes/api.ts',
    mode: NODE_ENV,
    target: 'node',
    watch: NODE_ENV === 'development',
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, '../dist/api'),
        clean: true,
    },
    resolve: {
        extensions: ['.ts', '.js'],
        plugins: [
            new pathsPlugin({ baseUrl: './src' })
        ],
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
        minimize: true,
        minimizer: [new TerserPlugin({
            test: /\.ts$/,
            parallel: true,
            terserOptions: {
                compress: true,
                keep_classnames: true,
                keep_fnames: true,
            },
        })],
    },
    plugins: [
        new Dotenv({ systemvars: true })
    ],
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    'ts-loader'
                ]
            }
        ]
    }
};

