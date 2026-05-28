export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

let lastUploadedImage = null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // إذا دخلتِ على الرابط الرئيسي أو رابط الرفع عبر المتصفح (GET)
  if (req.method === 'GET') {
    if (!lastUploadedImage) {
      return res.status(200).send(`
        <html>
          <body style="font-family:sans-serif; text-align:center; padding-top:50px;">
            <h2>السيرفر جاهز وشغال تمام! 🎉</h2>
            <p>مستني الكاميرا تبعت أول صورة... أول ما تبعت هتعملي Refresh وتظهر هنا فوراً.</p>
          </body>
        </html>
      `);
    }
    
    // إذا كانت هناك صورة مخزنة، يتم عرضها مباشرة في المتصفح
    const imageBuffer = Buffer.from(lastUploadedImage, 'base64');
    res.setHeader('Content-Type', 'image/jpeg');
    return res.send(imageBuffer);
  }

  // استقبال الصورة من الكاميرا (POST)
  if (req.method === 'POST') {
    try {
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({ error: 'No image data found in request' });
      }

      // تنظيف النص إذا كانت الكاميرا ترسله بـ Data URI scheme
      lastUploadedImage = image.replace(/^data:image\/jpeg;base64,/, "");

      console.log('Image uploaded successfully at:', new Date().toISOString());
      return res.status(200).json({ message: 'Image uploaded successfully!' });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
