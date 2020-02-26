import {
  createCollection,
  getDefaultQueryResolvers,
  getDefaultMutationResolvers
} from 'react-vulcan-proposal/collection'
import schema from './schema'

const Movies = createCollection({
  name: 'movies',
  dbCollectionName: 'Movies',
  typeName: 'Movie',
  schema,
  resolvers: {
    Query: getDefaultQueryResolvers('movies'),
    Mutation: getDefaultMutationResolvers('movies')
  },
  defaultView: {
    sort: [{ createdAt: 'desc' }]
  }
})

export default Movies
