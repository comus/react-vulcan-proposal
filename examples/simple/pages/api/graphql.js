import express from 'express'
import { createVulcanServer } from 'react-vulcan-proposal/server'
import { collections } from '../../modules'

const app = createVulcanServer({
  dbConnector: {
    type: 'mongo',
    url: process.env.NODE_ENV === 'production'
      ? 'mongodb://127.0.0.1:27017'
      : 'mongodb://127.0.0.1:27017'
  },
  app: express(),
  collections,
  typeDefs: null,
  resolvers: null,
  introspection: true,
  playground: {
    settings: {
      'request.credentials': 'include'
    }
  },
  context: ({ req }) => ({})
})

export default app
