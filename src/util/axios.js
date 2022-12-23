const axios = require("axios");
const { MAYA_PAC_URL } = require("../constants");

module.exports = axios.create({
    baseURL: MAYA_PAC_URL,
});
