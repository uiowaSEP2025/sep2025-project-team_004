const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.resolve.alias = {
    ...config.resolve.alias,
    'node:react': require.resolve('react'),
    'node:react-dom': require.resolve('react-dom'),
  };

  return config;
};
