let MAYA_PAC_URL = 'http://localhost:8000'
if (process.env.RUNTIME_ENVIRONMENT === 'PRODUCTION') {
    MAYA_PAC_URL = 'https://api.mayalabs.io/pac/api'
} else if (process.env.RUNTIME_ENVIRONMENT === 'STAGING') {
    MAYA_PAC_URL = 'https://api.dev.mayalabs.io/pac/api'
}

module.exports = {
    MAYA_PAC_URL
}