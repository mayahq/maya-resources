const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require("../../util/axios"); // Define your axios instance in the utils folder

class Runtime extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            masterKey:
                "eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a",
        });
    }

    static schema = new Schema({
        name: "runtime",
        label: "Runtime",
        category: "Maya",
        isConfig: false,
        fields: {
            action: new fields.SelectFieldSet({
                optionNameMap: {
                    create_runtime: "Create Runtime",
                    get_runtime: "Get Runtime",
                    delete_runtime: "Delete Runtime",
                    list_runtime: "List Runtime",
                },
                fieldSets: {
                    create_runtime: {},
                    get_runtime: {
                        runtimeId_1: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global"],
                            defaultVal: "abc",
                            displayName: "Runtimeid",
                        }),
                    },
                    delete_runtime: {
                        runtimeId_2: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global"],
                            defaultVal: "abc",
                            displayName: "Runtimeid",
                        }),
                    },
                    list_runtime: {},
                },
            }),
        },
        color: "#37B954",
    });

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Making request...");
        let requestConfig = {};

        if ((vals.action.selected = "create_runtime")) {
            requestConfig = {
                url: `/api/v1/library/runtime/new`,
                method: "post",
                data: {},
            };
        }

        if ((vals.action.selected = "get_runtime")) {
            requestConfig = {
                url: `/api/v1/library/runtime/${vals.action.childValues.runtimeId_1}`,
                method: "get",
                data: {},
            };
        }

        if ((vals.action.selected = "delete_runtime")) {
            requestConfig = {
                url: `/api/v1/library/runtime/${vals.action.childValues.runtimeId_2}`,
                method: "delete",
                data: {},
            };
        }

        if ((vals.action.selected = "list_runtime")) {
            requestConfig = {
                url: `/api/v1/library/runtimes`,
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

module.exports = Runtime;
