require('dotenv').config({path: '../.env'});    

const generalConfig = {
    PORT: process.env.PORT || 3000,
}

module.exports = generalConfig;