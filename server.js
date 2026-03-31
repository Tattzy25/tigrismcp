import express from 'express';
import cors from 'cors';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors()); // Allows your website to call this backend

// Initialize S3/Tigris Client
const s3Client = new S3Client({
  region: 'auto', // Tigris uses 'auto'
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Endpoint to generate pre-signed URL for UPLOAD
app.get('/generate-upload-url', async (req, res) => {
  try {
    const fileName = req.query.fileName; // e.g., user-upload.jpg
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }
    
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileName, // The name of the file in the bucket
    });

    // Create URL valid for 3600 seconds (1 hour)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Error generating URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Health check endpoint for Railway
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Tigris Backend' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Endpoint to generate pre-signed URL for DOWNLOAD/VIEWING
app.get('/generate-download-url', async (req, res) => {
  try {
    const fileName = req.query.fileName; 
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }
    
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileName, 
    });

    // Create URL valid for 3600 seconds (1 hour)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Error generating URL:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`- Upload endpoint: http://localhost:${PORT}/generate-upload-url?fileName=test.txt`);
  console.log(`- Download endpoint: http://localhost:${PORT}/generate-download-url?fileName=test.txt`);
});