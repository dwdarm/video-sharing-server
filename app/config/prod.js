module.exports = {
  dbHost: process.env.DB_URI,
  port: parseInt(process.env.PORT),

  saltRounds: parseInt(process.env.SALT_ROUNDS),
  jwtSecret: process.env.JWT_SECRET,

  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET
}