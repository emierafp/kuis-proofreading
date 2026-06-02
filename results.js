import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:H',
    });

    const rows = response.data.values || [];

    // Skip header row if exists
    const dataRows = rows[0]?.[0] === 'Nama' ? rows.slice(1) : rows;

    const data = dataRows
      .filter(row => row.length >= 4)
      .map(row => ({
        name:      row[0] || '',
        kelas:     row[1] || '',
        score:     Number(row[2]) || 0,
        correct:   Number(row[3]) || 0,
        wrong:     Number(row[4]) || 0,
        total:     Number(row[5]) || 10,
        timestamp: row[6] || '',
      }))
      .reverse(); // newest first

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Results error:', error);
    return res.status(500).json({ error: 'Gagal mengambil data' });
  }
}
