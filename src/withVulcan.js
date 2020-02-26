module.exports = (nextConfig = {}) => {
  return Object.assign({}, nextConfig, {
    webpack: (config, options) => {
      if (!options.isServer) {
        config.resolve.mainFiles = ['index.browser', 'index.client', 'index']
      } else {
        config.resolve.mainFiles = ['index.server', 'index']
      }

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options)
      }

      return config
    }
  })
}
