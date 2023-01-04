const { Node, Schema, fields } = require("@mayahq/module-sdk");
const { MAYA_PAC_URL } = require("../../constants");
const axios = require("../../util/axios");

const MayaResourcesAuth = require("../mayaResourcesAuth/mayaResourcesAuth.schema");

class NewSession extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            masterKey:
                "eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a",
        });
    }

    static schema = new Schema({
        name: "new-session",
        label: "New Session",
        category: "Maya :: Session",
        isConfig: false,
        fields: {
            auth: new fields.ConfigNode({
                type: MayaResourcesAuth,
                displayName: "Auth",
            }),

            from_recipe: new fields.Typed({
                type: "str",
                allowedTypes: ["msg", "flow", "global", "str"],
                defaultVal: "abc",
                displayName: "From Recipe",
            }),
        },
        color: "#37B954",
    });

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Processing...");

        const request = {
            url: `/v1/session/new`,
            method: "post",
            data: {
                from_recipe: vals.from_recipe,
            },

            headers: {
                'x-api-key': this.credentials.auth.key,
            },
        };

        console.log(MAYA_PAC_URL)

        try {
            console.log('the request', request)
            const response = await axios(request);
            msg.payload = response.data;
            this.setStatus("SUCCESS", "Done");
        } catch (e) {
            this.setStatus("ERROR", "Error:" + e.toString());
            msg.__isError = true;
            msg.__error = e;
        }

        return msg;
    }
}

module.exports = NewSession;
