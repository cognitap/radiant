import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  trailingSlash: true,
  agentRules: false,
  reactStrictMode: true,
  transpilePackages: ['@cognitap/radiant']
}

export default withMDX(config)
