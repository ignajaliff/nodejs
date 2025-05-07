const express = require('express');
const puppeteer = require('puppeteer');
const { google } = require('googleapis');
const stream = require('stream');

const app = express();
app.use(express.json({ limit: '10mb' })); // permite que n8n mande mucho texto HTML

// --- Autenticación con Google ---
const oauth2Client = new google.auth.OAuth2(
  'TU_CLIENT_ID',
  'TU_CLIENT_SECRET',
  'https://developers.google.com/oauthplayground' // o tu redirect si usás otro flujo
);

oauth2Client.setCredentials({
  access_token: 'TU_ACCESS_TOKEN',
  refresh_token: 'TU_REFRESH_TOKEN',
  scope: 'https://www.googleapis.com/auth/drive.file',
  token_type: 'Bearer',
  expiry_date: true
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// --- Ruta para recibir HTML y convertir en PDF ---
app.post('/html-to-pdf', async (req, res) => {
  const html = req.body.html;

  if (!html) return res.status(400).json({ error: 'Falta HTML' });

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox'], // IMPORTANTE para Railway
      headless: 'new'
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    // Crear stream desde buffer
    const bufferStream = new stream.PassThrough();
    bufferStream.end(pdfBuffer);

    // Subir a Drive
    const response = await drive.files.create({
      requestBody: {
        name: `documento-${Date.now()}.pdf`,
        mimeType: 'application/pdf'
      },
      media: {
        mimeType: 'application/pdf',
        body: bufferStream
      }
    });

    res.json({ message: 'PDF creado y subido', fileId: response.data.id });
  } catch (error) {
    console.error('Error al generar o subir el PDF:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
