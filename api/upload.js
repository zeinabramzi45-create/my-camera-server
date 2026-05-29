import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  
  // ─── 1. لو المتصفح بيطلب عرض الصور (GET) ───────────────────
  if (req.method === 'GET') {
    try {
      // جلب قائمة الملفات من مخزن photos
      const { data: fileList, error: listError } = await supabase.storage
        .from('photos')
        .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

      if (listError) return res.status(500).json({ error: listError.message });

      // تحويل الملفات لروابط عامة وعمل مصفوفة متوافقة مع صفحة الويب
      const imagesArray = fileList.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(file.name);
        
        return {
          data: publicUrl, // هيبعت الرابط المباشر
          time: file.created_at,
          isUrl: true // علامة مميزة للفرونت إند
        };
      });

      return res.status(200).json(imagesArray);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ─── 2. لو الكاميرا بتبعت صورة جديدة (POST) ───────────────────
  if (req.method === 'POST') {
    const form = formidable({});
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: 'Form parsing error' });

      const file = files.imageFile?.[0] || files.imageFile;
      if (!file) return res.status(400).json({ error: 'No file uploaded' });

      try {
        const fileBuffer = fs.readFileSync(file.filepath);
        const fileName = `satellite-${Date.now()}.jpg`;

        const { data, error } = await supabase.storage
          .from('photos')
          .upload(fileName, fileBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (error) return res.status(500).json({ error: error.message });

        return res.status(200).json({ message: 'Image Saved Permanently', data });
      } catch (catchError) {
        return res.status(500).json({ error: catchError.message });
      }
    });
    return;
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
