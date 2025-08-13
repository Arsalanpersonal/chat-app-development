
import { v2 as cloudinary } from 'cloudinary'

import { config } from 'dotenv';

config();




cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_APIKEY,
    api_secret: process.env.CLOUDINARY_APISECRET
});

/**
 * Upload a single image to Cloudinary
 * @param {Buffer} fileBuffer - The buffer of the image file to upload
 * @param {string} publicId - Optional public ID to assign to the uploaded image
 * @returns {Promise<Object>} - Cloudinary response object
 */
export const uploadSingleImage = async (fileBuffer, publicId = null) => {
    try {
        return new Promise((resolve, reject) => {
            const uploadOptions = { resource_type: 'image' };
            if (publicId) {
                uploadOptions.public_id = publicId;
            }

            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        reject(new Error(`Error uploading to Cloudinary: ${error.message}`));
                    } else {
                        resolve(result);
                    }
                }
            );

            // Write the file buffer to the Cloudinary upload stream
            uploadStream.end(fileBuffer);
        });
    } catch (error) {
        console.error('Error in uploadSingleImage:', error);
        throw new Error('Failed to upload image to Cloudinary');
    }
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<boolean>} - Returns true if deleted successfully
 */
export const deleteImage = async (publicId) => {
    try {
        // Check if the file exists on Cloudinary
        const result = await cloudinary.api.resource(publicId, { resource_type: 'image' });
        if (result) {
            await cloudinary.api.delete_resources(publicId, { resource_type: 'image' });
            return true;
        } else {
            throw new Error('File not found on Cloudinary');
        }
    } catch (error) {
        console.error('Error in deleteImage:', error);
        throw new Error('Failed to delete image from Cloudinary');
    }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Buffer[]} fileBuffers - An array of image file buffers to upload
 * @param {string[]} publicIds - Optional array of public IDs to assign to the uploaded images
 * @returns {Promise<Object[]>} - Array of Cloudinary response objects
 */
export const uploadMultipleImages = async (fileBuffers, publicIds = []) => {
    try {
        // Map through each file buffer and upload it
        const uploadPromises = fileBuffers.map((fileBuffer, index) => {
            const publicId = publicIds[index] || null; // Use provided publicId or null
            const uploadOptions = { resource_type: 'image' };
            if (publicId) {
                uploadOptions.public_id = publicId;
            }

            // Return a promise for each upload
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) {
                            reject(new Error(`Error uploading to Cloudinary: ${error.message}`));
                        } else {
                            resolve(result);
                        }
                    }
                );

                // Write the file buffer to the Cloudinary upload stream
                uploadStream.end(fileBuffer);
            });
        });

        // Wait for all uploads to complete
        return await Promise.all(uploadPromises);
    } catch (error) {
        console.error('Error in uploadMultipleImages:', error);
        throw new Error('Failed to upload images to Cloudinary');
    }
};




export default cloudinary;
