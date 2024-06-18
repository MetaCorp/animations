/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.module.rules.push({
      test: /\.pug$/,
      use: [ 'babel-loader', 'pug-as-jsx-loader' ]
    })

    // Important: return the modified config
    return config
  },
}

module.exports = nextConfig
