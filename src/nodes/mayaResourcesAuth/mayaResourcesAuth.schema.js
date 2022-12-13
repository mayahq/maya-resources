const { Node, Schema, fields } = require("@mayahq/module-sdk");

class MayaResourcesAuth extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
        });
    }

    static schema = new Schema({
        name: "maya-resources-auth",
        label: "Maya Resources :: Auth",
        category: "config",
        isConfig: true,
        fields: {},
        redOpts: {
            credentials: {
                key: new fields.Credential({ type: "str", password: true }),
            },
        },
    });

    async onMessage(msg, vals) {}
}

module.exports = MayaResourcesAuth;
