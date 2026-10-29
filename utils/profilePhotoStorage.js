'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const photoDirectory = path.join(__dirname, '..', 'public', 'uploads', 'profile-photos');
const MIME_EXTENSIONS = Object.freeze({
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
});

function imageDimensions(buffer, mimeType) {
  if (mimeType === 'image/png' && buffer.length >= 24
    && buffer.toString('ascii', 12, 16) === 'IHDR') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (mimeType === 'image/webp') {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X' && buffer.length >= 30) {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3)
      };
    }
    if (chunk === 'VP8L' && buffer.length >= 25 && buffer[20] === 0x2f) {
      return {
        width: 1 + ((buffer[22] & 0x3f) << 8) + buffer[21],
        height: 1 + ((buffer[24] & 0x0f) << 10) + (buffer[23] << 2) + ((buffer[22] & 0xc0) >> 6)
      };
    }
    if (chunk === 'VP8 ' && buffer.length >= 30
      && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff
      };
    }
    return null;
  }
  if (mimeType !== 'image/jpeg') return null;
  let offset = 2;
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    if (offset >= buffer.length) return null;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > buffer.length) return null;
    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) return null;
    if (startOfFrameMarkers.has(marker) && segmentLength >= 7) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5)
      };
    }
    offset += segmentLength;
  }
  return null;
}

function extensionForImage(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12 || buffer.length > 4 * 1024 * 1024) {
    throw new TypeError('Choose a valid image that is 4 MB or smaller.');
  }
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = buffer.toString('ascii', 0, 4) === 'RIFF'
    && buffer.toString('ascii', 8, 12) === 'WEBP';
  const actualType = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : isWebp ? 'image/webp' : null;
  if (!actualType || actualType !== mimeType) {
    throw new TypeError('The selected file must be a valid JPEG, PNG, or WebP image.');
  }
  const dimensions = imageDimensions(buffer, actualType);
  if (!dimensions || !dimensions.width || !dimensions.height
    || dimensions.width > 4096 || dimensions.height > 4096) {
    throw new TypeError('The selected image must have valid dimensions no larger than 4096 × 4096 pixels.');
  }
  return MIME_EXTENSIONS[actualType];
}

async function saveProfilePhoto(buffer, mimeType) {
  const extension = extensionForImage(buffer, mimeType);
  if (process.env.VERCEL === '1' || process.env.APP_DEPLOYMENT_TARGET === 'vercel') {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN is required for profile photo storage on the Vercel edition.');
    }
    const { put } = require('@vercel/blob');
    const blob = await put(`profile-photos/${crypto.randomUUID()}${extension}`, buffer, {
      access: 'public',
      contentType: mimeType,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return blob.url;
  }
  await fs.mkdir(photoDirectory, { recursive: true });
  const filename = `${crypto.randomUUID()}${extension}`;
  await fs.writeFile(path.join(photoDirectory, filename), buffer, { flag: 'wx' });
  return `/uploads/profile-photos/${filename}`;
}

async function removeManagedProfilePhoto(url) {
  if ((process.env.VERCEL === '1' || process.env.APP_DEPLOYMENT_TARGET === 'vercel')
    && typeof url === 'string') {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return;
    }
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.public.blob.vercel-storage.com')) return;
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN is required to remove profile photos on the Vercel edition.');
    }
    const { del } = require('@vercel/blob');
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return;
  }
  const prefix = '/uploads/profile-photos/';
  if (typeof url !== 'string' || !url.startsWith(prefix)) return;
  const filename = url.slice(prefix.length);
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(filename)) return;
  const filePath = path.join(photoDirectory, filename);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function replaceProfilePhoto(buffer, mimeType, previousUrl, updatePhoto) {
  const photoUrl = await saveProfilePhoto(buffer, mimeType);
  try {
    await updatePhoto(photoUrl);
  } catch (error) {
    try {
      await removeManagedProfilePhoto(photoUrl);
    } catch (cleanupError) {
      console.warn('Could not remove an unreferenced profile photo:', cleanupError.message);
    }
    throw error;
  }
  try {
    await removeManagedProfilePhoto(previousUrl);
  } catch (error) {
    console.warn('Could not remove the previous profile photo:', error.message);
  }
  return photoUrl;
}

module.exports = {
  extensionForImage,
  imageDimensions,
  saveProfilePhoto,
  removeManagedProfilePhoto,
  replaceProfilePhoto
};
