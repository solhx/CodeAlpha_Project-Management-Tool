// backend/src/services/upload.service.js
import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from '../utils/ApiError.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadFile = async (filePath, folder = 'proflow') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });
    return {
      url:      result.secure_url,
      publicId: result.public_id,
      fileType: result.resource_type,
      size:     result.bytes,
    };
  } catch (err) {
    throw new ApiError(500, `File upload failed: ${err.message}`);
  }
};

export const uploadAvatar = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'proflow/avatars',
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
    return {
      url:      result.secure_url,
      publicId: result.public_id,
    };
  } catch (err) {
    throw new ApiError(500, `Avatar upload failed: ${err.message}`);
  }
};

export const deleteFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Failed to delete file from Cloudinary:', err);
  }
};