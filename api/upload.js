export const config = {
  api: {
    bodyParser: false, // إيقاف البارسير التلقائي لاستقبال الـ Multipart الخام من الأردوينو
  },
};

let lastUploadedImage = null;

// دالة تجميع البيانات الخام القادمة من دالة الكاميرا
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // استقبال الصورة الكبيرة القادمة من الكاميرا بـ Multipart
  if (req.method === 'POST') {
    try {
      const rawBuffer = await parseMultipart(req);
      const bufferStr = rawBuffer.toString('binary');
      
      // البحث عن بداية ونهاية الصورة الصافية داخل طلب الأردوينو
      const startIdx = bufferStr.indexOf('\r\n\r\n');
      const endIdx = bufferStr.lastIndexOf('\r\n--');

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const imageBinary = bufferStr.substring(startIdx + 4, endIdx);
        const base64Data = Buffer.from(imageBinary, 'binary').toString('base64');
        
        lastUploadedImage = {
          data: base64Data,
          time: new Date().toISOString()
        };

        console.log('Image saved successfully via Instructor Multipart method!');
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send("HTTP/1.1 200 OK\r\n\r\nImage Received"); 
      } else {
        return res.status(400).send("Malformed multipart data");
      }
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }

  // إرسال البيانات لصفحة العرض
  if (req.method === 'GET') {
    if (!lastUploadedImage) {
      return res.status(200).json({ message: "No images yet" });
    }
    return res.status(200).json(lastUploadedImage);
  }

  return res.status(405).send("Method not allowed");
}
