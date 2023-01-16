const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const { GenerateTask } = require('../../util/pacEngine')
const MayaResourcesAuth = require('../mayaResourcesAuth/mayaResourcesAuth.schema')

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
            sendEveryStep: new fields.Typed({
                type: 'bool',
                allowedTypes: ['bool', 'msg', 'flow', 'global'],
                defaultVal: false,
                displayName: 'Send msg on every step'
            })
            // Whatever custom fields the node needs.
        },
        color: "#37B954",
    })

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        const task = new GenerateTask({ 
            sessionId: vals.sessionId,
            apiKey: this.credentials.auth.key
        })
        let stepsGenerated = 0
        const globalContext = this.redNode.context().global
        // globalContext.set(`genResults_${this.redNode.id}`)

        task.on('stepGenerated', (data) => {
            stepsGenerated++
            this.setStatus('SUCCESS', `Received step ${stepsGenerated}`)
            
            if (msg?.payload?.status === 'complete') {
                const newMsg = { ...msg, payload: globalContext.get(`genResults_${this.redNode.id}`)}
                this.redNode.send(newMsg)
            } else { // Save data to context if its not a status message
                globalContext.set(`genResults_${this.redNode.id}`, data)
            }

            if (vals.sendEveryStep) {
                const newMsg = { ...msg, payload: data }
                this.redNode.send(newMsg)
            }
            
        })
        setTimeout(() => {
            task.done()
        }, 5 * 60 * 1000) // For now, timeout and close connection after 5 mins

        this.setStatus('PROGRESS', 'Generating steps...')
        task.execute()
    }
}

module.exports = Generate