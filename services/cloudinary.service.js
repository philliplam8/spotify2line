require('dotenv').config({ path: '../.env' });
const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * 
 * @param {string} file Path to local file or URL
 * @param {string} publicId Name in Cloudinary's storage
 * @returns 
 */
function uploadAudio(file, publicId) {

    return new Promise(function (resolve, reject) {

        cloudinary.v2.uploader.upload(file,
            {
                public_id: publicId,
                resource_type: 'video',
                format: 'mp4'
            },
            function (err, res) {
                if (err) return reject(err);

                const songLink = String(res.secure_url);
                console.log(typeof (songLink), songLink);
                return resolve(songLink);
            });
    })
}

/**
 * Delete Cloudinary storage item with publicId
 * @param {string} publicId Name in Cloudinary's storage
 */
function deleteAudio(publicId) {
    cloudinary.v2.uploader.destroy(publicId,
        { invalidate: true, resource_type: "video" },
        function (err, res) {
            console.log(res);
        }
    );
}

/**
 * Check Cloudinary hourly usage limits (free tier = 500 per hour, and refreshes)
 */
function checkResources() {
    cloudinary.v2.api.resources(function (error, result) {

        const parsedResult = {
            "Rate limit allowed": result.rate_limit_allowed,
            "Rate limit remaining": result.rate_limit_remaining,
            "Rate limit wlll be reset at": result.rate_limit_reset_at
        }

        console.log(parsedResult);
    });
}

checkResources();

module.exports = {
    uploadAudio,
    deleteAudio,
    checkResources
}