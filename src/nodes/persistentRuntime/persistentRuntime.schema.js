const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const { MAYA_PAC_URL } = require('../../constants')

const WorkspaceClient = require('../../util/workspace')
const MayaResourcesAuth = require('../mayaResourcesAuth/mayaResourcesAuth.schema')
const pacAxios = require('../../util/axios')
const bareAxios = require('axios')

class PersistentRuntime extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        })
    }

    static schema = new Schema({
        name: 'persistent-runtime',
        label: 'Persistent Runtime',
        category: 'Maya :: Runtime',
        isConfig: false,
        fields: {
            search: new fields.Typed({
                type: 'str',
                allowedTypes: ['str', 'flow', 'global'],
                displayName: 'Search',
                default: 'worker-x'
            }),
            auth: new fields.ConfigNode({
                type: MayaResourcesAuth,
                displayName: "Auth",
            }),
            event: new fields.Typed({
                type: 'json',
                allowedTypes: ['json', 'msg', 'flow', 'global'],
                displayName: 'Event'
            })
            // Whatever custom fields the node needs.
        },
        color: '#37B954',
    })

    onInit() {
        console.log('inside onInit')
        const nodeId = this.redNode.id
        const workspaceId = this._mayaRuntimeId
        const alias = `${workspaceId}_${nodeId}`
        const name = this.constructor.schema.fields.search.resolveValue(
            this.RED, 
            'search',
            this.redNode,
            null,
            {}
        )


        const client = new WorkspaceClient({
            backendBaseUrl: this.mayaBackendUrl,
            apiKey: this.credentials.auth.key
        })

        console.log('brah')
        this.setStatus('PROGRESS', 'Initialising')

        client.searchWorkspaceByName(name)
            .then(workspace => {
                // If no workspace exists, create one
                if (workspace === null) {
                    client.createWorkspace(name, alias)
                        .then((responseData) => {
                            const workspace = responseData.results
                            this.persistentWorkspace = workspace
                            this.setStatus('PROGRESS', 'Starting workspace')
                            client.startWorkspace(workspace._id, 'NEVER')
                                .then(() => {
                                    this.setStatus('SUCCESS', `Workspace ${workspace.name} running`)
                                })
                                .catch(e => {
                                    console.log('Error starting workspace 1', workspace)
                                    if (e.response) {
                                        console.log(e.response.status, e.response.data)
                                    } else {
                                        console.log(e)
                                    }
                                    this.setStatus('ERROR', 'Error:' + e.toString())
                                })
                        })
                } else {
                    this.persistentWorkspace = workspace
                    console.log('the workspace', workspace)
                    if (workspace.status === 'STARTED') {
                        this.setStatus('SUCCESS', `${workspace.name} connected`)
                    } else {
                        this.setStatus('PROGRESS', 'Starting workspace')
                        client.startWorkspace(workspace._id, 'NEVER')
                            .then(() => {
                                this.setStatus('SUCCESS', `${workspace.name} connected`)
                            })
                            .catch((e) => {
                                console.log('Error starting workspace 2', workspace)
                                if (e.response) {
                                    console.log(e.response.status, e.response.data)
                                } else {
                                    console.log(e)
                                }
                                this.setStatus('ERROR', 'Error:' + e.toString())
                            })
                    }
                }
            })
            .catch(e => {
                console.log('Failed to latch on to worker')
                this.rednode.error(e.message)
                if (e.response) {
                    console.log(e.response.status, e.response.data)
                } else {
                    console.log(e)
                }
                this.setStatus('ERROR', 'Failed to latch on to worker')
            })
    }

    async onMessage(msg, vals) {
        const event = vals.event
        const { type, data } = event

        let request = null
        let axios = null

        switch (type) {
            case 'DEPLOY_SESSION': {
                axios = pacAxios
                const { sessionId } = data
                request = {
                    url: `/v1/session/deploy`,
                    method: "post",
                    data: {
                        session_id: sessionId,
                        workspace_id: this.persistentWorkspace._id
                    },
        
                    headers: {
                        'x-api-key': this.credentials.auth.key,
                    },
                };
                break
            }
            
            case 'SEND_MESSAGE': {
                axios = bareAxios
                const { message } = data
                request = {
                    url: `${this.persistentWorkspace.url}/send-maya-message`,
                    method: 'post',
                    data: {
                        data: message,
                        from: this._mayaRuntimeId
                    },
                    headers: {
                        'x-api-key': this.credentials.auth.key
                    }
                }
                break
            }

            default: {
                msg.__isError = true
                msg.__error = new Error('Invalid event')
                this.setStatus('ERROR', 'Invalid event:' + type)
                setTimeout(() => this.setStatus('SUCCESS', `Workspace ${this.persistentWorkspace.name} running`), 1500)
                return msg
            }
        }

        try {
            this.setStatus('PROGRESS', 'Processing')
            console.log('request to send to persistent workspace', request)
            const response = await axios(request)
            msg.payload = response.data
            this.setStatus('SUCCESS', 'Done')
        } catch (e) {
            msg.__isError = true
            msg.__error = e
            this.setStatus('ERROR', 'Error:' + e.toString())
        }

        setTimeout(() => this.setStatus('SUCCESS', `Workspace ${this.persistentWorkspace.name} running`), 1500)
        return msg
    }
}

module.exports = PersistentRuntime