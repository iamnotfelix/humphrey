const {getData} = require('./utils.js');
const mongoose = require('mongoose');
const Artist = require('../models/artists.js');
const perf = require('execution-time')();
const fs = require('fs');

const cachePath = './cache.txt';
let forError;

perf.start();

//mongoose.connect('mongodb://localhost:27017/spotify-api-project', 
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

const getAllData = async (id) =>                                    //get all the tracks from all offsets
{
    let offset = 0;
    let offsetLimit = 20;
    let tracks = [];
    let token = undefined;
    while(offset <= offsetLimit)
    {
        const data = await getData(id, offset, token);
        token = data.token;
        offsetLimit = data._offset;
        data.tracks.forEach( element => tracks.push(element) );
        offset +=20;
    }
    return tracks;
}

const getCacheData = () =>
{
    const cache = fs.readFileSync(cachePath,'utf8');
    const cacheArray = cache.split(',');
    //console.log(cacheArray);
    const result = 
    {
        degree: parseInt(cacheArray[0]),
        ids: cacheArray.filter( (element, index) => 
        {
            if(index != 0 && index != cacheArray.length - 1)
                return true;
            else
                return false;
        }),
        error: cacheArray[cacheArray.length - 1] === 'error'
    }
    //console.log(result);
    return result;
}

const seedDB = async () =>
{
    const cache = getCacheData(),
    currentDegree = cache.degree,
    restIds = cache.ids,
    wasError = cache.error; 

    //await Artist.deleteMany({degree: {$gte: currentDegree} });
    //if(wasError || currentDegree === 0) await Artist.deleteMany({degree: {$gte: currentDegree} });
    //else 
        //await Artist.deleteMany({degree: {$gt: currentDegree} });
    if(currentDegree === 0)
    {
        const art = new Artist({
        name: 'Juice WRLD',
        artistId: '4MCBfE4596Uoi2O4DtmEMz',
        degree: 0
        });
        await art.save();                                           //add the the first artist in the data base, the "seed"
    }
    
    const rawIds = await Artist.find({degree: currentDegree});              //search all the artist in the db with the specified degree
    let ids;                                                                //gets an array of all the artists that are children to the current one
    if(wasError) ids = restIds;//restIds.map(element => element );
    else ids = rawIds.map( element => element.artistId );
    console.log(ids);
    forError = ids.map(element => element );
    forError.splice(0,0,currentDegree);
    
    //if(false)
    for(let id of ids)                                          //iterrate over the artists ids
    {
        const data = await getAllData(id);                      //gets an array of all the tracks of the current artist
        let i = 1;
        for(let track of data)                                  //iterrate over all tracks
        {
            //if(i === 10) break;
            if(track.artists.some(artist => artist.artistId === id))
            for(let artist of track.artists)                    //iterrate over all the artists on the current track
            {   
                if(artist.artistId != id)                       //check if the current artist is different from the father
                {
                    const found = await Artist.findOne({artistId: artist.artistId});   //search the artist in the database
                        
                    if(!found)                       //if the artist is new
                    {   
                        const newArtist = new Artist(                //create a new artist object
                        {
                            artistId: artist.artistId,
                            name: artist.artistName,
                            degree: currentDegree + 1,
                            artistReach: 
                            [
                                {
                                    trackId: track.trackId,
                                    trackName: track.trackName,
                                    artistId: id
                                }
                            ]
                        });
                        i++;
                        await newArtist.save();                         //save to db
                    }
                    else                                        //if the artist is not new
                    {
                        //console.log(found, track.trackName);
                        const add = 
                        {
                            trackId: track.trackId,
                            trackName: track.trackName,
                            artistId: id
                        }
                        
                        if(!found.artistReach.some( element => element.trackName === add.trackName) && found.degree === currentDegree + 1)
                        {
                            found.artistReach.push(add);
                            const x = await found.save();               //add to reachable artist of the artist the new track
                            //console.log(x);
                        }                        
                    }
                }
            }
        }
        const index = forError.indexOf(id);
        if(index > -1)
            forError.splice(index, 1);
    }
}

seedDB().then(() => {
    let tmp = '';
    if(forError) tmp = forError.toString();
    fs.writeFileSync(cachePath, tmp);

    console.log('seeding succesfull');
    const results = perf.stop();
    console.log(results.preciseWords);
}).catch((error) => {
    let tmp = '';
    if(forError) tmp = forError.toString();
    fs.writeFileSync(cachePath, tmp);
    fs.writeFileSync(cachePath,',error',{flag: 'a'});
    console.log('something went wrong: ',error);
    const results = perf.stop();
    console.log(results.preciseWords);
});


//possible bug: some artist are reaching to the same degree of artist  