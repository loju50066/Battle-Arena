// api/withdraw.js
const Xendit = require('xendit-node');

const xenditInstance = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY
});

const { Payout } = xenditInstance;
const payoutEngine = new Payout({});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { uid, amount, bankCode, accountNumber, accountName } = req.body;

  try {
    let cleanAccountNumber = accountNumber.replace(/\D/g, '');

    if (bankCode === 'DANA') {
      if (cleanAccountNumber.startsWith('62')) {
        cleanAccountNumber = '0' + cleanAccountNumber.slice(2);
      }
      if (cleanAccountNumber.startsWith('8')) {
        cleanAccountNumber = '0' + cleanAccountNumber;
      }
    }

    const jumlahUangDitransfer = amount; 

    const payoutResponse = await payoutEngine.createPayout({
      externalID: `wd_${uid}_${Date.now()}`,
      amount: jumlahUangDitransfer,
      bankCode: bankCode,
      accountHolderName: accountName,
      accountNumber: cleanAccountNumber, 
      description: `Withdraw Arena Pro Player UID: ${uid}`
    });

    return res.status(200).json({
      success: true,
      message: "Transfer dana via Xendit berhasil disalurkan!",
      payoutAmount: jumlahUangDitransfer
    });

  } catch (error) {
    console.error("Xendit API Error Payload Interrupted:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal memproses pengiriman pencairan dana."
    });
  }
}
