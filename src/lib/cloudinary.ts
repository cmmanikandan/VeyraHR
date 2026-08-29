/**
 * Cloudinary Media Storage Helper for VeyraHR
 * Uploads images, company logos, employee avatars, and document attachments
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dughdt8sf';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'qubink_uploads';

export const uploadToCloudinary = async (file: File, folder = 'veyra_hr_uploads'): Promise<string> => {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (err: any) {
    console.warn('Cloudinary direct upload notice:', err);
    // Fallback: convert file to local Data URL if network or CORS prevents direct unsigned upload
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }
};
