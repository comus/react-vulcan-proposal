import difference from 'lodash/difference'

export const createCollection = (options = {}) => {
  const {
    name,
    schema,
    database = {},
    graphql = {},
    defaultView = {}
  } = options

  // initialize new Mongo collection
  const collection = {}

  // decorate collection with options
  collection.options = options

  // add option if missing
  collection.options.database = database
  collection.options.graphql = graphql
  collection.options.defaultView = defaultView

  // name
  collection.name = name
  // schema
  collection.schema = schema
  // tablename
  collection.tableName = database.tableName
  // typename
  collection.typeName = graphql.typeName

  // add views
  collection.views = []
  // default view
  collection.defaultView = defaultView

  return collection
}

class Group {
  constructor () {
    this.actions = []
  }

  can (actions) {
    actions = Array.isArray(actions) ? actions : [actions]
    this.actions = this.actions.concat(actions.map(a => a.toLowerCase()))
  }

  cannot (actions) {
    actions = Array.isArray(actions) ? actions : [actions]
    this.actions = difference(this.actions, actions.map(a => a.toLowerCase()))
  }
}

export const createUsersCollection = (options = {}) => {
  const Users = createCollection({
    name: 'users',
    schema: defaultUsersSchema,
    database: {
      tableName: 'Users'
    },
    graphql: {
      typeName: 'User',
      resolvers: {
        Query: getDefaultQueryResolvers('users'),
        Mutation: getDefaultMutationResolvers('users')
      }
    },
    defaultView: {
      sort: [{ createdAt: 'desc' }]
    },
    ...options
  })

  // permissions
  Users.groups = {}

  Users.createGroup = groupName => {
    Users.groups[groupName] = new Group()
  }

  Users.getGroups = (user, document) => {
    let userGroups = []

    if (!user) { // guests user
      userGroups = ['guests']
    } else {
      userGroups = ['members']

      if (document && Users.owns(user, document)) {
        userGroups.push('owners')
      }

      if (user.groups) { // custom groups
        userGroups = userGroups.concat(user.groups)
      }

      if (Users.isAdmin(user)) { // admin
        userGroups.push('admins')
      }
    }

    return userGroups
  }

  Users.getActions = user => {
    const userGroups = Users.getGroups(user)
    if (!userGroups.includes('guests')) {
      // always give everybody permission for guests actions, too
      userGroups.push('guests')
    }
    const groupActions = userGroups.map(groupName => {
      // note: make sure groupName corresponds to an actual group
      const group = Users.groups[groupName]
      return group && group.actions
    })
    return _.unique(_.flatten(groupActions))
  }

  Users.isMemberOf = (user, groupOrGroups, document) => {
    const groups = Array.isArray(groupOrGroups) ? groupOrGroups : [groupOrGroups]
    return intersection(Users.getGroups(user, document), groups).length > 0
  }

  Users.canDo = (user, actionOrActions) => {
    const authorizedActions = Users.getActions(user)
    const actions = Array.isArray(actionOrActions) ? actionOrActions : [actionOrActions]
    return Users.isAdmin(user) || intersection(authorizedActions, actions).length > 0
  }

  Users.owns = function (user, document) {
    try {
      if (document.userId) {
        // case 1: document is a post or a comment, use userId to check
        return user._id === document.userId
      } else {
        // case 2: document is a user, use _id or slug to check
        return document.slug ? user.slug === document.slug : user._id === document._id
      }
    } catch (e) {
      return false // user not logged in
    }
  }

  Users.isAdmin = function (userOrUserId) {
    try {
      var user = Users.getUser(userOrUserId)
      return !!user && !!user.isAdmin
    } catch (e) {
      return false // user not logged in
    }
  }
  Users.isAdminById = Users.isAdmin

  Users.canReadField = function (user, field, document) {
    const canRead = field.canRead || field.viewableBy // OpenCRUD backwards compatibility
    if (canRead) {
      if (typeof canRead === 'function') {
        // if canRead is a function, execute it with user and document passed. it must return a boolean
        return canRead(user, document)
      } else if (typeof canRead === 'string') {
        // if canRead is just a string, we assume it's the name of a group and pass it to isMemberOf
        return canRead === 'guests' || Users.isMemberOf(user, canRead)
      } else if (Array.isArray(canRead) && canRead.length > 0) {
        // if canRead is an array, we do a recursion on every item and return true if one of the items return true
        return canRead.some(group => Users.canReadField(user, { canRead: group }, document))
      }
    }
    return false
  }

  Users.getReadableFields = function (user, collection, document) {
    return compact(map(collection.simpleSchema()._schema,
      (field, fieldName) => {
        if (fieldName.indexOf('.$') > -1) return null
        return Users.canReadField(user, field, document) ? fieldName : null
      }
    ))
  }

  Users.getReadableProjection = function (user, collection, document) {
    return Utils.arrayToFields(Users.getReadableFields(user, collection, document))
  }

  Users.checkFields = (user, collection, fields) => {
    const viewableFields = Users.getReadableFields(user, collection)
    const diff = difference(fields, viewableFields)

    if (diff.length) {
      throw new Error(
        `You don't have permission to filter collection ${collection.options.collectionName} by the following fields: ${diff.join(
          ', '
        )}.`
      )
    }
    return true
  }

  Users.restrictViewableFields = function (user, collection, docOrDocs) {
    if (!docOrDocs) return {}

    const restrictDoc = document => {
      // get array of all keys viewable by user
      const viewableKeys = Users.getReadableFields(user, collection, document)
      const restrictedDocument = _.clone(document)

      // loop over each property in the document and delete it if it's not viewable
      _.forEach(restrictedDocument, (value, key) => {
        if (!viewableKeys.includes(key)) {
          delete restrictedDocument[key]
        }
      })

      return restrictedDocument
    }

    return Array.isArray(docOrDocs) ? docOrDocs.map(restrictDoc) : restrictDoc(docOrDocs)
  }

  Users.canCreateField = function (user, field) {
    const canCreate = field.canCreate || field.insertableBy // OpenCRUD backwards compatibility
    if (canCreate) {
      if (typeof canCreate === 'function') {
        // if canCreate is a function, execute it with user and document passed. it must return a boolean
        return canCreate(user)
      } else if (typeof canCreate === 'string') {
        // if canCreate is just a string, we assume it's the name of a group and pass it to isMemberOf
        // note: if canCreate is 'guests' then anybody can create it
        return canCreate === 'guests' || Users.isMemberOf(user, canCreate)
      } else if (Array.isArray(canCreate) && canCreate.length > 0) {
        // if canCreate is an array, we do a recursion on every item and return true if one of the items return true
        return canCreate.some(group => Users.canCreateField(user, { canCreate: group }))
      }
    }
    return false
  }

  Users.canUpdateField = function (user, field, document) {
    const canUpdate = field.canUpdate || field.editableBy // OpenCRUD backwards compatibility

    if (canUpdate) {
      if (typeof canUpdate === 'function') {
        // if canUpdate is a function, execute it with user and document passed. it must return a boolean
        return canUpdate(user, document)
      } else if (typeof canUpdate === 'string') {
        // if canUpdate is just a string, we assume it's the name of a group and pass it to isMemberOf
        // note: if canUpdate is 'guests' then anybody can create it
        return canUpdate === 'guests' || Users.isMemberOf(user, canUpdate)
      } else if (Array.isArray(canUpdate) && canUpdate.length > 0) {
        // if canUpdate is an array, we look at every item and return true if one of the items return true
        return canUpdate.some(group => Users.canUpdateField(user, { canUpdate: group }, document))
      }
    }
    return false
  }

  Users.createGroup('guests') // non-logged-in users

  Users.createGroup('members') // regular users
  Users.groups.members.can([
    Users.actions.create,
    Users.actions.update.own
  ])

  Users.createGroup('admins')
  Users.groups.admins.can([
    Users.actions.create,
    Users.actions.update.all,
    Users.actions.delete.all
  ])

  return Users
}
