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
        const nodeSend = this.redNode.send

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
            const apiKeyHeader = req.headers['x-api-key']
            if (!authHeader && !apiKeyHeader) {
                return res.status(401).send('Unauthorized')
            }

            let token = ''
            if (authHeader) {
                token = authHeader.split(' ')[1]
            } else {
                token = apiKeyHeader
            }

            console.log('got token:', token)

            tokenAuthFn(token)
                .then(user => {
                    if (!user) {
                        return res.status(401).send('Unauthorized')
                    }

                    console.log('got user', user)
                    next()
                })
                .catch(err => {
                    console.log('Error identifying user')
                    if (err.response) {
                        console.log(err.response.status, err.response.data)
                    } else {
                        console.log(err)
                    }

                    return res.status(500).send('Internal Server Error')
                })
        }

        console.log('Starting endpoint listener')
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

                console.log('we here now too')
                this.redNode.warn('before send ' + this.redNode.id)
                console.log('node is', this.redNode)
                console.log('_flow is', this.redNode._flow)
                this.redNode.send({
                    payload: req.body,
                    abc: 1,
                    _msgid: this.RED.util.generateId()
                    // __returnResponse
                })
                this.redNode.warn('after send')
                console.log('wtf?', this.redNode.send)
            },
            (err,req,res,next) => {
                this.redNode.warn(err)
            }
        )
        console.log('Listening now')

        // Unregister the route when the flow stops
        this.redNode.on('close', function() {
            console.log('Running close handler')
            console.log('stack:', this.RED.httpNode._router.stack)
            this.RED.httpNode._router.stack.forEach((route, i, routes) => {
                if (
                    route.route && 
                    route.route.path.contains('send-maya-message') &&
                    route.route.methods['post']
                ) {
                    console.log('Removing route', route.route)
                    routes.splice(i, 1)
                }
            })
        })
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        // Handle the message. The returned value will
        // be sent as the message to any further nodes.

    }
}

module.exports = ReceiveMessage