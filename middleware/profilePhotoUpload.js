'use strict';

const express = require('express');

const parseImage = express.raw({
  type: ['image/jpeg', 'image/png', 'image/webp'],
  limit: '4mb'
});

function profilePhotoUpload(req, res, next) {
  parseImage(req, res, (error) => {
    if (!error) return next();
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ ok: false, error: 'Profile photos must be 4 MB or smaller.' });
    }
    return next(error);
  });
}

module.exports = { profilePhotoUpload };
