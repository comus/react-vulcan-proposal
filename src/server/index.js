import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas'

const generateTypeDefsFromCollections = (collections = {}) => {
  return Object.keys(collections).forEach(key => {
    const coll = collections[key]
     
  })
}

const generateResolversFromCollections = (collections = {}) => {

}

export const createVulcanServer = (options = {}) => {
  const app = options.app || express()

  const collectionsTypeDefs = generateTypeDefsFromCollections(options.collections)
  const collectionsResolvers = generateResolversFromCollections(options.collections)

  const server = new ApolloServer({
    typeDefs: mergeTypes([
      `
        scalar Date
        scalar LowercaseString
        scalar JSON
      `,
      ...collectionsTypeDefs,
      options.typeDefs || ''
    ], { all: true }),
    resolvers: mergeResolvers([
      ...collectionsResolvers,
      options.resolvers || {}
    ]),
    ...options
  })

  server.applyMiddleware({ app })

  return app
}
