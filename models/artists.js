const mongoose = require('mongoose');
const {Schema} = mongoose;

const artistSchema = new Schema({
    artistId:
    {
        type: String,
        required: true
    },
    name:
    {
        type: String
    },
    degree:
    {
        type: Number
    },
    artistReach: 
    [
        {
            trackId:
            {
                type: String
                //required: true
            },
            trackName:
            {
                type: String
            },
            artistId: 
            {
                type: String
            }
        }
    ]
});

const Artists = mongoose.model('Artists', artistSchema);
module.exports = Artists;