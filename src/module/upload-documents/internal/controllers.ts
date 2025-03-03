import fs from "fs";
import { create } from "ipfs-http-client";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req: any, file: any, cb: any) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Configure IPFS client
const initIPFSClient = () => {
  // Connect to the IPFS API
  const ipfs = create({
    host: process.env.IPFS_HOST || 'localhost',
    port: Number(process.env.IPFS_PORT) || 5051,
    protocol: process.env.IPFS_PROTOCOL || 'http'
  });
  return ipfs;
};

// Middleware to handle file upload
const handleFileUpload = upload.single('document');

// Function to upload document to IPFS
async function uploadDocument(req: any, res: any) {
  try {
    // Use the multer middleware first
    handleFileUpload(req, res, async function(err: any) {
      if (err) {
        console.error('Error uploading file:', err);
        return res.status(400).json({ error: 'File upload failed' });
      }

      // Check if a file was provided
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Initialize IPFS client
      const ipfs = initIPFSClient();
      
      try {
        // Read the file from disk
        const fileContent = fs.readFileSync(req.file.path);
        
        // Add the file to IPFS
        const result = await ipfs.add({
          path: req.file.originalname,
          content: fileContent
        });
        
        // Construct the IPFS URI
        const ipfsUri = `ipfs://${result.cid.toString()}`;
        const ipfsGatewayUrl = `${process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${result.cid.toString()}`;
        
        // Clean up the temporary file
        fs.unlinkSync(req.file.path);
        
        // Return success response
        return res.status(200).json({
          success: true,
          ipfsUri,
          ipfsGatewayUrl,
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
      } catch (ipfsError: any) {
        console.error('IPFS upload error:', ipfsError);
        
        // Clean up the temporary file if it exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(500).json({ error: 'IPFS upload failed', details: ipfsError.message });
      }
    });
  } catch (error: any) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

export const uploadDocumentController = {
  uploadDocument
}