const axios = require('axios')

const axiosInstance = axios.create({
    baseURL: 'https://api.maya.com',
})

module.exports = axiosInstance