const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user');

const upload = require('./../services/image-upload-service');

const singleUpload = upload.single('image');

// http://localhost:3001/api/v1/image-upload
router.post('', UserController.authMiddleware, (req, res) => {
  singleUpload(req, res, (err) => {
    if (err) {
      return res.status(422).send({
        errors: [
          {
            title: 'Image upload error',
            message: err.message
          }
        ]
      });
    }

    return res.json({
      imageUrl: req.file.location
    });
  });
});

module.exports = router;
