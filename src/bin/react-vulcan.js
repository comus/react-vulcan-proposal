#!/usr/bin/env node

import arg from 'arg'
import { join } from 'path'
import fs from 'fs-extra'

const args = arg({}, { permissive: true })

const command = args._[0]

if (command === 'mongo') {
  const { MongodHelper } = require('mongodb-prebuilt')
  const dbPath = join(process.cwd(), '.mongodb')
  fs.ensureDirSync(dbPath)
  const mongodHelper = new MongodHelper(['--port', '27018', '--dbpath', dbPath], {
    version: '4.0.6'
  })
  mongodHelper.run().then((started) => {
    console.log('mongod is running')
  }, (e) => {
    console.log('error starting', e)
  })
}

if (!command) {
  throw new Error('invalid command')
}
