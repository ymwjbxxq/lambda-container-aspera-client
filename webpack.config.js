const path = require('path');

module.exports = {
  entry: "./src/handler.ts",
  mode: "production",
  target: "node",
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },
  externals: [
    "aws-sdk/clients/s3",
  ],
  output: {
    filename: "asperaClient.js",
    path: path.resolve(__dirname, "./"),
    libraryTarget: "commonjs2",
  },
};
