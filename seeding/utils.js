require('dotenv').config()
const fetch = require('node-fetch');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

const APIControler = async () =>
{
    const _getToken = async() =>
    {
        //console.log('asdf');
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
        const data = await result.json();//console.log(data.access_token);
        //console.log(data);
        return data.access_token;  
    }

    const _getArtist = async (token, artistId) =>
    {
        const type='artist'
        const url = `https://api.spotify.com/v1/artists/${artistId}`;
        const options = 
        {
            method: 'GET',
            headers:
            { 
                'Authorization' : 'Bearer ' + token
            }
        }
        const result = await fetch(url, options);
        const data = await result.json();
        //console.log(data);
        return data.name;
    }

    const _getArtistAlbums = async (token, artistId, offset) =>
    {
        
        const market = 'RO';
        const limit = 20;
        const url = `https://api.spotify.com/v1/artists/${artistId}/albums?market=${market}&limit=${limit}&offset=${offset}&include_groups=album,single,appears_on`;
        const options = 
        {
            method: 'GET',
            headers:
            {
                'Authorization' : 'Bearer ' + token
            }
        }
        const result = await fetch(url, options);
        const data = await result.json();
        const albums = [];
        //console.log(data);
        if(data.items.length > 0)
        for(let album of data.items)
        {
            albums.push(album.id);
        }
        return {albums: albums, _offset: data.total};
    }

    const _getTracksAndArtists = async (token, albumIds) =>
    {
        const market = 'RO';
        let ids = '';
        for( let i = 0; i < albumIds.length - 1; i++ )
        {
            ids += albumIds[i] + ',';
        }
        ids += albumIds[albumIds.length - 1];
        const url = `https://api.spotify.com/v1/albums?ids=${ids}`;
        const options =
        {
            method: 'GET',
            headers:
            {
                'Authorization' : 'Bearer ' + token
            }
        }
        const result = await fetch(url, options);
        const data = await result.json();
        let tracks = [];
        if(data.albums.length > 0)
        for(let album of data.albums)
        {
            if(album)
            if(album.tracks != null)
            {
                for(let track of album.tracks.items)
                {
                    const trackArtist = 
                    {
                        trackId: track.id,
                        trackName: track.name,
                        artists: track.artists.map(element => 
                        {
                            return {
                                artistName: element.name,
                                artistId: element.id
                            }
                        })
                    }
                    if(!tracks.some(track => track.trackName === trackArtist.trackName))
                        tracks.push(trackArtist);
                }
            }
        }
        return tracks;
    }

    return {
        getToken(){ return _getToken() },
        getArtist(token, artistName){ return _getArtist(token, artistName) },
        getArtistAlbums(token, artistId, offset){ return _getArtistAlbums(token,artistId, offset) },
        getTracksAndArtists(token, albumIds){ return _getTracksAndArtists(token, albumIds) }
    };
};

module.exports.getData = async (artistId, offset, tok = undefined) => //artistName,
{
    const control = await APIControler();
    let token;
    if(tok) token = tok;
    else token = await control.getToken();
    //console.log(token);
    const albums = await control.getArtistAlbums(token, artistId, offset);
    const tracks = await control.getTracksAndArtists(token, albums.albums);
    return {
        tracks: tracks, 
        _offset: albums._offset,
        token: token
    };
};

//4MCBfE4596Uoi2O4DtmEMz
/*
example of what i need to do in other file if i include these functions:
const asdf = async () =>
{
    const control = await getCenter();
    console.log(control);
}

asdf();
*/

//possible improvements\\
//remove duplicate data
