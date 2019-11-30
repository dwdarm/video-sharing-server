module.exports = {
  dbHost: 'mongodb://localhost:27017/video_sharing_db_dev',
  port: 5000,
  saltRounds: 1,
  jwtSecret: 'thisissecret',

  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET
}