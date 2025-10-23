import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import fs from 'fs'
import path from 'path'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const FORCE_IPV4_TLS = process.env.DATABASE_FORCE_IPV4 === 'true'
const DEFAULT_CA_PATH = path.join(process.cwd(), 'cert', 'supabase-ca.pem')
const CA_PATH = process.env.DATABASE_CA_PATH || DEFAULT_CA_PATH
const DEFAULT_SERVER_NAME = 'aws-1-us-east-2.pooler.supabase.com'

// Use SSL_PEM env var for production, or read from file for local development
const sslCert = process.env.SSL_PEM
  ? process.env.SSL_PEM.replace(/\\n/g, '\n')
  : (FORCE_IPV4_TLS && fs.existsSync(CA_PATH))
    ? fs.readFileSync(CA_PATH, 'utf8')
    : undefined

const databaseDriverOptions = FORCE_IPV4_TLS && sslCert
  ? {
    connection: {
      ssl: {
        ca: sslCert,
        rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
        servername: process.env.DATABASE_SSL_SERVERNAME || DEFAULT_SERVER_NAME,
      },
    },
  }
  : undefined

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    ...(databaseDriverOptions ? { databaseDriverOptions } : {}),
    workerMode: process.env.MEDUSA_WORKER_MODE as 'shared' | 'worker' | 'server',
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
  },
  modules: [
    {
      resolve: './src/modules/marketplace',
    },
    {
      resolve: './src/modules/acp',
    },
    {
      resolve: "./src/modules/source_feed/shopify",
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/inventory",
      options: {
        inventory: true,
      },
    },
  ],
})
