let MAYA_PAC_URL = 'http://localhost:8000'
let PAC_COMMS_URL = 'ws://localhost:8080/socket'
let AUTH_SERVICE_URL = 'https://authservice.dev.mayalabs.io'

if (process.env.RUNTIME_ENVIRONMENT === 'PRODUCTION') {
    MAYA_PAC_URL = 'https://api.mayalabs.io/pac'
    PAC_COMMS_URL = 'wss://paccomms.pac.mayalabs.io/socket'
    AUTH_SERVICE_URL = 'http://authservice.default:9000'
} else if (process.env.RUNTIME_ENVIRONMENT === 'STAGING') {
    MAYA_PAC_URL = 'https://api.mayalabs.io/pac'
    PAC_COMMS_URL = 'wss://paccomms.prod.dev.mayalabs.io/socket'
    AUTH_SERVICE_URL = 'http://authservice.default:9000'
}

// MAYA_PAC_URL = 'https://api.dev.mayalabs.io/pac'
// PAC_COMMS_URL = 'wss://paccomms.pac.dev.mayalabs.io/socket'


if (process.env.PAC_COMMS_URL) {
    PAC_COMMS_URL = process.env.PAC_COMMS_URL
}

if (process.env.AUTH_SERVICE_URL) {
    AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL
}

module.exports = {
    MAYA_PAC_URL,
    PAC_COMMS_URL,
    AUTH_SERVICE_URL
}