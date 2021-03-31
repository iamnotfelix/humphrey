require('dotenv').config()
const fetch = require('node-fetch');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

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
        const data = await result.json();//console.log(data.access_token);
        return data.access_token;  
    }

    const _getArtist = async (token,artistName) =>
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
        const result = await fetch(url, options);
        const data = await result.json();
        //console.log(data);
        return {
            followers: data.artists.items[0].followers.total,
            popularity: data.artists.items[0].popularity
        };
    }

    const _getArtistAlbums = async (token, artistId, offset) =>
    {
        
        const market = 'RO';
        const limit = 20;
        const include_group = 'album,single';//include_group=${include_group}
        //const offset = '';
        const url = `https://api.spotify.com/v1/artists/${artistId}/albums?market=${market}&limit=${limit}&offset=${offset}&include_groups=album,single`;
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
                    let egal = false;
                    if(tracks)
                    {
                        tracks.forEach(element => egal = (egal || (trackArtist.trackName == element.trackName)));
                    }

                    if(!egal)
                    {
                        tracks.push(trackArtist);
                    }
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

module.exports.getData = async (artistId, offset) => //artistName,
{
    const control = await APIControler();
    const token = await control.getToken();
    //const artistInfo = await control.getArtist(token, artistName);
    const albums = await control.getArtistAlbums(token, artistId, offset);
    const tracks = await control.getTracksAndArtists(token, albums.albums);

    return {
        tracks: tracks, 
        _offset: albums._offset,
    };
};
//4MCBfE4596Uoi2O4DtmEMz
//getData('4MCBfE4596Uoi2O4DtmEMz');
//still not working. I need to make another async, then await the initialization
//console.log(dataCenter());
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
