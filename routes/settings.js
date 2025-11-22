const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('./authMiddleware');

router.get('/background-image', (req, res) => {
  db.get('SELECT value FROM settings WHERE key = ?', ['background-image'], (err, row) => {
    if (err) {
      return res.status(500).json({ message: '获取设置失败' });
    }
    if (!row) {
      return res.json({ url: 'https://link.tyrlink.dpdns.org/IMG_20251122_193636.png' });
    }
    res.json({ url: row.value });
  });
});

router.post('/background-image', authMiddleware, (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return res.status(400).json({ message: '图片URL不能为空' });
  }

  db.run('UPDATE settings SET value = ? WHERE key = ?', [url, 'background-image'], function(err) {
    if (err) {
      return res.status(500).json({ message: '更新设置失败' });
    }
    res.json({ message: '背景图片URL已更新', url });
  });
});

module.exports = router;
