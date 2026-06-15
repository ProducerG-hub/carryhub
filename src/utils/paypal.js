const axios = require('axios');

async function generateAccessToken() {

    const auth = Buffer
        .from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        )
        .toString('base64');

    const response = await axios.post(

        `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,

        'grant_type=client_credentials',

        {
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    );

    return response.data.access_token;
}

module.exports = {
    generateAccessToken
};