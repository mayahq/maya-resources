const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')

class RespondToMessage extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        })
    }

    static schema = new Schema({
        name: 'respond-to-message',
        label: 'Respond to Message',
        category: 'Maya :: Runtime',
        isConfig: false,
        fields: {
            response: new fields.Typed({
                type: 'msg',
                allowedTypes: ['json', 'msg', 'flow', 'global'],
                defaultVal: 'payload',
                displayName: 'Response'
            })
            // Whatever custom fields the node needs.
        },
        color: '#37B954',
    })

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        const responseToSend = vals.response
        const sendFn = msg.__returnResponse

        sendFn(responseToSend)
        // Handle the message. The returned value will
        // be sent as the message to any further nodes.

    }
}

module.exports = RespondToMessage