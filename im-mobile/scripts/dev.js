const { execSync } = require('child_process')
const path = require('path')

// Development script for IM Mobile app
const args = process.argv.slice(2)
const platform = args[0] || 'h5'

console.log(`Starting IM Mobile development server for ${platform}...`)

// Validate platform
const validPlatforms = ['h5', 'app-plus', 'mp-weixin', 'mp-alipay', 'mp-baidu', 'mp-toutiao', 'mp-qq']
if (!validPlatforms.includes(platform)) {
  console.error(`Invalid platform: ${platform}`)
  console.error(`Valid platforms: ${validPlatforms.join(', ')}`)
  process.exit(1)
}

// Set environment variables
process.env.NODE_ENV = 'development'
process.env.UNI_PLATFORM = platform

try {
  // Run uni-app dev command
  console.log('Starting uni-app development server...')

  // For H5, we can use the built-in dev server
  if (platform === 'h5') {
    execSync(`cross-env NODE_ENV=development uni`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
  }
  // For other platforms, we need to use HBuilderX
  else {
    console.log(`For ${platform} platform, please use HBuilderX to run the project.`)
    console.log('1. Open the project in HBuilderX')
    console.log('2. Select the appropriate platform')
    console.log('3. Click "Run" to start the development server')

    // You could also integrate with HBuilderX CLI if available
    // execSync(`hbuilderx --run ${platform}`, {
    //   stdio: 'inherit',
    //   cwd: path.join(__dirname, '..')
    // })
  }

} catch (error) {
  console.error('Development server failed:', error)
  process.exit(1)
}