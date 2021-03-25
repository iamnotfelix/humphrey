
module.exports.generateString = (size) =>
{
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for(let i=0;i< size;i ++)
    {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
}
