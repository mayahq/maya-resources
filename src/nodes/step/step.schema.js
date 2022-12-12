const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require("../../util/axios"); // Define your axios instance in the utils folder

class Step extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            masterKey:
                "eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a",
        });
    }

    static schema = new Schema({
        name: "step",
        label: "Step",
        category: "Maya",
        isConfig: false,
        fields: {
            action: new fields.SelectFieldSet({
                optionNameMap: {
                    add_step: "Add Step",
                    get_step: "Get Step",
                    update_step: "Update Step",
                    delete_step: "Delete Step",
                    list_steps: "List Steps",
                    teach_step: "Teach Step",
                },
                fieldSets: {
                    add_step: {},
                    get_step: {
                        stepId_1: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global"],
                            defaultVal: "abc",
                            displayName: "Stepid",
                        }),
                    },
                    update_step: {
                        stepId_2: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global"],
                            defaultVal: "abc",
                            displayName: "Stepid",
                        }),
                    },
                    delete_step: {
                        stepId_3: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global"],
                            defaultVal: "abc",
                            displayName: "Stepid",
                        }),
                    },
                    list_steps: {},
                    teach_step: {
                        request_body_5: new fields.Typed({
                            type: "str",
                            allowedTypes: ["msg", "flow", "global"],
                            defaultVal: "abc",
                            displayName: "undefined",
                        }),
                    },
                },
            }),
        },
        color: "#37B954",
    });

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Making request...");
        let requestConfig = {};

        if ((vals.action.selected = "add_step")) {
            requestConfig = {
                url: `/api/v1/library/step/new`,
                method: "post",
                data: {},
            };
        }

        if ((vals.action.selected = "get_step")) {
            requestConfig = {
                url: `/api/v1/library/step/${vals.action.childValues.stepId_1}`,
                method: "get",
                data: {},
            };
        }

        if ((vals.action.selected = "update_step")) {
            requestConfig = {
                url: `/api/v1/library/step/${vals.action.childValues.stepId_2}`,
                method: "put",
                data: {},
            };
        }

        if ((vals.action.selected = "delete_step")) {
            requestConfig = {
                url: `/api/v1/library/step/${vals.action.childValues.stepId_3}`,
                method: "delete",
                data: {},
            };
        }

        if ((vals.action.selected = "list_steps")) {
            requestConfig = {
                url: `/api/v1/library/steps`,
                method: "get",
                data: {},
            };
        }

        if ((vals.action.selected = "teach_step")) {
            requestConfig = {
                url: `/api/v1/library/step/teach`,
                method: "post",
                data: {
                    request_body: vals.action.childValues.request_body_5,
                },
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

module.exports = Step;
