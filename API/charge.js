const axios = require('axios');

module.exports = async (req, res) => {
  // Mengatur Header CORS agar bisa diakses dari browser front-end index.html
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }

  try {
    const { amount, userId } = req.body;
    
    // Mengambil API Key Xendit dari Environment Variable Vercel (Lebih Aman!)
    const xenditKey = process.env.XENDIT_SECRET_KEY;
    
    // Mengonversi API Key ke format Base64 untuk autentikasi Xendit
    const token = Buffer.from(`${xenditKey}:`).toString('base64');

    // Request ke API Xendit untuk membuat QRIS otomatis
    const response = await axios.post(
      'https://api.xendit.co/qr_codes',
      {
        external_id: `arena-${userId}-${Date.now()}`,
        type: 'DYNAMIC',
        callback_url: `https://${req.headers.host}/api/callback`, // Nanti kita buat callback-nya
        amount: parseInt(amount)
      },
      {
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Mengembalikan data QRIS ke front-end index.html
    return res.status(200).json({
      qr_string: response.data.qr_string,
      id: response.data.id
    });

  } catch (error) {
    console.error('Error Xendit:', error.response ? error.response.data : error.message);
    return res.status(500).json({ 
      error: 'Gagal membuat QRIS', 
      details: error.response ? error.response.data : error.message 
    });
  }
};
