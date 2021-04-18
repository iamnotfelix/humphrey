require('dotenv').config()
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const engine = require('ejs-mate');

const { getData } = require('./utils/utils.js');
const Artist = require('./models/artists.js');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

app.engine('ejs', engine);

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
    res.render('main.ejs',{result: undefined});
})

app.get('/juiceWRLD', (req,res) => 
{
    res.render('juiceWRLD.ejs');
});

app.get('/error', (req,res) =>
{
    res.send('some error...');
})

app.get('/:id', async (req,res) =>
{
    const id = req.params.id;
    if(id)
    {
        let dbInfo = await Artist.findOne({artistId: id});
        if(dbInfo)
        {
            let degree = dbInfo.degree;
            let result = {
                degree: degree, 
                artistName: dbInfo.name,
                links: []
            };
            while(degree != 0)
            {
                const rand = Math.floor( Math.random() * dbInfo.artistReach.length); //////////////////for a random reach of artist(work in progress)
                result.links.push(dbInfo.artistReach[rand]);
                dbInfo = await Artist.findOne({artistId: dbInfo.artistReach[rand].artistId});
                degree = dbInfo.degree;
            }
            res.render('main.ejs', {result});
        }
        else
        {
            console.log('artist not found in database');
            res.render('main.ejs',{result: 'Artist not found'});
        }
    }
    else res.render('main.ejs',{result: undefined});
})

app.post('/search', async (req,res) =>
{
    const search = req.body.search;
    if(search)
    {
        const data = await getData(search);
        if(data.artists.items.length  === 0) 
        {
            console.log('artist not found by api'); 
            res.render('main.ejs',{result: 'Artist not found'});
        }
        else
        {
            const artistId = data.artists.items[0].id;
            res.redirect(`/${artistId}`);
        }
    }
    else res.redirect('/');
});

app.listen(8080, () => 
{
    console.log('Server listening at 8080');
});
