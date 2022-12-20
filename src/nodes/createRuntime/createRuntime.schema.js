const { Node, Schema, fields } = require("@mayahq/module-sdk");
const axios = require('axios');
const MayaResourcesAuth = require("../mayaResourcesAuth/mayaResourcesAuth.schema");
const { MAYA_BACKEND_URL } = require("../../constants");
const { poll } = require("../../util/poll");

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
        category: "maya :: Runtime",
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

        const createRequest = {
            url: `${MAYA_BACKEND_URL}/api/v2/brains`,
            method: "post",
            data: {
                name: vals.workspaceName,
                default: false,
                device: {
                    platform: 'cloud'
                }
            },
            headers: {
                Authorization: `apikey ${this.credentials.auth.key}`,
            },
        };

        try {
            const createResponse = await axios(createRequest);
            // msg.payload = createResponse.data;
            const brain = createResponse.data.results
            if (!vals.startAfterCreate) {
                this.setStatus("SUCCESS", "Done");
                return msg;
            }

            const startRequest = {
                url: `${MAYA_BACKEND_URL}/api/v2/brains/start`,
                method: 'post',
                data: {
                    _id: brain._id
                },
                headers: {
                    Authorization: `apikey ${this.credentials.auth.key}`,
                }
            }

            const startResponse = await axios(startRequest);
            const startConfirmationFunction = async () => {
                try {
                    const healthStateResponse = await axios({
                        url: startResponse['data']['results']['url'] + `/health?timesamp=${Date.now()}`,
                        method: 'get',
                        validateStatus: function (status) {
                            return status;
                        },
                        timeout: 2000,
                    });
                    return healthStateResponse.status === 200;
                } catch (e) {
                    return false
                }
            }

            let num = 0
            let dots = ['', '.', '..', '...']
            const interval = setInterval(() => {
                this.setStatus("PROGRESS", `Starting runtime${dots[num % 4]}`)
                num++
            }, 1000)

            try {
                await poll(startConfirmationFunction, 1000, 120000);
                clearInterval(interval)
            } catch (e) {
                clearInterval(interval)
                if (e.type === 'TIMED_OUT') {
                    this.setStatus("ERROR", "Timed out waiting for runtime to start");
                } else {
                    this.setStatus('ERROR', 'Unexpected error: ' + e.toString())
                }
                
                msg.__isError = true;
                msg.__error = e;
                return msg;
            }

            this.setStatus("SUCCESS", "Done");
        } catch (e) {
            this.setStatus("ERROR", "Error:" + e.toString());
            msg.__isError = true;
            msg.__error = e;
        }

        return msg;
    }
}

module.exports = CreateRuntime;
