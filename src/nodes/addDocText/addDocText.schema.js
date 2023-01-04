const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require("../../util/axios");

const MayaResourcesAuth = require("../mayaResourcesAuth/mayaResourcesAuth.schema");

class AddDocText extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            masterKey:
                "eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a",
        });
    }

    static schema = new Schema({
        name: "add-doc-text",
        label: "Add Doc Text",
        category: "Maya :: Document",
        isConfig: false,
        fields: {
            auth: new fields.ConfigNode({
                type: MayaResourcesAuth,
                displayName: "Auth",
            }),

            storage_mode: new fields.Typed({
                type: "str",
                allowedTypes: ["msg", "flow", "global"],
                defaultVal: "elastic",
                displayName: "Storage Mode",
            }),

            documents: new fields.Typed({
                type: "json",
                allowedTypes: ["msg", "flow", "global", "json"],
                defaultVal: [],
                displayName: "Documents",
            }),

            source_type: new fields.Typed({
                type: "str",
                allowedTypes: ["msg", "flow", "global", "str"],
                defaultVal: "abc",
                displayName: "Source Type",
            }),
        },
        color: "#37B954",
    });

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Processing...");

        const request = {
            url: `/v1/library/document/add-docs`,
            method: "post",
            data: {
                storage_mode: vals.storage_mode,
                documents: vals.documents,
                source_type: vals.source_type,
            },

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

module.exports = AddDocText;
