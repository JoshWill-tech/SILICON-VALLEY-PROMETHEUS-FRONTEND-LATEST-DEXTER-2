import { Environment, Paddle } from '@paddle/paddle-node-sdk'
import * as fs from 'fs'
import * as path from 'path'

function loadEnv() {
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
}

loadEnv()

async function testKey() {
  const apiKey = process.env.PADDLE_API_KEY
  if (!apiKey) {
    console.error('No API key found')
    return
  }

  const isProduction = apiKey.includes('_live_') || apiKey.startsWith('pdl_l') 
  const environment = isProduction ? Environment.production : Environment.sandbox
  const paddle = new Paddle(apiKey, { environment })

  try {
    console.log('Testing products.list()...')
    const products = await paddle.products.list().next()
    console.log('Success! API key is valid and has read permissions.')
  } catch (error: any) {
    console.error('General API test failed:', error.message)
    if (error.detail) console.error('Detail:', error.detail)
  }

  try {
    console.log('Testing clientTokens.create()...')
    const token = await paddle.clientTokens.create({
      name: 'Test Token'
    })
    console.log('Success! Client token created:', token.token)
  } catch (error: any) {
    console.error('Client token creation failed:', error.message)
    if (error.detail) console.error('Detail:', error.detail)
  }
}

testKey()
