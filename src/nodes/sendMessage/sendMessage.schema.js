const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const axios = require('axios')
const path = require('path')
const MayaResourcesAuth = require('../mayaResourcesAuth/mayaResourcesAuth.schema')
const WorkspaceClient = require('../../util/workspace')


// const baseTypes = ['string', 'number', 'boolean']
// function getSerialisableMessage(msg) {
//     const smsg = {}
//     const iterate = (msg, obj) => {
//         Object.entries(msg).forEach(([key, val]) => {
//             if (baseTypes.includes(typeof val) || val === null || val === undefined) {
//                 obj[key] = val
//             } else if (typeof val === 'object') {
//                 obj[key] = {}
//                 iterate(val, obj[key])
//             }
//         })
//     }

//     iterate(msg, smsg)
//     return smsg
// }

// const exmsg = {
//     a: 1,
//     b: 2,
// }

class SendMessage extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        })
    }

    static schema = new Schema({
        name: 'send-message',
        label: 'Send Message',
        category: 'Maya :: Runtime',
        isConfig: false,
        fields: {
            targetWorkspace: new fields.Typed({
                type: 'str',
                allowedTypes: ['str', 'msg', 'flow', 'global'],
                displayName: 'Target worker'
            }),
            alias: new fields.Typed({
                type: 'str',
                allowedTypes: ['msg', 'flow', 'global'],
                displayName: 'Target worker alias'
            }),
            data: new fields.Typed({
                type: 'json',
                allowedTypes: ['json', 'msg', 'flow', 'global'],
                displayName: 'Data'
            }),
            auth: new fields.ConfigNode({
                type: MayaResourcesAuth,
                displayName: 'Auth'
            }),
            waitForResponse: new fields.Typed({
                type: 'bool',
                allowedTypes: ['json', 'msg', 'flow', 'global'],
                displayName: 'Wait for response',
                default: true
            })
        },
        color: '#37B954',

    })

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        console.log('we here', vals)
        let isUrl = false

        try {
            const url = new URL(vals.targetWorkspace)
            if (
                url.host.startsWith('rt-') &&
                url.host.includes('mayalabs.io')
            ) {
                isUrl = true
            } else {
                msg.__error = new Error('Invalid workspace URL')
                msg.isError = true
                return msg
            }
        } catch (e) {}

        const workspaceClient = new WorkspaceClient({
            apiKey: this.credentials.auth.key,
            backendBaseUrl: this.mayaBackendUrl
        })

        let workspaceBaseUrl = null

        console.log('we here 2')
        const globalContext = this.redNode.context().global

        if (isUrl) {
            workspaceBaseUrl = vals.targetWorkspace
            console.log('we here 3', workspaceBaseUrl)

        } else if (vals.alias) {
            let aliasWorkspaceMap = globalContext.get('workspaceByAlias')
            const alias = vals.alias

            if (!aliasWorkspaceMap) {
                aliasWorkspaceMap = {}
                globalContext.set('workspaceByAlias', aliasWorkspaceMap)
            }

            if (aliasWorkspaceMap[alias]) {
                workspaceBaseUrl = aliasWorkspaceMap[alias].url
            } else {
                try {
                    const workspace = await workspaceClient.getWorkspaceByAlias(alias)
                    workspaceBaseUrl = workspace.url
                    aliasWorkspaceMap[alias] = workspace
                    globalContext.set('workspaceByAlias', aliasWorkspaceMap)
                } catch (e) {
                    console.log('Workspace not found, oops', e?.response?.status, e?.response?.data)
                    msg.__isError = true
                    msg.__error = e
                    return msg
                }
            }

        } else {
            console.log('we here 4', workspaceBaseUrl)
            const targetId = vals.targetWorkspace
            let urlMap = globalContext.get('workspaceUrls')
            if (!urlMap) {
                urlMap = {}
                globalContext.set('workspaceUrls', {})
            }

            if (urlMap[targetId]) {
                workspaceBaseUrl = urlMap[targetId]
            } else {
                
        
                const workspaceRes = await workspaceClient.getWorkspace({
                    workspaceId: targetId
                })
                const workspace = workspaceRes.results
                globalContext.set('workspaceUrls', {
                    ...urlMap,
                    [targetId]: workspace.url
                })
                workspaceBaseUrl = workspace.url
            }
        }


        const request = {
            url: `${workspaceBaseUrl}/send-maya-message`,
            method: 'post',
            data: {
                data: msg,
                from: this._mayaRuntimeId
            },
            headers: {
                'x-api-key': this.credentials.auth.key
            }
        }
        
        console.log('request', request)

        try {
            this.setStatus('PROGRESS', 'Sending message')
            console.log('we here')
            const responsePromise = axios(request)
            this.setStatus('SUCCESS', 'Message sent')
            if (!vals.waitForResponse) {
                return msg
            }

            this.setStatus('PROGRESS', 'Waiting for response')

            const response = await responsePromise
            console.log('now we here')
            msg.response = response.data
            this.setStatus('SUCCESS', 'Received response')
            return msg
        } catch (e) {
            this.setStatus('ERROR', e.toString())
            if (e.response) {
                console.log('Error in request to send message', e.response.status, e.response.data)
            } else {
                console.log('Error in sending request', e)
            }

            msg.__isError = true
            msg.__error = true
            return msg
        }

    }
}

module.exports = SendMessage