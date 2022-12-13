const NodeClass = require("./healthCheck.schema");
const { nodefn } = require("@mayahq/module-sdk");

module.exports = nodefn(NodeClass, "maya-resources");
