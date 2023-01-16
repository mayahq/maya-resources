let MAYA_PAC_URL = 'http://localhost:8000'
let PAC_COMMS_URL = 'ws://localhost:8080/socket'

if (process.env.RUNTIME_ENVIRONMENT === 'PRODUCTION') {
    MAYA_PAC_URL = 'https://api.mayalabs.io/pac'
    PAC_COMMS_URL = 'wss://paccomms.pac.mayalabs.io/socket'
} else if (process.env.RUNTIME_ENVIRONMENT === 'STAGING') {
    MAYA_PAC_URL = 'https://api.dev.mayalabs.io/pac'
    PAC_COMMS_URL = 'wss://paccomms.pac.dev.mayalabs.io/socket'
}

if (process.env.PAC_COMMS_URL) {
    PAC_COMMS_URL = process.env.PAC_COMMS_URL
}

module.exports = {
    MAYA_PAC_URL,
    PAC_COMMS_URL
}