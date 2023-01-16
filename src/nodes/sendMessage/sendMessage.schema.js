const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const axios = require('axios')
const path = require('path')
const MayaResourcesAuth = require('../mayaResourcesAuth/mayaResourcesAuth.schema')
const WorkspaceClient = require('../../util/workspace')

class SendMessage extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        })
    }

    static schema = new Schema({
        name: 'send-message',
        label: 'send-message',
        category: 'Maya Resources',
        isConfig: false,
        fields: {
            targetWorkspace: new fields.Typed({
                type: 'str',
                allowedTypes: ['str', 'msg', 'flow', 'global'],
                displayName: 'Target workspace'
            }),
            data: new fields.Typed({
                type: 'json',
                allowedTypes: ['json', 'msg', 'flow', 'global'],
                displayName: 'Data'
            }),
            auth: new fields.Typed({
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

    })

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
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

        let workspaceBaseUrl = null

        if (isUrl) {
            workspaceBaseUrl = vals.targetWorkspace
        } else {
            const targetId = vals.targetWorkspace
            const globalContext = this.redNode.context().global
            let urlMap = globalContext.get('workspaceUrls')
            if (!urlMap) {
                urlMap = {}
                globalContext.set('workspaceUrls', {})
            }

            if (urlMap[targetId]) {
                workspaceBaseUrl = urlMap[targetId]
            } else {
                const workspaceClient = new WorkspaceClient({
                    apiKey: this.credentials.auth.key,
                    backendBaseUrl: this.mayaBackendUrl
                })
        
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

            const request = {
                url: path.join(workspaceBaseUrl, 'send-maya-message'),
                method: 'post',
                data: {
                    data: vals.data,
                    from: this._mayaRuntimeId
                },
                headers: {
                    'x-api-key': this.credentials.auth.key
                }
            }
            
            try {
                const responsePromise = axios(request)
                if (!vals.waitForResponse) {
                    return msg
                }

                const response = await responsePromise
                msg.response = response.data
            } catch (e) {
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
}

module.exports = SendMessage