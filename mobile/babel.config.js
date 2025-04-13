module.exports = {
  presets: ["babel-preset-expo"],
  plugins: [
    "expo-router/babel",
    [
      "module-resolver",
      {
        alias: {
          "react-native-maps": "./src/stubs/react-native-maps-web.js"
        },
        extensions: [".web.js", ".js", ".jsx", ".ts", ".tsx", ".json"]
      }
    ]
  ]
};


