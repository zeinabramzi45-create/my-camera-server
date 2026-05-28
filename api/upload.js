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

  if (req.method === 'POST') {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: "No image data found" });
      }

      lastUploadedImage = {
        data: image,
        time: new Date().toISOString()
      };

      return res.status(200).json({ message: "Image received successfully!" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'GET') {
    if (!lastUploadedImage) {
      return res.status(200).json({ message: "No images uploaded yet. Server is ready!" });
    }
    return res.status(200).json(lastUploadedImage);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
