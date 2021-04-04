module.exports.generateString = (size) =>
{
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for(let i=0;i< size;i ++)
    {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
}

require('dotenv').config({path: '../.env'});
const fetch = require('node-fetch');
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
//console.log(client_secret);

const APIControler = async () =>
{
    const _getToken = async() =>
    {
        const url = 'https://accounts.spotify.com/api/token';
        const client = Buffer.from(client_id + ':' + client_secret).toString('base64');
        
        const options = 
        {
            method: 'POST',
            headers:
            {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Authorization' : 'Basic ' + client
            },
            body: 'grant_type=client_credentials'
        }   
        const result = await fetch(url, options);
        const data = await result.json();
        return data.access_token;  
    }
    const _getArtist = async (token, artistName) =>
    {
        const type='artist'
        const url = `https://api.spotify.com/v1/search?q=${artistName}&type=${type}`;
        const options = 
        {
            method: 'GET',
            headers:
            { 
                'Authorization' : 'Bearer ' + token
            }
        }
        //console.log(token);
        const result = await fetch(url, options);
        const data = await result.json();
        //console.log(data);
        return data;
    }
    return{
        getToken() {
            return _getToken();
        },
        getArtist(token, artistName) {
            return _getArtist(token, artistName);
        }
    }
}

module.exports.getData = async (artistName) =>
{
    const controler = await APIControler();
    const token = await controler.getToken();
    const data = await controler.getArtist(token, artistName);
    return data;
}