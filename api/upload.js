const SUPABASE_URL = "https://supabase.com/dashboard/project/fnpzucecyatjqnmoowuy/settings/api-keys"; 
const SUPABASE_KEY = "sb_publishable_BNDYkCj9c466S2P3I89S2A_lltdDqMF";
const BUCKET_NAME = "photos";

export const config = {
  api: {
    bodyParser: false, // استقبال الـ Multipart الخام من الكاميرا
  },
};

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

  // 1. استقبال الصورة من الكاميرا ورفعها لـ Supabase Storage
  if (req.method === 'POST') {
    try {
      const rawBuffer = await parseMultipart(req);
      const bufferStr = rawBuffer.toString('binary');
      
      const startIdx = bufferStr.indexOf('\r\n\r\n');
      const endIdx = bufferStr.lastIndexOf('\r\n--');

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const imageBinary = bufferStr.substring(startIdx + 4, endIdx);
        const imageBuffer = Buffer.from(imageBinary, 'binary');
        
        const filename = `cubesat-${Date.now()}.jpg`;

        // رفع الملف مباشرة إلى Supabase Storage عن طريق الـ API
        const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filename}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'image/jpeg'
          },
          body: imageBuffer
        });

        if (!uploadResponse.ok) {
          const errText = await uploadResponse.text();
          throw new Error(`Supabase upload failed: ${errText}`);
        }

        console.log('Image saved permanently to Supabase!');
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send("HTTP/1.1 200 OK\r\n\r\nImage Received");
      } else {
        return res.status(400).send("Malformed multipart data");
      }
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }

  // 2. جلب قائمة الصور كاملة من الـ Supabase وعرضها
  if (req.method === 'GET') {
    try {
      const listResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET_NAME}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          limit: 30,
          sortBy: { column: 'created_at', order: 'desc' }
        })
      });

      if (!listResponse.ok) throw new Error('Failed to fetch image list');
      const files = await listResponse.json();

      // تحويل الملفات لروابط مباشرة ثابتة ودائمة
      const sortedImages = files.map(file => ({
        url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${file.name}`,
        time: file.created_at
      }));

      return res.status(200).json(sortedImages);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).send("Method not allowed");
}
