export const config = {
  api: {
    bodyParser: false,
  },
};

// تحويل المتغير إلى مصفوفة (Array) لتخزين كل الصور
let allImages = [];

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

  // استقبال صورة جديدة وإضافتها للمجموعة
  if (req.method === 'POST') {
    try {
      const rawBuffer = await parseMultipart(req);
      const bufferStr = rawBuffer.toString('binary');
      
      const startIdx = bufferStr.indexOf('\r\n\r\n');
      const endIdx = bufferStr.lastIndexOf('\r\n--');

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const imageBinary = bufferStr.substring(startIdx + 4, endIdx);
        const base64Data = Buffer.from(imageBinary, 'binary').toString('base64');
        
        // إضافة الصورة الجديدة في أول المصفوفة (عشان الأحدث يظهر فوق)
        allImages.unshift({
          data: base64Data,
          time: new Date().toISOString()
        });

        // اختياري: للحفاظ على ذاكرة السيرفر المجاني، بنحتفظ بآخر 50 صورة مثلاً
        if (allImages.length > 50) {
          allImages.pop(); 
        }

        console.log('New image added to the gallery!');
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send("HTTP/1.1 200 OK\r\n\r\nImage Received");
      } else {
        return res.status(400).send("Malformed multipart data");
      }
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }

  // إرسال مصفوفة الصور كاملة لصفحة الـ HTML
  if (req.method === 'GET') {
    return res.status(200).json(allImages);
  }

  return res.status(405).send("Method not allowed");
}
