const axios = require("axios");
const { MAYA_PAC_URL } = require("../constants");

console.log('axios base URL is', MAYA_PAC_URL)

module.exports = axios.create({
    baseURL: MAYA_PAC_URL,
});
