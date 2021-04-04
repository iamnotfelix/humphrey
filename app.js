require('dotenv').config()
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const { getData } = require('./utils/utils.js');
const Artist = require('./models/artists.js');

const app = express();

//app.use(express.static(path.join(__dirname,'/public')));
app.use(express.json());
app.use(cookieParser());

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded());

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

app.get('/', (req,res) =>
{
    res.render('main.ejs');
})

app.post('/search', async (req,res) =>
{
    const search = req.body.search;
    const data = await getData(search);
    if(data.artists.items.length  === 0) 
    {
        console.log('artist not found by api'); 
        res.redirect('/error');
    }
    else
    {
        const artistId = data.artists.items[0].id;
        let dbInfo = await Artist.findOne({artistId: artistId}).populate('trackId');
        if(dbInfo)
        {
            let degree = dbInfo.degree;
            let result = {
                degree: degree,
                links: []
            };
            //console.log(dbInfo);
            while(degree != 0)
            {
                const rand = Math.random(); //////////////////for a random reach of artist(work in progress)
                result.links.push(dbInfo.artistReach[0]);
                dbInfo = await Artist.findOne({artistId: dbInfo.artistReach[0].artistId});
                degree = dbInfo.degree;
            }
            res.render('show.ejs', {result});
        }
        else
        {
            console.log('artist not found in database');
            res.redirect('/error');
        }
    }
    
});

app.get('/error', (req,res) =>
{
    res.send('some error ...');
})

app.listen(8080, () => 
{
    console.log('Server listening at 8080');
});
