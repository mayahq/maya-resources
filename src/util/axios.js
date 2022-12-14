const axios = require("axios");

module.exports = axios.create({
    baseURL: process.env.PACSERVER_URL ? `${process.env.PACSERVER_URL}` : "http://localhost:8000",
});
