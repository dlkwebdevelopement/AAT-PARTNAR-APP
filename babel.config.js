module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      'module:react-native-dotenv',
      '@babel/plugin-proposal-optional-chaining',
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@src": "./src",
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@utils": "./src/utils",
            "@assets": "./src/assets",
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
