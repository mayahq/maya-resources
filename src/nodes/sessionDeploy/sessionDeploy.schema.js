const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require("../../util/axios");
const WorkspaceClient = require("../../util/workspace");

const MayaResourcesAuth = require("../mayaResourcesAuth/mayaResourcesAuth.schema");

class SessionDeploy extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            masterKey:
                "eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a",
        });
    }

    static schema = new Schema({
        name: "session-deploy",
        label: "Session Deploy",
        category: "Maya :: Session",
        isConfig: false,
        fields: {
            auth: new fields.ConfigNode({
                type: MayaResourcesAuth,
                displayName: "Auth",
            }),

            session_id: new fields.Typed({
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

            workspace_id: new fields.Typed({
                type: "str",
                allowedTypes: ["msg", "flow", "global", "str"],
                defaultVal: "abc",
                displayName: "Worker Id",
            }),
        },
        color: "#37B954",
    });

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Processing...");

        const workspaceClient = new WorkspaceClient({
            apiKey: this.credentials.auth.key,
            backendBaseUrl: this.mayaBackendUrl
        })
        const globalContext = this.redNode.context().global
        let aliasWorkspaceMap = globalContext.get('workspaceByAlias')

        if (!aliasWorkspaceMap) {
            aliasWorkspaceMap = {}
            globalContext.set('workspaceByAlias', aliasWorkspaceMap)
        }

        let sessionId = null
        let workspaceId = null
        
        if (vals.session_id) {
            sessionId = vals.session_id
            workspaceId = vals.workspace_id

        } else if (vals.workspaceAlias) {
            const alias = vals.workspaceAlias
            try {
                const workspace = await workspaceClient.getWorkspaceByAlias(alias)
                sessionId = workspace.sessionId
                workspaceId = workspace._id
                aliasWorkspaceMap[alias] = workspace
                globalContext.set('workspaceByAlias', aliasWorkspaceMap)
            } catch (e) {
                console.log('Workspace not found, oops', e?.response?.status, e?.response?.data)
                msg.__isError = true
                msg.__error = e
                return msg
            }
        }

        const request = {
            url: `/v1/session/deploy`,
            method: "post",
            data: {
                session_id: sessionId,
                workspace_id: workspaceId,
            },

            headers: {
                'x-api-key': this.credentials.auth.key,
            },
        };

        console.log('###\n\ndeployRequest', request)
        try {
            const response = await axios(request);
            msg.payload = response.data;
            console.log('deployres:', response.data)
            this.setStatus("SUCCESS", "Done");
        } catch (e) {
            this.setStatus("ERROR", "Error:" + e.toString());
            msg.__isError = true;
            msg.__error = e;
        }

        return msg;
    }
}

module.exports = SessionDeploy;
