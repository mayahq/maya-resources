const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const { InstructTask } = require('../../util/pacEngine')
const MayaResourcesAuth = require('../mayaResourcesAuth/mayaResourcesAuth.schema')

class Instruct extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        })
    }

    static schema = new Schema({
        name: 'instruct',
        label: 'instruct',
        category: 'Maya :: Session',
        isConfig: false,
        fields: {
            auth: new fields.ConfigNode({
                type: MayaResourcesAuth,
                displayName: "Auth",
            }),
            sessionId: new fields.Typed({
                type: "str",
                allowedTypes: ["msg", "flow", "global", "str"],
                defaultVal: "abc",
                displayName: "Session Id",
            }),
            instruction: new fields.Typed({
                type: "str",
                allowedTypes: ["msg", "flow", "global", "str"],
                defaultVal: "abc",
                displayName: "Instruction",
            }),
            fromScratch: new fields.Typed({
                type: "bool",
                allowedTypes: ["msg", "flow", "global", "bool"],
                defaultVal: false,
                displayName: "Generate from scratch",
            }),

        },
        color: "#37B954",
    })

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        const task = new InstructTask({
            sessionId: vals.sessionId,
            instruction: vals.instruction,
            fromScratch: vals.fromScratch
        })
        task.on('instructDone', (data) => {
            const newMsg = { ...msg, payload: data }
            this.redNode.send(newMsg)
            this.setStatus('SUCCESS', `Done`)
            task.done()
        })

        this.setStatus('PROGRESS', 'Instructing...')
        task.execute()
        return null
    }
}

module.exports = Instruct