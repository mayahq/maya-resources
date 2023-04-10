/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

const axios = require('axios')
const { AUTH_SERVICE_URL } = require('../../constants')


const checkTokens = async (req) => {
    const authHeader = req.headers['Authorization']
    const apiKey = req.headers['x-api-key']


    if (!authHeader && !apiKey) {
        return false
    }

    const request = {
        url: `${AUTH_SERVICE_URL}/auth/validate`,
        method: 'POST',
        headers: {}
    }

    if (apiKey) {
        request.headers['x-api-key'] = apiKey
    } else if (authHeader) {
        request.headers['Authorization'] = authHeader
    }

    try {
        const response = await axios(request)
        const userDetails = response.data.user
        const { access } = userDetails

        console.log('the owner', process.env.OWNER_ID)
        console.log('the access', access)
        return access.some(accessDetails => accessDetails.slug === process.env.OWNER_ID)
    } catch (e) {
        if (e.response) {
            console.log('Receive node: Error sending auth request', e.response.status, e.response.data)
        } else {
            console.log('Receive node: Error sending auth request', e)
        }
        return false
    }
}

module.exports = function (RED) {
	'use strict';
	var bodyParser = require('body-parser');
	var getBody = require('raw-body');
	var cors = require('cors');
	var onHeaders = require('on-headers');
	var typer = require('content-type');
	var mediaTyper = require('media-typer');
	var isUtf8 = require('is-utf8');

	function rawBodyParser(req, res, next) {
		if (req.skipRawBodyParser) {
			next();
		} // don't parse this if told to skip
		if (req._body) {
			return next();
		}
		req.body = '';
		req._body = true;

		var isText = true;
		var checkUTF = false;

		if (req.headers['content-type']) {
			var contentType = typer.parse(req.headers['content-type']);
			if (contentType.type) {
				var parsedType = mediaTyper.parse(contentType.type);
				if (parsedType.type === 'text') {
					isText = true;
				} else if (
					parsedType.subtype === 'xml' ||
					parsedType.suffix === 'xml'
				) {
					isText = true;
				} else if (parsedType.type !== 'application') {
					isText = false;
				} else if (
					parsedType.subtype !== 'octet-stream' &&
					parsedType.subtype !== 'cbor' &&
					parsedType.subtype !== 'x-protobuf'
				) {
					checkUTF = true;
				} else {
					// application/octet-stream or application/cbor
					isText = false;
				}
			}
		}

		getBody(
			req,
			{
				length: req.headers['content-length'],
				encoding: isText ? 'utf8' : null,
			},
			function (err, buf) {
				if (err) {
					return next(err);
				}
				if (!isText && checkUTF && isUtf8(buf)) {
					buf = buf.toString();
				}
				req.body = buf;
				next();
			}
		);
	}

	function createResponseWrapper(node, res) {
		var wrapper = {
			_res: res,
		};
		var toWrap = [
			'append',
			'attachment',
			'cookie',
			'clearCookie',
			'download',
			'end',
			'format',
			'get',
			'json',
			'jsonp',
			'links',
			'location',
			'redirect',
			'render',
			'send',
			'sendfile',
			'sendFile',
			'sendStatus',
			'set',
			'status',
			'type',
			'vary',
		];
		toWrap.forEach(function (f) {
			wrapper[f] = function () {
				node.warn(
					RED._('httpin.errors.deprecated-call', {
						method: 'msg.res.' + f,
					})
				);
				var result = res[f].apply(res, arguments);
				if (result === res) {
					return wrapper;
				} else {
					return result;
				}
			};
		});
		return wrapper;
	}

	var corsHandler = function (req, res, next) {
		next();
	};

	if (RED.settings.httpNodeCors) {
		corsHandler = cors(RED.settings.httpNodeCors);
		RED.httpNode.options('*', corsHandler);
	}

	function ReceiveMessage(config) {
		RED.nodes.createNode(this, config);
		if (RED.settings.httpNodeRoot !== false) {
			this.url = '/send-maya-message';
			this.method = 'post';

			var node = this;

			this.errorHandler = function (err, req, res, next) {
				node.warn(err);
				res.sendStatus(500);
			};

			this.callback = async function (req, res) {
				node.sendExecStatus('running')
				var msgid = RED.util.generateId();
				res._msgid = msgid;

                const isAuthorized = await checkTokens(req)
                if (!isAuthorized) {
                    return res.status(401).send('Unauthorized')
                }

				const receivedMsg = req.body.data
				node.send({
					_msgid: msgid,
					req: req,
					res: createResponseWrapper(node, res),
					payload: req.body,
					...receivedMsg
				});

				node.sendExecStatus('done')
			};

			var httpMiddleware = function (req, res, next) {
				next();
			};

			if (RED.settings.httpNodeMiddleware) {
				if (
					typeof RED.settings.httpNodeMiddleware === 'function' ||
					Array.isArray(RED.settings.httpNodeMiddleware)
				) {
					httpMiddleware = RED.settings.httpNodeMiddleware;
				}
			}

			var maxApiRequestSize = RED.settings.apiMaxLength || '5mb';
			var jsonParser = bodyParser.json({ limit: maxApiRequestSize });

			var metricsHandler = function (req, res, next) {
				next();
			};
			if (this.metric()) {
				metricsHandler = function (req, res, next) {
					var startAt = process.hrtime();
					onHeaders(res, function () {
						if (res._msgid) {
							var diff = process.hrtime(startAt);
							var ms = diff[0] * 1e3 + diff[1] * 1e-6;
							var metricResponseTime = ms.toFixed(3);
							var metricContentLength = res.getHeader('content-length');
							//assuming that _id has been set for res._metrics in HttpOut node!
							node.metric(
								'response.time.millis',
								{ _msgid: res._msgid },
								metricResponseTime
							);
							node.metric(
								'response.content-length.bytes',
								{ _msgid: res._msgid },
								metricContentLength
							);
						}
					});
					next();
				};
			}

			RED.httpNode.post(
				this.url,
				httpMiddleware,
				corsHandler,
				metricsHandler,
				jsonParser,
				rawBodyParser,
				this.callback,
				this.errorHandler
			);

			this.on('close', function () {
				var node = this;
				RED.httpNode._router.stack.forEach(function (route, i, routes) {
					if (
						route.route &&
						route.route.path === node.url &&
						route.route.methods[node.method]
					) {
						routes.splice(i, 1);
					}
				});
			});
		} else {
			this.warn(RED._('httpin.errors.not-created'));
		}
	}
	RED.nodes.registerType('receive-message', ReceiveMessage);
};
