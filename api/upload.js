const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');
const fs = require('fs');

// ربط السيرفر بـ Supabase من خلال الـ Environment Variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // استقبال طلبات الـ POST من الكاميرا
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'Parsing error' });
      }

      // قراءة ملف الصورة القادم من الكاميرا
      const file = files.imageFile;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        const fileBuffer = fs.readFileSync(file.path);
        const fileName = `satellite-${Date.now()}.jpg`;

        // الرفع المباشر لـ مخزن photos اللي فتحنا صلاحياته
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
  } else {
    // لو أي طلب تاني (زي الـ GET من المتصفح) هيرجع رسالة بسيطة عشان ميعملش كراش
    return res.status(200).json({ message: "Server is running perfectly!" });
  }
};
