const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET } = require('../config');

aws.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION || 'us-east-1'
});

const s3 = new aws.S3(); // credential object here

// filter image file types to accept only jpeg or png
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type, only JPEG and PNG are allowed'), false);
  }
};

// preparation to upload to aws s3
const upload = multer({
  fileFilter: fileFilter,
  storage: multerS3({
    acl: 'public-read',
		s3: s3,
		contentType: multerS3.AUTO_CONTENT_TYPE,
    bucket: AWS_S3_BUCKET,
    key: function(req, file, cb) {
      cb(null, Date.now().toString());
    }
  })
});

module.exports = upload;
