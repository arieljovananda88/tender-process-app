import fs from "fs";
import multer from "multer";
import path from "path";

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
export const initIPFSClient = (create: any) => {
    // Connect to the IPFS API
    const ipfs = create({
      host: process.env.IPFS_HOST || 'localhost',
      port: Number(process.env.IPFS_PORT) || 5051,
      protocol: process.env.IPFS_PROTOCOL || 'http'
    });
    return ipfs;
  };
  
export const handleFileUpload = upload.single('document');