const { Node, Schema, fields } = require("@mayahq/module-sdk");
const { MAYA_BACKEND_URL } = require("../../constants");
const axios = require("../../util/axios");

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
        label: "Delete Runtime",
        category: "maya :: Runtime",
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

        const request = {
            url: `${MAYA_BACKEND_URL}/api/v2/brains/${vals.runtimeId}`,
            method: "delete",
            data: {},

            headers: {
                Authorization: `apikey ${this.credentials.auth.key}`,
            },
        };

        try {
            const response = await axios(request);
            msg.payload = response.data;
            this.setStatus("SUCCESS", "Deleted");
        } catch (e) {
            this.setStatus("ERROR", "Error:" + e.toString());
            msg.__isError = true;
            msg.__error = e;
        }

        return msg;
    }
}

module.exports = DeleteRuntime;
