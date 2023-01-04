const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require("../../util/axios");

const MayaResourcesAuth = require("../mayaResourcesAuth/mayaResourcesAuth.schema");

class Recommend extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            masterKey:
                "eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a",
        });
    }

    static schema = new Schema({
        name: "recommend",
        label: "Recommend",
        category: "Maya :: Document",
        isConfig: false,
        fields: {
            auth: new fields.ConfigNode({
                type: MayaResourcesAuth,
                displayName: "Auth",
            }),

            q: new fields.Typed({
                type: "str",
                allowedTypes: ["msg", "flow", "global", "str"],
                defaultVal: "",
                displayName: "Q",
            }),
        },
        color: "#37B954",
    });

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Processing...");

        const request = {
            url: `/v1/library/document/recommend?q=${vals.q}`,
            method: "get",
            data: {},

            headers: {
                'x-api-key': this.credentials.auth.key,
            },
        };

        try {
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

module.exports = Recommend;
