const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const webpack = require('webpack');
const dotenv = require('dotenv');
const path = require('path');

const env = dotenv.config().parsed || {};

const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = config => {
  config.plugins.push(new webpack.DefinePlugin(envKeys));

  if (process.env.ANALYZE === 'true') {
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: '../bundle-report.html',
        statsFilename: '../bundle-stats.json',
        generateStatsFile: true,
        openAnalyzer: false,
        logLevel: 'info',
      })
    );
  }

  return config;
};
