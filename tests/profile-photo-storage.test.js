'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  extensionForImage,
  imageDimensions,
  saveProfilePhoto
} = require('../utils/profilePhotoStorage');

function pngHeader(width, height) {
  const buffer = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(buffer);
  buffer.write('IHDR', 12);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function jpegFrame(width, height) {
  const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0, 11, 8, 0, 0, 0, 0, 1, 1, 0x11, 0]);
  buffer.writeUInt16BE(height, 7);
  buffer.writeUInt16BE(width, 9);
  return buffer;
}

function webpHeader(width, height) {
  const buffer = Buffer.alloc(30);
  buffer.write('RIFF', 0);
  buffer.write('WEBP', 8);
  buffer.write('VP8X', 12);
  buffer.writeUIntLE(width - 1, 24, 3);
  buffer.writeUIntLE(height - 1, 27, 3);
  return buffer;
}

test('accepts supported image headers and reports their file extensions', () => {
  assert.equal(extensionForImage(pngHeader(256, 256), 'image/png'), '.png');
  assert.equal(extensionForImage(jpegFrame(256, 256), 'image/jpeg'), '.jpg');
  assert.equal(extensionForImage(webpHeader(256, 256), 'image/webp'), '.webp');
});

test('reads image dimensions from PNG, JPEG, and WebP headers', () => {
  assert.deepEqual(imageDimensions(pngHeader(10, 20), 'image/png'), { width: 10, height: 20 });
  assert.deepEqual(imageDimensions(jpegFrame(30, 40), 'image/jpeg'), { width: 30, height: 40 });
  assert.deepEqual(imageDimensions(webpHeader(50, 60), 'image/webp'), { width: 50, height: 60 });
});

test('rejects MIME mismatches, malformed headers, oversized dimensions, and oversized files', () => {
  assert.throws(() => extensionForImage(pngHeader(1, 1), 'image/jpeg'), /valid JPEG, PNG, or WebP/);
  assert.throws(() => extensionForImage(Buffer.alloc(24), 'image/png'), /valid JPEG, PNG, or WebP/);
  assert.throws(() => extensionForImage(pngHeader(4097, 1), 'image/png'), /valid dimensions/);
  const malformedJpeg = Buffer.alloc(12, 0xff);
  malformedJpeg[1] = 0xd8;
  assert.throws(() => extensionForImage(malformedJpeg, 'image/jpeg'), /valid dimensions/);
  assert.throws(() => extensionForImage(Buffer.alloc(4 * 1024 * 1024 + 1), 'image/png'), /4 MB or smaller/);
});

test('Vercel profile photo storage fails clearly when the Blob token is missing', async () => {
  const previousTarget = process.env.APP_DEPLOYMENT_TARGET;
  const previousVercel = process.env.VERCEL;
  const previousToken = process.env.BLOB_READ_WRITE_TOKEN;
  process.env.APP_DEPLOYMENT_TARGET = 'vercel';
  delete process.env.VERCEL;
  delete process.env.BLOB_READ_WRITE_TOKEN;

  try {
    await assert.rejects(
      saveProfilePhoto(pngHeader(1, 1), 'image/png'),
      /BLOB_READ_WRITE_TOKEN is required/
    );
  } finally {
    if (previousTarget === undefined) delete process.env.APP_DEPLOYMENT_TARGET;
    else process.env.APP_DEPLOYMENT_TARGET = previousTarget;
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
    if (previousToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = previousToken;
  }
});
