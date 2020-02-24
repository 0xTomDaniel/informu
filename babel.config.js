module.exports = api => {
    // This was modified to fix configurations for different build environments
    // (https://github.com/babel/minify/issues/934)
    const babelEnv = api.env();
    const plugins = [
        ["@babel/plugin-proposal-decorators", { legacy: true }],
        ["transform-inline-environment-variables"]
    ];
    if (babelEnv !== "development") {
        plugins.push([
            "transform-remove-console",
            { exclude: ["error", "warn"] }
        ]);
    }
    return {
        presets: ["module:metro-react-native-babel-preset"],
        plugins
    };
};
