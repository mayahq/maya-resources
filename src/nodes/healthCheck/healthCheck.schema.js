const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require("../../util/axios");

class HealthCheck extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            masterKey:
                "eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a",
        });
    }

    static schema = new Schema({
        name: "health-check",
        label: "Health Check",
        category: "maya :: Health",
        isConfig: false,
        fields: {},
        color: "#37B954",
    });

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Processing...");

        const request = {
            url: `/health`,
            method: "get",
            data: {},
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

module.exports = HealthCheck;
