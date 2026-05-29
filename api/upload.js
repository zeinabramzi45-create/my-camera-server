// إعدادات Vercel لإيقاف الـ Body Parser الافتراضي عشان نستقبل الملف الخام
export const config = {
  api: {
    bodyParser: false,
  },
};

let lastUploadedImage = null;

// دالة مساعدة لتجميع البيانات الخام (Multipart) القادمة من الكاميرا
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    req.on('data', (chunk) => { chunks.push(chunk); });
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });
    req.on('error', (err) => { reject(err); });
  });
}

export default async function handler(req, res) {
  // تفعيل الـ CORS عشان الكاميرا تقدر تبعت بدون قيود
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. استقبال الصورة من الكاميرا بطريقة الإنستراكتور (POST)
  if (req.method === 'POST') {
    try {
      const rawBuffer = await parseMultipart(req);
      
      // استخراج الصورة الصافية من بين الـ Boundary والـ Headers بتاعة الأردوينو
      const bufferStr = rawBuffer.toString('binary');
      const startIdx = bufferStr.indexOf('\r\n\r\n');
      const endIdx = bufferStr.lastIndexOf('\r\n--');

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        // قطع حواشي الـ Header والـ Tail وأخذ بيانات الـ JPEG الصافية
        const imageBinary = bufferStr.substring(startIdx + 4, endIdx);
        // تحويلها لـ Base64 لتخزينها وعرضها بسهولة في الصفحة الرئيسية
        const base64Data = Buffer.from(imageBinary, 'binary').toString('base64');
        
        lastUploadedImage = {
          data: base64Data,
          time: new Date().toISOString()
        };

        console.log('Image received using Instructor method!');
        // الرد بـ 200 OK اللي الكود بتاعك مستنيه عشان الإرسال ينجح
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send("200 OK");
      } else {
        return res.status(400).json({ error: "Malformed multipart data" });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // 2. عرض الصورة في المتصفح أو لصفحة الـ index.html (GET)
  if (req.method === 'GET') {
    if (!lastUploadedImage) {
      return res.status(200).json({ message: "No images yet" });
    }
    return res.status(200).json(lastUploadedImage);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
