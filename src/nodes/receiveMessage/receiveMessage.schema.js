const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')

var bodyParser = require("body-parser");
var cors = require("cors");

class ReceiveMessage extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        })
    }

    static schema = new Schema({
        name: 'receive-message',
        label: 'Receive Message',
        category: 'Maya :: Runtime',
        isConfig: false,
        fields: {
            respondImmediately: new fields.Typed({
                type: 'bool',
                allowedTypes: ['bool', 'msg', 'flow', 'global'],
                displayName: 'Respond Immediately',
                defaultVal: false
            })
            // Whatever custom fields the node needs.
        },
        io: {
            inputs: 0,
            outputs: 1
        },
        color: '#37B954',
    })

    onInit() {
        const corsHandler = cors(this.RED.settings.httpNodeCors);
        this.RED.httpNode.options("*", corsHandler);

        const maxApiRequestSize = "1024mb";
        const jsonParser = bodyParser.json({ limit: maxApiRequestSize })
        const urlencParser = bodyParser.urlencoded({
            limit: maxApiRequestSize,
            extended: true,
          });

        const tokenAuthFn = this.RED.settings.adminAuth.tokens
        const tokenAuthMiddleware = (req, res, next) => {
            console.log('got req headers', req.headers)
            const authHeader = req.headers.authorization
            if (!authHeader) {
                return res.status(401).send('Unauthorized')
            }

            const token = authHeader.split(' ')[1]
            tokenAuthFn(token)
                .then(user => {
                    if (!user) {
                        return res.status(401).send('Unauthorized')
                    }

                    next()
                })
                .catch(err => {
                    console.log('Error identifying user')
                    if (err.response) {
                        console.log(err.response.status, err.response.data)
                    } else {
                        console.log(err)
                    }

                    return res.status()
                })
        }

        this.RED.httpNode.post(
            '/send-maya-message',
            tokenAuthMiddleware,
            corsHandler,
            jsonParser,
            urlencParser,
            (req, res) => {
                console.log('received message data:', req.body)
                const __returnResponse = (response) => {
                    res.status(200).send({
                        data: response,
                        from: this._mayaRuntimeId
                    })
                }

                this.redNode.send({
                    payload: req.body,
                    __returnResponse
                })
            }
        )
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        // Handle the message. The returned value will
        // be sent as the message to any further nodes.

    }
}

module.exports = ReceiveMessage