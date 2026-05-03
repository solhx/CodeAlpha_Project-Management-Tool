import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// Test connection on startup
const verifyCloudinaryConnection = async () => {
  try {
    await cloudinary.api.ping();
    console.log('✅ Cloudinary connected successfully');
  } catch (err) {
    console.warn('⚠️  Cloudinary connection failed:', err.message);
  }
};

if (process.env.NODE_ENV !== 'test') {
  verifyCloudinaryConnection();
}

// ── Upload any file ──
export const uploadFile = async (
  filePath,
  folder   = 'proflow/general',
  options  = {}
) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto',
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
    ],
    ...options,
  });

  return {
    url:          result.secure_url,
    publicId:     result.public_id,
    resourceType: result.resource_type,
    format:       result.format,
    size:         result.bytes,
    width:        result.width  || null,
    height:       result.height || null,
  };
};

// ── Upload avatar with face-crop transform ──
export const uploadAvatar = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'proflow/avatars',
    transformation: [
      {
        width:   200,
        height:  200,
        crop:    'fill',
        gravity: 'face',
      },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return {
    url:      result.secure_url,
    publicId: result.public_id,
  };
};

// ── Upload project cover image ──
export const uploadCoverImage = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'proflow/covers',
    transformation: [
      {
        width:   1200,
        height:  400,
        crop:    'fill',
        gravity: 'center',
      },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return {
    url:      result.secure_url,
    publicId: result.public_id,
  };
};

// ── Upload task attachment ──
export const uploadAttachment = async (filePath, originalName) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder:        'proflow/attachments',
    resource_type: 'auto',
    public_id:     `${Date.now()}_${originalName.replace(/\s+/g, '_')}`,
    use_filename:  true,
  });

  return {
    url:      result.secure_url,
    publicId: result.public_id,
    format:   result.format,
    size:     result.bytes,
  };
};

// ── Delete file by publicId ──
export const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === 'ok';
  } catch (err) {
    console.error('Cloudinary delete failed:', err.message);
    return false;
  }
};

// ── Delete multiple files ──
export const deleteFiles = async (publicIds) => {
  if (!publicIds?.length) return;
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (err) {
    console.error('Cloudinary bulk delete failed:', err.message);
  }
};

// ── Generate signed URL (private files) ──
export const generateSignedUrl = (publicId, expiresInSeconds = 3600) => {
  return cloudinary.utils.private_download_url(publicId, 'auto', {
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
};

export default cloudinary;