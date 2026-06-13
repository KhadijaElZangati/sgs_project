const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middlewares/auth');

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', 'videos')),
  filename: (req, file, cb) => cb(null, `video_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage: videoStorage, limits: { fileSize: 100 * 1024 * 1024 } });

const router = express.Router();
router.use(authenticate);

router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucune vidéo fournie' });
    res.json({ video_url: `/uploads/videos/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
