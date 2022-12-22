const MAYA_BACKEND_URL = process.env.MAYA_BACKEND_URL || 'http://localhost:5000'
const MAYA_PAC_URL = process.env.PAC_SERVER_BASEURL || 'http://localhost:8000'

module.exports = {
    MAYA_BACKEND_URL,
    MAYA_PAC_URL
}