export default async function handler(req, res) {
  // Set CORS headers agar bisa diakses dari frontend
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    // Request data ke Server Ubuntu (HTTP) dari sisi server Vercel (Bukan Browser)
    // Server-to-Server communication tidak terkena Mixed Content block
    const response = await fetch('http://103.164.99.2:1101/devices/status', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Kembalikan data ke frontend dengan status 200 OK
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ 
        error: 'Failed to fetch data from backend', 
        details: error.message 
    });
  }
}