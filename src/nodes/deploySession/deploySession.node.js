const NodeClass = require('./deploySession.schema')
const {
    nodefn
} = require('@mayahq/module-sdk')

module.exports = nodefn(NodeClass, "maya-resources")