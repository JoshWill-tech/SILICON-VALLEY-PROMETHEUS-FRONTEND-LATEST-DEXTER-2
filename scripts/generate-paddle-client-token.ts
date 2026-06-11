import { Environment, Paddle } from '@paddle/paddle-node-sdk'
import * as fs from 'fs'
import * as path from 'path'

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim()
        }
      })
    }
  } catch (e) {
    console.warn('Could not load .env.local')
  }
}

loadEnv()

async function generateToken() {
  const apiKey = process.env.PADDLE_API_KEY
  
  if (!apiKey) {
    console.error('Error: PADDLE_API_KEY is not set in .env.local')
    process.exit(1)
  }

  const isProduction = apiKey.includes('_live_') || apiKey.startsWith('pdl_l') 
  const environment = isProduction ? Environment.production : Environment.sandbox
  const envLabel = isProduction ? 'production' : 'sandbox'

  const paddle = new Paddle(apiKey, { environment })

  try {
    const tokenResponse = await paddle.clientTokens.create({
      name: 'Prometheus Paddle Token',
      description: 'Frontend Checkout Token (Prometheus App)'
    })

    console.log('--- PADDLE CLIENT TOKEN CREATED ---')
    console.log(`Environment: ${envLabel}`)
    // Log the whole object to find the correct property
    console.log('Full Response:', JSON.stringify(tokenResponse, null, 2))
    console.log('------------------------------------')
  } catch (error: any) {
    console.error('Failed to create Paddle client-side token:', error.message)
    if (error.detail) console.error('Detail:', error.detail)
    process.exit(1)
  }
}

generateToken()
