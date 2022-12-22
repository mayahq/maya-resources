const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk');
const axios = require('../../util/axios');
const MayaResourcesAuth = require('../mayaResourcesAuth/mayaResourcesAuth.schema');

class DeploySession extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        })
    }

    static schema = new Schema({
        name: 'deploy-session',
        label: 'Deploy Session',
        category: 'maya :: Session',
        isConfig: false,
        fields: {
            auth: new fields.ConfigNode({
                type: MayaResourcesAuth,
                displayName: "Auth",
            }),
            workspaceId: new fields.Typed({
                type: "str",
                allowedTypes: ["msg", "flow", "global"],
                defaultVal: "<enter Workspace ID>",
                displayName: "Workspace ID",
            }),
            sessionId: new fields.Typed({
                type: "str",
                allowedTypes: ["msg", "flow", "global"],
                defaultVal: "<enter Session ID>",
                displayName: "Session ID",
            }),
            // Whatever custom fields the node needs.
        },
        color: '#37B954'
    })

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Deploying...");
        const request = {
            url: `/v1/session/deploy`,
            method: "post",
            data: {
                workspace_id: vals.workspaceId,
                session_id: vals.sessionId,
            },
            headers: {
                Authorization: `apikey ${this.credentials.auth.key}`,
            }
        }

        try {
            const response = await axios(request)
            msg.payload = response.data
            this.setStatus("SUCCESS", "Deployed");
        } catch (e) {
            this.setStatus('ERROR', "Error deploying session:" + e.toString())
            console.log('There was an error deploying the session')
            if (e.response) {
                console.log(e.response.status, e.response.data)
            } else {
                console.log(e)
            }

            msg.__isError = true
            msg.__error = e
            return msg
        }
    }
}

module.exports = DeploySession