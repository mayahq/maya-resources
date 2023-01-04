const NodeClass = require('./sendMessage.schema')
const {
    nodefn
} = require('@mayahq/module-sdk')

module.exports = nodefn(NodeClass, "maya-resources")