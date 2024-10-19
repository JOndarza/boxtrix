/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    entry: './src/api/indexes/api.ts',
    output: {
        path: path.resolve(__dirname, '../dist/api'),
    }
});