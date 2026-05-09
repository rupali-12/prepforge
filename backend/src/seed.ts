// seed.ts

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Problem from './models/Problem.model'
import {problems} from './data/problems'

dotenv.config()

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string)
    console.log('Connected to MongoDB')

    await Problem.deleteMany({})
    console.log('Old problems removed')

    await Problem.insertMany(problems)
    console.log(`Seeded ${problems.length} problems successfully`)

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
}

seed()