import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import User from '../models/User.js'

async function main() {
  const args = process.argv.slice(2)
  const params = {}
  for (let i = 0; i < args.length; i += 2) {
    const k = args[i]?.replace(/^--/, '')
    const v = args[i + 1]
    if (k) params[k] = v
  }

  const name = params.name || 'Admin'
  const username = (params.username || 'admin').toLowerCase()
  const password = params.password || 'Admin@Nanma123'
  const role = 'admin'

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in .env')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI)

  try {
    const existsUser = await User.findOne({ username })
    if (existsUser) {
      console.log(`User with username '${username}' already exists (role: ${existsUser.role}).`)
      process.exit(0)
    }

    const hash = await bcrypt.hash(password, 10)
    const doc = await User.create({ name, username, passwordHash: hash, role, fixedAmount: 0 })
    console.log('Admin created:')
    console.log({ id: doc._id.toString(), name: doc.name, username: doc.username, role: doc.role })
    console.log('NOTE: Change the password after first login.')
  } catch (e) {
    console.error('Failed to create admin:', e.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

main()
