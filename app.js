require('dotenv').config()
const express = require('express');
const path = require('path');
const queryString = require('query-string');
const cookieParser = require('cookie-parser');
const request = require('request');
const mongoose = require('mongoose');

const {generateString} = require('./utils/utils.js');

const app = express();

//app.use(express.static(path.join(__dirname,'/public')));
app.use(express.json());
app.use(cookieParser());

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

// app.use(urlencoded)

mongoose.connect('mongodb://localhost:27017/spotify-api-project', 
{
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Database connected');
});

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const state_key = 'spotify_auth_state';
const redirect_uri = 'http://localhost:8080/callback';
//const scope = 'user-read-private';
const tok = 'access_token';

const sc = 'ugc-image-upload user-read-recently-played user-top-read user-read-playback-position user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control streaming playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative user-follow-modify user-follow-read user-library-modify user-library-read user-read-email user-read-private';

app.get('/', (req,res) =>
{
    res.render('index');
});

app.get('/login', (req, res) =>
{
    const state = generateString(16);
    res.cookie(state_key, state);
    res.redirect(
        'https://accounts.spotify.com/authorize?'+
        queryString.stringify(
        {
            client_id: client_id,
            response_type: 'code',
            redirect_uri: redirect_uri,
            state: state,
            scope: sc
        })
    );
});

app.get('/callback', (req,res) =>
{
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[state_key] : null;
    
    if (state === null || state !== storedState) {
        res.redirect('/error?' +
          queryString.stringify({
            error: 'state_mismatch'
          }));
    }
    else
    {
        res.clearCookie(state_key);
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) 
        {    
            
            if (!error && response.statusCode === 200) 
            {
                const access_token = body.access_token
                const refresh_token = body.refresh_token;

                res.cookie(tok, access_token);
                
                const options = {
                  url: 'https://api.spotify.com/v1/me',
                  headers: { 'Authorization': 'Bearer ' + access_token },
                  json: true
                };
                request.get(options, function(error, response, body) {
                    res.send(body);
                });
            }      
        });
    }
});

app.get('/refresh_token', function(req, res) {

    const refresh_token = req.query.refresh_token;
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };
    
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        const access_token = body.access_token;
        res.send({
          'access_token': access_token
        });
      }
    });
});

app.get('/error', (req,res) =>
{
    res.send(req.query.error);
});

app.listen(8080, () => 
{
    console.log('Server listening at 8080');
});
