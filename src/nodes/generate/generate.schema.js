const {
    Node,
    Schema
} = require('@mayahq/module-sdk')

class Generate extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        })
    }

    static schema = new Schema({
        name: 'generate',
        label: 'generate',
        category: 'Maya :: Session',
        isConfig: false,
        fields: {
            // Whatever custom fields the node needs.
        },
        color: "#37B954",
    })

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        // Handle the message. The returned value will
        // be sent as the message to any further nodes.

    }
}

module.exports = Generate