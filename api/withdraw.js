// api/withdraw.js
const Xendit = require('xendit-node');

const xenditInstance = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY
});

const { Payout } = xenditInstance;
const payoutEngine = new Payout({});

export default async function handler(req, res) {
  // Hanya menerima metode request POST dari front-end client
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { uid, amount, bankCode, accountNumber, accountName } = req.body;

  try {
    // ==========================================
    // LOGIKA PENYARING / SANITASI NOMOR OTOMATIS
    // ==========================================
    // Hapus semua spasi, strip (-), atau tanda plus (+) yang diketik user
    let cleanAccountNumber = accountNumber.replace(/\D/g, '');

    // Khusus E-Wallet DANA, konversikan format internasional (+62 / 62) ke format lokal standar (08)
    if (bankCode === 'DANA') {
      if (cleanAccountNumber.startsWith('62')) {
        cleanAccountNumber = '0' + cleanAccountNumber.slice(2);
      }
      if (cleanAccountNumber.startsWith('8')) {
        cleanAccountNumber = '0' + cleanAccountNumber;
      }
    }
    // ==========================================

    // 1. Mengkalkulasikan potongan komisi operational platform (10%)
    const komisiOwner = amount * 0.10;
    const jumlahUangDitransfer = amount - komisiOwner;

    // 2. Menembak payload request transfer out menggunakan nomor hasil pembersihan otomatis
    const payoutResponse = await payoutEngine.createPayout({
      externalID: `wd_${uid}_${Date.now()}`,
      amount: jumlahUangDitransfer,
      bankCode: bankCode,
      accountHolderName: accountName,
      accountNumber: cleanAccountNumber, // Menggunakan nomor bersih "08xxx"
      description: `Withdraw Game Arena - Player UID: ${uid}`
    });

    // 3. Mengirimkan sinyal status response sukses 200 balik ke front-end javascript
    return res.status(200).json({
      success: true,
      message: "Transfer WD otomatis lewat Xendit berhasil!",
      payoutAmount: jumlahUangDitransfer,
      feeOwner: komisiOwner
    });

  } catch (error) {
    console.error("Xendit API Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal memproses pencairan dana."
    });
  }
}
