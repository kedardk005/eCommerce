import dotenv from 'dotenv'
dotenv.config()

// Force test environment settings before importing index
process.env.NODE_ENV = 'test'
process.env.PORT = '5001'

console.log('--- Starting Integration Test Server on Port 5001 ---')
import { server } from '../src/index'
import { run } from 'node:test'
import { spec } from 'node:test/reporters'
import path from 'path'

// Give the server a moment to start
setTimeout(() => {
  console.log('--- Running Automated Integration Tests ---')
  
  let hasFailures = false
  const testStream = run({
    files: [path.resolve(__dirname, 'integration.test.ts')]
  })
  
  testStream.on('test:fail', () => {
    hasFailures = true
  })

  testStream
    .compose(new spec())
    .pipe(process.stdout)

  testStream.on('end', () => {
    console.log('\n--- Shutting down Integration Test Server ---')
    server.close(() => {
      process.exit(hasFailures ? 1 : 0)
    })
  })
}, 1500)
