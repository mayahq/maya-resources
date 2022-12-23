const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require('axios');
const MayaResourcesAuth = require("../mayaResourcesAuth/mayaResourcesAuth.schema");
const { poll } = require("../../util/poll");
const WorkspaceClient = require("../../util/workspace");

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
        label: "Create Runtime",
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
                displayName: "Workspace Name",
                defaultVal: "",
                required: true,
            }),
            startAfterCreate: new fields.Typed({
                type: "bool",
                allowedTypes: ["msg", "flow", "global"],
                displayName: "Start After Create",
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

        let interval = null
        try {
            // Create the workspace here
            const createResponseData = await client.createWorkspace(vals.workspaceName, null);
            msg.payload = createResponseData

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

module.exports = CreateRuntime;
