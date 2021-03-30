const {getData} = require('./utils.js');
const mongoose = require('mongoose');
const Artist = require('../models/artists.js');
const ArstistList = require('../models/artistList.js');

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

const juice = '4MCBfE4596Uoi2O4DtmEMz';

const seedDB = async () =>
{
    await Artist.deleteMany({});

    let queue = [];
    let pas = [];
    queue.push(juice);
    pas.push(0);

    const art = new Artist({
        name: 'Juice WRLD',
        artistId: '4MCBfE4596Uoi2O4DtmEMz',
        degree: 0
    });
    await art.save();

    for( let i = 1; i <= 2; i++ )
    {
        let tmpQueue = [];
        let tmpPas = [];
        while(queue.length > 0)
        {
            const father = queue.pop();
            const pasFather = pas.pop();
            //const father = await Artist.find({artistId: queue.pop()});
            let off;
            let offset = 0;
            do
            {
                const data = await getData(father, offset);
                const tracks = data.tracks;
                off = data._offset;
                for(let track of tracks)
                {
                    for(let a of track.artists)
                    {   
                        if(a.artistId != father)
                        {
                            const found = await Artist.find({artistId: a.artistId});
                            
                            if(found.length == 0)
                            {
                                
                                const newAritstObject = 
                                {
                                    artistId: a.artistId,
                                    name: a.artistName,
                                    degree: pasFather + 1,////////////////
                                    artistReach: [
                                        {
                                            trackId: track.trackId,
                                            trackName: track.trackName,
                                            artistId: father
                                        }
                                    ]
                                }
                                tmpQueue.push(newAritstObject.artistId);
                                tmpPas.push(newAritstObject.degree);

                                const newArtist = new Artist(newAritstObject);
                                await newArtist.save();
                            }
                            else
                            {
                                const add = 
                                {
                                    trackId: track.trackId,
                                    trackName: track.trackName,
                                    artistId: father
                                }
                                await Artist.findOneAndUpdate({_id: found._id}, { $push: { artistReach: add }});
                            }
                        }
                    }
                }
                offset += 20;
                console.log(off, offset);
            }while(offset < off);
        }
        queue = tmpQueue;
        pas = tmpPas;
    }

}

const useData = async (artistId) =>
{
    const tracks = await getData(artistId);
    console.log(tracks);
}

//useData('4MCBfE4596Uoi2O4DtmEMz');


seedDB().then(() => {
    console.log('seeding succesfull');
}).catch((error) => {
    console.log('something went wrong: ',error);
});

