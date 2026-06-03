const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Proxy: POST /quote → Buda public_remittances
app.post('/quote', async (req, res) => {
  try {
    const { origin_amount, origin_currency, destination_currency, payment_method } = req.body;

    const COUNTRY_MAP = {
      COP: 'CO',
      PEN: 'PE',
      VES: 'VE',
      BOB: 'BO',
    };

    const payload = {
      origin_amount: Number(origin_amount),
      origin_currency: String(origin_currency).toUpperCase(),
      destination_currency: String(destination_currency).toUpperCase(),
      destination_country: COUNTRY_MAP[String(destination_currency).toUpperCase()] || null,
      payment_method: payment_method || 'bank_transfer',
    };

    console.log('→ Buda request:', JSON.stringify(payload));

    const response = await fetch('https://www.buda.com/api/v2/public_remittances', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'BudaEnviosB2B/1.0',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log('← Buda response:', response.status, text.slice(0, 200));

    if (!response.ok) {
      console.error('← Buda error body:', text);
      return res.status(response.status).json({ error: `Buda ${response.status}: ${text}` });
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(text);

  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✓ Server on port ${PORT}`));
