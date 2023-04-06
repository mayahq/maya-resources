const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require("../../util/axios");
const WorkspaceClient = require("../../util/workspace");

const MayaResourcesAuth = require("../mayaResourcesAuth/mayaResourcesAuth.schema");

class DeleteRuntime extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            masterKey:
                "eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a",
        });
    }

    static schema = new Schema({
        name: "delete-runtime",
        label: "Delete Worker",
        category: "Maya :: Runtime",
        isConfig: false,
        fields: {
            auth: new fields.ConfigNode({
                type: MayaResourcesAuth,
                displayName: "Auth",
            }),

            runtimeId: new fields.Typed({
                type: "str",
                allowedTypes: ["msg", "flow", "global"],
                defaultVal: "abc",
                displayName: "Runtime ID",
            }),
        },
        color: "#37B954",
    });

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Deleting...");
        const client = new WorkspaceClient({
            backendBaseUrl: this.mayaBackendUrl,
            apiKey: this.credentials.auth.key,
        })

        try {
            const responseData = await client.deleteWorkspace(vals.runtimeId);
            msg.payload = responseData
            this.setStatus('SUCCESS', 'Done')
        } catch (e) {
            this.setStatus("ERROR", "Error:" + e.toString());
            msg.__isError = true;
            msg.__error = e;
        }

        return msg;
    }
}

module.exports = DeleteRuntime;
