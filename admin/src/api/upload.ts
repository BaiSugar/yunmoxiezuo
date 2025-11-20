import request from '../utils/request';

/**
 * 上传页脚图片
 */
export const uploadFooterImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  // 使用全局 request（自动携带 accessToken，统一错误处理）
  const data = await request.post<{ url: string; filename: string }>(
    '/system-settings/upload/footer',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return data.url;
};

