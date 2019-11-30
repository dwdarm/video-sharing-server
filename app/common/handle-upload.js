const {uploader} = require('cloudinary').v2;

const uploadToCloudinary = (path, type, publicId) => {
  return new Promise((resolve, reject) => {
    uploader.upload(path, {
      resource_type: type,
      public_id: publicId,
      overwrite: true
    }, (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
}

const uploadMock = (path, type, publicId) => {
  return new Promise((resolve, reject) => {
    return resolve({
      public_id: 'public_id',
      url: path,
      width: 0,
      height: 0
    });
  });
}

var handleUpload;
if (process.env.NODE_ENV === 'test') {
  handleUpload = uploadMock;
}
else {
  handleUpload = uploadToCloudinary;
} 

module.exports = handleUpload;