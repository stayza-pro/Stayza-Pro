import { apiClient } from "./api";

export interface UploadResponse {
  url: string;
  publicId: string;
  format: string;
  size: number;
}

export const uploadService = {
  // Upload single file
  uploadFile: async (formData: FormData): Promise<UploadResponse> => {
    const response = await apiClient.post<UploadResponse>("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Upload multiple files
  uploadFiles: async (formData: FormData): Promise<UploadResponse[]> => {
    const response = await apiClient.post<UploadResponse[]>(
      "/upload/multiple",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Delete uploaded file
  deleteFile: async (publicId: string): Promise<void> => {
    await apiClient.delete(`/upload/${publicId}`);
  },
};
