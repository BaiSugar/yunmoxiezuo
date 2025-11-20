import { apiService as api } from './api';

export interface SendVerificationCodeDto {
  email: string;
  type: 'register' | 'reset_password' | 'change_email' | 'verify_email';
}

/**
 * 发送验证码
 */
export const sendVerificationCode = (data: SendVerificationCodeDto) => {
  return api.post('/auth/send-verification-code', data);
};

/**
 * 验证邮箱验证码
 */
export const verifyEmailCode = (data: {
  email: string;
  code: string;
  type: 'register' | 'reset_password' | 'change_email' | 'verify_email';
}) => {
  return api.post('/email/verify-code', data);
};

