import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

// تفعيل استقبال البيانات من الكاميرا مباشرة
export const config = {
  api: {
    bodyParser: false,
  },
};

// ربط السيرفر بـ Supabase باستخدام المتغيرات السحابية الآمنة تلقائياً
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // استخدام مفتاح الروت لتخطي أي جدار حماية
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({});
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Form parsing error' });
    }

    const file = files.imageFile?.[0] || files.imageFile;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const fileBuffer = fs.readFileSync(file.filepath);
      // اسم الصورة هيكون معتمد على الوقت عشان ميكررش ويمسح القديم
      const fileName = `satellite-${Date.now()}.jpg`;

      // الرفع المباشر للمخزن photos
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(fileName, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: 'Image Saved Permanently', data });
    } catch (catchError) {
      return res.status(500).json({ error: catchError.message });
    }
  });
}
