export interface CollaborationInquiryForm {
  brand_name: string
  website?: string
  contact_name: string
  contact_email: string
  brand_description: string
  collaboration_goal: string
  anything_else?: string
}

export interface CollaborationSubmitResponse {
  id: string
  email_sent: boolean
}

export interface CollaborationInquiry {
  id: string
  brand_name: string
  website?: string
  contact_name: string
  contact_email: string
  brand_description: string
  collaboration_goal: string
  anything_else?: string
  client_ip?: string
  email_sent: boolean
  email_sent_at?: string
  created_at: string
}

export interface CollaborationInquiryListResponse {
  inquiries: CollaborationInquiry[]
  limit: number
  offset: number
  count: number
}

export interface AdminListCollaborationInquiriesParams {
  limit?: number
  offset?: number
  contact_email?: string
  email_sent?: boolean
}

export const COLLABORATION_FIELD_LIMITS = {
  brand_name: 200,
  contact_name: 200,
  contact_email: 255,
  website: 2048,
  brand_description: 5000,
  collaboration_goal: 5000,
  anything_else: 5000,
} as const
