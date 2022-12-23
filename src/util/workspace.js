const axios = require('axios');
const { poll } = require('./poll');

class WorkspaceClient {
    constructor({ backendBaseUrl, apiKey }) {
        this.backendBaseUrl = backendBaseUrl
        this.apiKey = apiKey
    }

    async getWorkspace(workspaceId) {
        const request = {
            url: `${this.backendBaseUrl}/api/v2/brains/${workspaceId}`,
            method: "get",
            data: {},

            headers: {
                Authorization: `apikey ${this.apiKey}`,
            },
        };

        const response = await axios(request)
        return response.data
    }

    async createWorkspace(workspaceName, alias) {
        const createRequest = {
            url: `${this.backendBaseUrl}/api/v2/brains`,
            method: "post",
            data: {
                name: workspaceName,
                alias: alias,
                default: false,
                device: {
                    platform: 'cloud'
                }
            },
            headers: {
                Authorization: `apikey ${this.apiKey}`,
            },
        };

        const response = await axios(createRequest)
        return response.data
    }

    async startWorkspace(workspaceId) {
        const startRequest = {
            url: `${this.backendBaseUrl}/api/v2/brains/start`,
            method: 'post',
            data: {
                _id: workspaceId
            },
            headers: {
                Authorization: `apikey ${this.apiKey}`,
            }
        }

        console.log('startRequest', startRequest)

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

        await poll(startConfirmationFunction, 1000, 120000)
        return startResponse.data
    }
}

module.exports = WorkspaceClient