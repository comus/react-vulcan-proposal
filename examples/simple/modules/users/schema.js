const schema = [
  {
    fieldName: '_id',
    scopes: ['database', 'graphql'],
    validate: false,
    type: 'String!',
    canRead: ['everyone']
  },

  {
    fieldName: 'username',
    scopes: ['database', 'graphql'],
    validate: ({ yup }) => yup.string().nullable().notRequired(),
    type: 'String',
    canRead: ['everyone'],
    canCreate: ['guests'],
    canUpdate: ['owner', 'admins']
  },

  {
    fieldName: 'email',
    scopes: ['database', 'graphql'],
    validate: ({ yup }) => yup.string().nullable().notRequired().email(),
    type: 'String',
    canRead: ['owner', 'admins'],
    canCreate: ['guests'],
    canUpdate: ['owner', 'admins']
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
    fieldName: 'isAdmin',
    scopes: ['database', 'graphql'],
    validate: ({ yup }) => yup.boolean().required(),
    defaultValue: () => false,
    type: 'Boolean',
    canUpdate: ['admins'],
    canRead: ['everyone']
  },

  {
    fieldName: 'name',
    scopes: ['database', 'graphql'],
    validate: ({ yup }) => yup.string(),
    defaultValue: () => '',
    type: 'String',
    canCreate: ['guests'],
    canUpdate: ['owner', 'admins'],
    canRead: ['everyone']
  },

  {
    fieldName: 'groups',
    type: '[String!]!',
    database: {
      default: []
    },
    canCreate: ['guests'],
    canUpdate: ['owner', 'admins'],
    canRead: ['everyone']
  }
]

export default schema
