const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Proxy: POST /quote → Buda public_remittances
app.post('/quote', async (req, res) => {
  try {
    const { origin_amount, origin_currency, destination_currency, payment_method } = req.body;

    const body = { origin_amount, origin_currency, destination_currency };
    if (payment_method) body.payment_method = payment_method;

    const response = await fetch('https://www.buda.com/api/v2/public_remittances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
