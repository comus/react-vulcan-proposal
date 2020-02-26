const schema = [
  {
    canDelete: ['owner', 'admins']
  },

  {
    fieldName: '_id',
    scopes: ['database', 'graphql'],
    validate: false,
    type: 'String!',
    canRead: ['everyone']
  },

  {
    fieldName: 'createdAt',
    scopes: ['database', 'graphql'],
    validate: ({ yup }) => yup.date().required(),
    defaultValue: () => new Date(),
    type: 'Date',
    canRead: ['everyone']
  },

  {
    fieldName: 'userId',
    scopes: ['database', 'graphql'],
    validate: ({ yup }) => yup.string().required(),
    defaultValue: ({ currentUser }) => (currentUser && currentUser._id) || '',
    type: 'String',
    canRead: ['everyone']
  },

  {
    fieldName: 'user',
    scopes: ['graphql'],
    type: 'User',
    resolver: (movie, args, context) => {
      return context.Users.get(
        { _id: movie.userId },
        { fields: context.Users.getReadableProjection(context.currentUser) }
      )
    },
    canRead: ['everyone']
  },

  {
    fieldName: 'name',
    scopes: ['database', 'graphql'],
    validate: ({ yup }) => yup.string().required(),
    type: 'String!',
    canRead: ['everyone'],
    canCreate: ['authed'],
    canUpdate: ['owner', 'admins']
  },

  {
    fieldName: 'year',
    scopes: ['database', 'graphql'],
    validate: ({ yup }) => yup.string(),
    defaultValue: () => '',
    type: 'String',
    canRead: ['everyone'],
    canCreate: ['authed'],
    canUpdate: ['owner', 'admins']
  },

  {
    fieldName: 'review',
    scopes: ['database', 'graphql'],
    validate: ({ yup }) => yup.string(),
    defaultValue: () => '',
    type: 'String',
    canRead: ['everyone'],
    canCreate: ['authed'],
    canUpdate: ['owner', 'admins']
  }
]

export default schema
