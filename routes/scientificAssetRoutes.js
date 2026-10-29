'use strict';

const express = require('express');
const controller = require('../controllers/scientificAssetController');
const { requireLogin } = require('../middleware/authMiddleware');
const { requireTutorOrAdmin } = require('../middleware/adminAuthMiddleware');
const sources = require('../controllers/scientificSourceController');

const router = express.Router();
router.use(requireLogin);
const sourceHits = new Map();
router.use('/sources', (req, res, next) => {
  const now = Date.now();
  const key = req.ip || 'unknown';
  const entry = sourceHits.get(key) || { count: 0, resetAt: now + 60_000 };
  if (now >= entry.resetAt) { entry.count = 0; entry.resetAt = now + 60_000; }
  entry.count += 1;
  sourceHits.set(key, entry);
  if (sourceHits.size > 2000) {
    for (const [ip, value] of sourceHits) if (value.resetAt <= now) sourceHits.delete(ip);
  }
  if (entry.count > 30) {
    res.set('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
    return res.status(429).json({ ok: false, error: 'Scientific source lookup limit reached. Try again shortly.' });
  }
  next();
});
router.get('/sources/rcsb/:pdbId/file', sources.rcsbFile);
router.get('/sources/noaa/mauna-loa-co2', sources.noaaMaunaLoaCo2);
router.get('/sources/pubchem/:identifier/sdf', sources.pubchemSdf);
router.get('/sources/pubchem/:identifier', sources.pubchemCompound);
router.get('/sources/elevation', sources.elevationGrid);
router.get('/', controller.listAssets);
router.get('/:assetKey', controller.getAsset);
router.post('/', requireTutorOrAdmin, controller.createAsset);
router.put('/:assetKey', requireTutorOrAdmin, controller.updateAsset);

module.exports = router;
