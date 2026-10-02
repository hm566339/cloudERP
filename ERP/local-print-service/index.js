const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ptp = require('pdf-to-printer');
const fs = require('fs');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: os.tmpdir() });

app.get('/printers', async (req, res) => {
  try {
    const printers = await ptp.getPrinters();
    res.json(printers);
  } catch (error) {
    console.error('Error fetching printers:', error);
    res.status(500).json({ error: 'Failed to fetch printers' });
  }
});

app.post('/print', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const { printer, copies, pages, orientation, paperSize } = req.body;
    const pdfPath = req.file.path;

    const options = {
      printer: printer || undefined,
      copies: copies ? parseInt(copies, 10) : 1,
      pages: pages || undefined,
    };

    console.log(`Printing to ${options.printer || 'default'} - Copies: ${options.copies}`);
    
    await ptp.print(pdfPath, options);

    fs.unlink(pdfPath, (err) => {
      if (err) console.error('Failed to delete temp file:', err);
    });

    res.json({ success: true, message: 'Printed successfully' });
  } catch (error) {
    console.error('Print error:', error);
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ error: error.message || 'Failed to print document' });
  }
});

const PORT = process.env.PORT || 8089;
app.listen(PORT, () => {
  console.log(`Local Print Service running on http://localhost:${PORT}`);
});
