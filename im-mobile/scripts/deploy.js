const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const axios = require('axios')

// Deployment script for IM Mobile app
const args = process.argv.slice(2)
const platform = args[0] || 'h5'
const env = args[1] || 'production'
const target = args[2] || 'local'

console.log(`Deploying IM Mobile ${platform} to ${target} in ${env} mode...`)

// Configuration
const config = {
  local: {
    h5: {
      destination: '/var/www/im-mobile-h5',
      host: 'localhost',
      user: 'deploy',
      port: 22
    },
    app: {
      destination: '/var/www/im-mobile-app',
      host: 'localhost',
      user: 'deploy',
      port: 22
    }
  },
  staging: {
    h5: {
      destination: '/var/www/staging/im-mobile-h5',
      host: 'staging.example.com',
      user: 'deploy',
      port: 22
    }
  },
  production: {
    h5: {
      destination: '/var/www/production/im-mobile-h5',
      host: 'production.example.com',
      user: 'deploy',
      port: 22
    },
    app: {
      destination: '/var/www/production/im-mobile-app',
      host: 'production.example.com',
      user: 'deploy',
      port: 22
    }
  }
}

async function deploy() {
  try {
    // First build the project
    console.log('Building project...')
    execSync(`node ${path.join(__dirname, 'build.js')} ${platform} ${env}`, {
      stdio: 'inherit',
      cwd: __dirname
    })

    const buildConfig = config[target]?.[platform]
    if (!buildConfig) {
      console.error(`No deployment configuration found for ${target}.${platform}`)
      process.exit(1)
    }

    console.log(`Deploying to ${buildConfig.host}:${buildConfig.destination}`)

    // For local deployment, just copy files
    if (target === 'local') {
      await deployLocal(buildConfig)
    }
    // For remote deployment, use SCP or other methods
    else {
      await deployRemote(buildConfig)
    }

    console.log('Deployment completed successfully!')

    // Notify monitoring system if available
    if (target !== 'local') {
      await notifyMonitoring(target, platform, env)
    }

  } catch (error) {
    console.error('Deployment failed:', error)
    process.exit(1)
  }
}

async function deployLocal(buildConfig) {
  const sourceDir = getBuildOutputDir(platform)
  const destDir = buildConfig.destination

  console.log(`Copying files from ${sourceDir} to ${destDir}`)

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  // Copy files
  execSync(`cp -r ${sourceDir}/* ${destDir}/`, {
    stdio: 'inherit'
  })

  console.log('Local deployment completed')
}

async function deployRemote(buildConfig) {
  const sourceDir = getBuildOutputDir(platform)
  const { host, user, destination, port } = buildConfig

  console.log(`Deploying to remote server ${user}@${host}:${port}`)

  // Use SCP for file transfer
  try {
    execSync(`scp -P ${port} -r ${sourceDir}/* ${user}@${host}:${destination}/`, {
      stdio: 'inherit'
    })

    console.log('Remote file transfer completed')

    // Optional: Run remote commands if needed
    // execSync(`ssh -p ${port} ${user}@${host} "cd ${destination} && npm install --production"`)

  } catch (error) {
    console.error('SCP failed, trying alternative methods...')

    // Fallback to other methods if SCP fails
    // This could be FTP, SFTP, or other deployment methods
    console.error('Alternative deployment methods not implemented')
    throw error
  }
}

function getBuildOutputDir(platform) {
  const outputDir = path.join(__dirname, '../unpackage')

  if (platform === 'h5') {
    return path.join(outputDir, 'dist', 'build', 'h5')
  } else if (platform === 'app-plus') {
    return path.join(outputDir, 'dist', 'build', 'app-plus')
  } else {
    return path.join(outputDir, 'dist', 'build', platform)
  }
}

async function notifyMonitoring(target, platform, env) {
  try {
    // Example: Notify monitoring system about deployment
    const monitoringUrl = 'https://monitoring.example.com/api/deployments'
    const payload = {
      app: 'im-mobile',
      version: require('../package.json').version,
      platform,
      environment: env,
      target,
      timestamp: new Date().toISOString()
    }

    await axios.post(monitoringUrl, payload)
    console.log('Monitoring system notified')

  } catch (error) {
    console.warn('Failed to notify monitoring system:', error.message)
  }
}

// Run deployment
deploy()