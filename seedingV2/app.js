const {getData} = require('./utils.js');
const mongoose = require('mongoose');
const Artist = require('../models/artists.js');
const perf = require('execution-time')();
const fs = require('fs');

const cachePath = './cache.txt';
let forError;

perf.start();

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

//legacy code
/*
const juice = '4MCBfE4596Uoi2O4DtmEMz';


const seedDBf = async () =>
{
    await Artist.deleteMany({});

    let queue = [];

    queue.push(juice);

    const art = new Artist({
        name: 'Juice WRLD',
        artistId: '4MCBfE4596Uoi2O4DtmEMz',
        degree: 0
    });
    await art.save();

    for( let i = 1; i <= 2; i++ )
    {
        let tmpQueue = [];
        console.log('Degree:',i);
        while(queue.length > 0)
        {
            const fatherId = queue.pop();

            let off;
            let offset = 0;
            do
            {
                const data = await getData(fatherId, offset);
                let contor = 0;

                data.tracks.forEach(element => {
                    contor += (element.artists.length - 1);
                });
                console.log(data.tracks[0].artists[0].artistName, contor);

                const tracks = data.tracks;
                off = data._offset;
                for(let track of tracks)
                {
                    for(let a of track.artists)
                    {   
                        if(a.artistId != fatherId)
                        {
                            const found = await Artist.find({artistId: a.artistId});
                            
                            if(found.length == 0)
                            {
                                
                                const newAritstObject = 
                                {
                                    artistId: a.artistId,
                                    name: a.artistName,
                                    degree: i,
                                    artistReach: [
                                        {
                                            trackId: track.trackId,
                                            trackName: track.trackName,
                                            artistId: fatherId
                                        }
                                    ]
                                }
                                tmpQueue.push(newAritstObject.artistId);

                                const newArtist = new Artist(newAritstObject);
                                await newArtist.save();
                            }
                            else
                            {
                                const add = 
                                {
                                    trackId: track.trackId,
                                    trackName: track.trackName,
                                    artistId: fatherId
                                }
                                await Artist.findOneAndUpdate({_id: found._id}, { $push: { artistReach: add }});
                            }
                        }
                    }
                }
                offset += 20;
                //console.log(off, offset);
            }while(offset < off);
        }
        queue = tmpQueue;
    }

}
*/


const getAllData = async (id) =>                                    //get all the tracks from all offsets
{
    let offset = 0;
    let offsetLimit = 20;
    let tracks = [];
    while(offset <= offsetLimit)
    {
        const data = await getData(id, offset);
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
    const cache = getCacheData();
    const currentDegree = cache.degree;
    const restIds = cache.ids;
    const wasError = cache.error; 

    if(wasError || currentDegree === 0) await Artist.deleteMany({degree: {$gte: currentDegree} });
    else await Artist.deleteMany({degree: {$gt: currentDegree} });
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
    if(wasError) ids = restIds.map(element => element );
    else ids = rawIds.map( element => element.artistId );
    console.log(ids)
    forError = ids.map(element => element );
    forError.splice(0,0,currentDegree);
    
    //if(false)
    for(let id of ids)                                          //iterrate over the artists ids
    {
        const data = await getAllData(id);                      //gets an array of all the tracks of the current artist
        //console.log(data);
        for(let track of data)                                  //iterrate over all tracks
        {
            for(let artist of track.artists)                    //iterrate over all the artists on the current track
            {   
                if(artist.artistId != id)                       //check if the current artist is different from the father
                {
                    const found = await Artist.find({artistId: artist.artistId});   //search the artist in the database
                        
                    if(found.length == 0)                       //if the artist is new
                    {   
                        const newAritstObject =                 //create a new artist object
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
                        }

                        const newArtist = new Artist(newAritstObject);  //make an Artist object with the artist object 
                        await newArtist.save();                         //save to db
                    }
                    else                                        //if the artist is not new
                    {
                        const add = 
                        {
                            trackId: track.trackId,
                            trackName: track.trackName,
                            artistId: id
                        }
                        await Artist.findOneAndUpdate({_id: found._id}, { $push: { artistReach: add }}); //add to reachable artist of the artist the new track
                    }
                }
            }
        }
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