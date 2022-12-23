const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require("../../util/axios");

const MayaResourcesAuth = require("../mayaResourcesAuth/mayaResourcesAuth.schema");

class TeachStep extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            masterKey:
                "eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a",
        });
    }

    static schema = new Schema({
        name: "teach-step",
        label: "Teach Step",
        category: "Maya :: Step",
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

            step_subflows: new fields.Typed({
                type: "json",
                allowedTypes: ["msg", "flow", "global", "json"],
                defaultVal: [],
                displayName: "Step Subflows",
            }),

            suggest_tests: new fields.Typed({
                type: "bool",
                allowedTypes: ["msg", "flow", "global", "bool"],
                defaultVal: false,
                displayName: "Suggest Tests",
            }),
        },
        color: "#37B954",
    });

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Processing...");

        const request = {
            url: `/v1/library/step/teach?suggest_tests=${vals.suggest_tests}`,
            method: "post",
            data: {
                storage_mode: vals.storage_mode,
                step_subflows: vals.step_subflows,
            },

            headers: {
                Authorization: `apikey ${this.credentials.auth.key}`,
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

module.exports = TeachStep;
