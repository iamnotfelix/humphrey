require('dotenv').config()
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const engine = require('ejs-mate');

const { getData } = require('./utils/utils.js');
const Artist = require('./models/artists.js');

const app = express();

//app.use(express.static(path.join(__dirname,'/public')));
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

app.get('/about', (req,res) => 
{
    res.render('about.ejs');
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
                const rand = Math.random(); //////////////////for a random reach of artist(work in progress)
                result.links.push(dbInfo.artistReach[0]);
                dbInfo = await Artist.findOne({artistId: dbInfo.artistReach[0].artistId});
                degree = dbInfo.degree;
            }
            // console.log('artist found in the database');
            res.render('main.ejs', {result});
        }
        else
        {
            console.log('artist not found in database');
            res.redirect('/error');
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
            res.redirect('/error');
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
