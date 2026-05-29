import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false, // استقبال البيانات كـ Stream خام
  },
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// دالة مساعدة لقراءة البيانات الخام القادمة من الكاميرا
async function getBuffer(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  
  // 1. لو المتصفح بيطلب جلب الصور لعرضها (GET)
  if (req.method === 'GET') {
    try {
      const { data: fileList, error: listError } = await supabase.storage
        .from('photos')
        .list('', { limit: 50, sortBy: { column: 'created_at', order: 'desc' } });

      if (listError) return res.status(500).json({ error: listError.message });

      const imagesArray = fileList.map(file => {
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(file.name);
        return {
          data: publicUrl,
          time: file.created_at,
          isUrl: true
        };
      });

      return res.status(200).json(imagesArray);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // 2. لو الكاميرا بتبعت صورة حية (POST)
  if (req.method === 'POST') {
    try {
      const imageBuffer = await getBuffer(req);
      
      if (!imageBuffer || imageBuffer.length === 0) {
        return res.status(400).json({ error: 'Empty image buffer' });
      }

      const fileName = `satellite-${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from('photos')
        .upload(fileName, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ message: 'Success', fileName });
    } catch (catchError) {
      return res.status(500).json({ error: catchError.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
