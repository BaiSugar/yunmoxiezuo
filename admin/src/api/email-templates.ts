import request from '../utils/request';

export interface EmailTemplate {
  id: number;
  type: string;
  subject: string;
  htmlTemplate: string;
  name: string;
  description: string;
  variables: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateDto {
  type: string;
  subject: string;
  htmlTemplate: string;
  name?: string;
  description?: string;
  variables?: string;
  isActive?: boolean;
}

export interface UpdateEmailTemplateDto {
  subject?: string;
  htmlTemplate?: string;
  name?: string;
  description?: string;
  variables?: string;
  isActive?: boolean;
}

/**
 * 获取所有邮件模板
 */
export const getEmailTemplates = () => {
  return request.get<EmailTemplate[]>('/email-templates');
};

/**
 * 获取单个邮件模板
 */
export const getEmailTemplate = (id: number) => {
  return request.get<EmailTemplate>(`/email-templates/${id}`);
};

/**
 * 创建邮件模板
 */
export const createEmailTemplate = (data: CreateEmailTemplateDto) => {
  return request.post<EmailTemplate>('/email-templates', data);
};

/**
 * 更新邮件模板
 */
export const updateEmailTemplate = (id: number, data: UpdateEmailTemplateDto) => {
  return request.put<EmailTemplate>(`/email-templates/${id}`, data);
};

/**
 * 删除邮件模板
 */
export const deleteEmailTemplate = (id: number) => {
  return request.delete(`/email-templates/${id}`);
};

