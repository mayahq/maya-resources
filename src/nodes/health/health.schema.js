const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require("../../util/axios"); // Define your axios instance in the utils folder

class Health extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            masterKey:
                "eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a",
        });
    }

    static schema = new Schema({
        name: "health",
        label: "Health",
        category: "Maya",
        isConfig: false,
        fields: {
            action: new fields.SelectFieldSet({
                optionNameMap: { health_check: "Health Check" },
                fieldSets: { health_check: {} },
            }),
        },
        color: "#37B954",
    });

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Making request...");
        let requestConfig = {};

        if ((vals.action.selected = "health_check")) {
            requestConfig = {
                url: `/health`,
                method: "get",
                data: {},
            };
        }

        try {
            const response = await axios(requestConfig);
            msg.payload = response.data;
            this.setStatus("SUCCESS", "Done");
        } catch (e) {
            console.log("There was an error making the request:", e);
            this.setStatus(
                "ERROR",
                "There was an error making the request:" + e.toString()
            );
        }
        return msg;
    }
}

module.exports = Health;
