const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const { GenerateTask } = require('../../util/pacEngine')
const WorkspaceClient = require('../../util/workspace')
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
            workspaceAlias: new fields.Typed({
                type: 'str',
                allowedTypes: ['msg', 'flow', 'global'],
                defaultVal: '',
                displayName: 'Worker alias'
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
        const workspaceClient = new WorkspaceClient({
            apiKey: this.credentials.auth.key,
            backendBaseUrl: this.mayaBackendUrl
        })

        let sessionId = null
        if (vals.sessionId) {
            sessionId = vals.sessionId
            
        } else if (vals.workspaceAlias) {
            const globalContext = this.redNode.context().global
            const alias = vals.workspaceAlias
            let aliasWorkspaceMap = globalContext.get('workspaceByAlias')

            if (!aliasWorkspaceMap) {
                aliasWorkspaceMap = {}
                globalContext.set('workspaceByAlias', aliasWorkspaceMap)
            }

            try {
                const workspace = await workspaceClient.getWorkspaceByAlias(alias)
                sessionId = workspace.sessionId
                aliasWorkspaceMap[alias] = workspace
                globalContext.set('workspaceByAlias', aliasWorkspaceMap)
            } catch (e) {
                console.log('Workspace not found, oops', e?.response?.status, e?.response?.data)
                msg.__isError = true
                msg.__error = e
                return msg
            }
        }


        const task = new GenerateTask({ 
            sessionId: sessionId,
            apiKey: this.credentials.auth.key
        })
        let stepsGenerated = 0
        const globalContext = this.redNode.context().global
        // globalContext.set(`genResults_${this.redNode.id}`)

        task.on('stepGenerated', (data) => {
            stepsGenerated++
            this.setStatus('SUCCESS', `Received step ${stepsGenerated}`)
            
            console.log('payload', data)
            if (data?.status === 'complete') {
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