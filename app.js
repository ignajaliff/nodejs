const express = require('express');
const bodyParser = require('body-parser');
const pdf = require('html-pdf-chrome');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.text({ type: 'text/html' }));

app.post('/html-to-pdf', async (req, res) => {
  const html = req.body;

  try {
    const pdfBuffer = await pdf.create(html).toBuffer();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=documento.pdf',
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    res.status(500).send('Error generando PDF');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
