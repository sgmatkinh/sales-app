const express = require("express");
const router = express.Router();
const db = require("../db");

// ===== DOANH THU TỔNG =====
router.get("/summary", (req, res) => {
  const today = db
    .prepare(`
      SELECT SUM(final_total) AS total
      FROM invoices
      WHERE date(created_at) = date('now','localtime')
    `)
    .get();

  const month = db
    .prepare(`
      SELECT SUM(final_total) AS total
      FROM invoices
      WHERE strftime('%Y-%m', created_at) =
            strftime('%Y-%m', 'now','localtime')
    `)
    .get();

  const year = db
    .prepare(`
      SELECT SUM(final_total) AS total
      FROM invoices
      WHERE strftime('%Y', created_at) =
            strftime('%Y', 'now','localtime')
    `)
    .get();

  res.json({
    today: today.total || 0,
    month: month.total || 0,
    year: year.total || 0,
  });
});

// ===== DOANH THU THEO NGÀY =====
router.get("/revenue-by-day", (req, res) => {
  const rows = db
    .prepare(`
      SELECT date(created_at) AS date,
             SUM(final_total) AS total
      FROM invoices
      WHERE strftime('%Y-%m', created_at) =
            strftime('%Y-%m', 'now','localtime')
      GROUP BY date(created_at)
      ORDER BY date
    `)
    .all();

  res.json(rows);
});

// ===== HÓA ĐƠN GẦN NHẤT =====
router.get("/recent-invoices", (req, res) => {
  const rows = db
    .prepare(`
      SELECT id, final_total, created_at
      FROM invoices
      ORDER BY created_at DESC
      LIMIT 5
    `)
    .all();

  res.json(rows);
});

module.exports = router;
