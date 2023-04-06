const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require('axios');
const MayaResourcesAuth = require("../mayaResourcesAuth/mayaResourcesAuth.schema");
const { poll } = require("../../util/poll");
const WorkspaceClient = require("../../util/workspace");


// (Open 🔗)

const getWorkspaceRunningMessage = (workspace) => (
    // `Worker "${workspace.name}" running. [Click to open](/edit?id=${workspace._id})`
    `
    Workspace "${workspace.name}" running. 
    <a href="/edit?id=${workspace._id}" target="_blank" class="node-status-link">
        Click to open.
    </a>
    `
)

class CreateRuntime extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            masterKey:
                "eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a",
        });
    }

    static schema = new Schema({
        name: "create-runtime",
        label: "Create Worker",
        category: "Maya :: Runtime",
        isConfig: false,
        fields: {
            auth: new fields.ConfigNode({
                type: MayaResourcesAuth,
                displayName: "Auth",
            }),
            workspaceName: new fields.Typed({
                type: "str",
                allowedTypes: ["msg", "flow", "global"],
                displayName: "Worker Name",
                defaultVal: "",
                required: true,
            }),
            alias: new fields.Typed({
                type: 'str',
                allowedTypes: ['msg', 'flow', 'global'],
                displayName: 'Alias',
                defaultVal: 'test-alias',
                required: true
            }),
            startAfterCreate: new fields.Typed({
                type: "bool",
                allowedTypes: ["msg", "flow", "global"],
                displayName: "Start After Create",
                defaultVal: true,
                required: true,
            }),
            persist: new fields.Typed({
                type: "bool",
                allowedTypes: ["msg", "flow", "global"],
                displayName: "Persist",
                defaultVal: true,
                required: true,
            }),
        },
        color: "#37B954",
    });

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Processing...");
        const client = new WorkspaceClient({
            backendBaseUrl: this.mayaBackendUrl,
            apiKey: this.credentials.auth.key,
        })

        const nodeId = this.redNode.id
        const workspaceId = this._mayaRuntimeId
        // const alias = `${workspaceId}_${nodeId}`
        const alias = vals.alias

        if (vals.persist) {
            client.getWorkspaceByAlias(alias)
                .then((responseData) => {
                    console.log('responseData', responseData)
                    const workspace = responseData
                    msg.payload = workspace
                    msg.createdNew = false

                    console.log('the workspace already exists', workspace)

                    if (!vals.startAfterCreate) {
                        return this.redNode.send(msg)
                    }

                    if (workspace.status === 'STARTED') {
                        this.setStatus('SUCCESS', getWorkspaceRunningMessage(workspace))
                        this.redNode.send(msg)
                    } else {
                        this.setStatus('PROGRESS', 'Starting workspace')
                        client.startWorkspace(workspace._id, 'NEVER')
                            .then(() => {
                                this.setStatus('SUCCESS', getWorkspaceRunningMessage(workspace))
                                this.redNode.send(msg)
                            })
                            .catch((e) => {
                                console.log('Error starting workspace')
                                if (e.response) {
                                    console.log(e.response.status, e.response.data)
                                } else {
                                    console.log(e)
                                }
                                this.setStatus('ERROR', 'Error:' + e.toString())
                                msg.__error = e
                                msg.__isError = true
                                this.redNode.send(msg)
                            })
                    }
                })
                .catch(e => {
                    console.log('errored here', e)
                    if (e?.response?.status !== 404) {
                        this.setStatus('ERROR', 'Error getting workspace:' + e.toString())
                        return console.log('Error getting workspace', e)
                    }

                    this.setStatus('PROGRESS', 'Creating workspace')
                    const rand = Math.floor(100 * Math.random())
                    client.createWorkspace(vals.workspaceName || `C-${rand}`, alias)
                        .then((responseData) => {
                            const workspace = responseData.results
                            msg.payload = workspace
                            msg.createdNew = true

                            if (!vals.startAfterCreate) {
                                return this.redNode.send(msg)
                            }

                            this.setStatus('PROGRESS', 'Starting workspace')

                            client.startWorkspace(workspace._id, 'NEVER')
                                .then(() => {
                                    this.setStatus('SUCCESS', getWorkspaceRunningMessage(workspace))
                                    return this.redNode.send(msg)
                                })
                                .catch(e => {
                                    console.log('Error starting workspace')
                                    if (e.response) {
                                        console.log(e.response.status, e.response.data)
                                    } else {
                                        console.log(e)
                                    }
                                    this.setStatus('ERROR', 'Error:' + e.toString())
                                    msg.__isError = true
                                    msg.__error = e
                                    return this.redNode.send(msg)
                                })
                        })

                })
        } else {
            let interval = null
            try {
                // Create the workspace here
                const createResponseData = await client.createWorkspace(vals.workspaceName, null);
                msg.payload = createResponseData.results
    
                const brain = createResponseData.results
                if (!vals.startAfterCreate) {
                this.setStatus('SUCCESS', 'Done.')
                    return msg;
                }
    
                // Fancy node status updates to show something is happening
                let num = 0
                const dots = ['', '.', '..', '...']
                interval = setInterval(() => {
                    this.setStatus("PROGRESS", `Starting runtime${dots[num % 4]}`)
                    num++
                }, 500)
    
                // Start the workspace here
                await client.startWorkspace(brain._id)
    
                try {
                    clearInterval(interval)
                } catch (e) {
                    console.log('Error clearing interval', e)
                }
    
                this.setStatus('SUCCESS', 'Done.')
            } catch (e) {
                try {
                    clearInterval(interval)
                } catch (e) {}
                
                if (e.type === 'TIMED_OUT') {
                    this.setStatus("ERROR", "Error: Timed out while starting runtime");
                } else {
                    this.setStatus("ERROR", "Error:" + e.toString());
                }
    
                msg.__isError = true;
                msg.__error = e;
            }
    
    
            return msg;
        }

    }
}

module.exports = CreateRuntime;
