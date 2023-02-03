const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const { InstructTask } = require('../../util/pacEngine')
const WorkspaceClient = require('../../util/workspace')
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
            workspaceAlias: new fields.Typed({
                type: 'str',
                allowedTypes: ['msg', 'flow', 'global'],
                defaultVal: '',
                displayName: 'Worker alias'
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

        const task = new InstructTask({
            sessionId: sessionId,
            instruction: vals.instruction,
            fromScratch: vals.fromScratch,
            apiKey: this.credentials.auth.key
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