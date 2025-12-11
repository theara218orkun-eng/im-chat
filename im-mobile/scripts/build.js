const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Build script for IM Mobile app
const args = process.argv.slice(2)
const platform = args[0] || 'h5'
const env = args[1] || 'production'

console.log(`Building IM Mobile for ${platform} in ${env} mode...`)

// Validate platform
const validPlatforms = ['h5', 'app-plus', 'mp-weixin', 'mp-alipay', 'mp-baidu', 'mp-toutiao', 'mp-qq']
if (!validPlatforms.includes(platform)) {
  console.error(`Invalid platform: ${platform}`)
  console.error(`Valid platforms: ${validPlatforms.join(', ')}`)
  process.exit(1)
}

// Set environment variables
process.env.NODE_ENV = env
process.env.UNI_PLATFORM = platform

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '../unpackage')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

try {
  // Run uni-app build command
  console.log('Running uni-app build...')
  execSync(`cross-env NODE_ENV=${env} uni build --platform ${platform}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  })

  console.log(`Build completed successfully!`)

  // Copy configuration files for different platforms
  if (platform === 'h5') {
    copyH5Assets()
  } else if (platform === 'app-plus') {
    copyAppAssets()
  }

  console.log(`Output directory: ${outputDir}`)

} catch (error) {
  console.error('Build failed:', error)
  process.exit(1)
}

function copyH5Assets() {
  console.log('Copying H5 assets...')

  const h5Dir = path.join(outputDir, 'dist', 'build', 'h5')
  if (!fs.existsSync(h5Dir)) {
    console.warn('H5 output directory not found')
    return
  }

  // Copy index.html and modify for H5
  const indexHtmlPath = path.join(h5Dir, 'index.html')
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8')

    // Add viewport meta tag for better mobile experience
    if (!htmlContent.includes('name="viewport"')) {
      htmlContent = htmlContent.replace(
        '<head>',
        `<head>
         <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
      )
    }

    // Add PWA manifest if it exists
    const manifestPath = path.join(__dirname, '../public/manifest.json')
    if (fs.existsSync(manifestPath)) {
      htmlContent = htmlContent.replace(
        '</head>',
        `<link rel="manifest" href="/manifest.json">
         </head>`
      )
    }

    fs.writeFileSync(indexHtmlPath, htmlContent)
  }

  console.log('H5 assets copied and configured')
}

function copyAppAssets() {
  console.log('Copying App assets...')

  const appDir = path.join(outputDir, 'dist', 'build', 'app-plus')
  if (!fs.existsSync(appDir)) {
    console.warn('App output directory not found')
    return
  }

  // Copy Android and iOS specific configuration
  const androidManifestPath = path.join(__dirname, '../android/AndroidManifest.xml')
  const iosInfoPath = path.join(__dirname, '../ios/Info.plist')

  if (fs.existsSync(androidManifestPath)) {
    const destPath = path.join(appDir, 'android', 'AndroidManifest.xml')
    fs.copyFileSync(androidManifestPath, destPath)
    console.log('Android manifest copied')
  }

  if (fs.existsSync(iosInfoPath)) {
    const destPath = path.join(appDir, 'ios', 'Info.plist')
    fs.copyFileSync(iosInfoPath, destPath)
    console.log('iOS Info.plist copied')
  }
}