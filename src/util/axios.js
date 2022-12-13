const axios = require("axios");

module.exports = axios.create({
    baseURL: "https://api.dev.mayalabs.io",
});
