import {
  createUsersCollection,
  getDefaultQueryResolvers,
  getDefaultMutationResolvers
} from 'react-vulcan-proposal/collection'
import schema from './schema'

const Users = createUsersCollection({
  name: 'users',
  dbCollectionName: 'Users',
  typeName: 'User',
  schema,
  resolvers: {
    Query: getDefaultQueryResolvers('users'),
    Mutation: getDefaultMutationResolvers('users')
  },
  defaultView: {
    sort: [{ createdAt: 'desc' }]
  }
})

export default Users
