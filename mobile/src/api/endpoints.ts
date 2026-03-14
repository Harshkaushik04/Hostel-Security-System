import { apiFetch } from './client'

// Auth
export type SignInBody = { email: string; password: string }
export type SignInResponse = { valid?: boolean; error?: string; token?: string }

export function studentSignIn(body: SignInBody) {
  return apiFetch<SignInResponse>('/student-sign-in', { method: 'POST', json: body })
}

export function adminSignIn(body: SignInBody) {
  return apiFetch<SignInResponse>('/admin-sign-in', { method: 'POST', json: body })
}

// Invite
export type InviteBody = {
  host_email: string
  guest_name: string
  guest_contact_number: string
  [key: string]: string
}

export function invite(body: InviteBody) {
  return apiFetch<unknown>('/invite', { method: 'POST', json: body })
}

// Emergencies
export function fetchEmergencies() {
  return apiFetch<unknown>('/emergencies', { method: 'GET' })
}

// Activities
export type DateRangeBody = { start?: string; end?: string; [key: string]: string | undefined }

export function fetchRecentActivities(params: DateRangeBody) {
  return apiFetch<unknown>('/fetch-recent-activities', { method: 'POST', json: params })
}

export function fetchTimerangeActivities(params: DateRangeBody) {
  return apiFetch<unknown>('/fetch-timerange-activities', { method: 'POST', json: params })
}

export function getActivity(params: Record<string, string>) {
  return apiFetch<unknown>('/get-activity', { method: 'POST', json: params })
}

// Past recordings
export function getPastRecording(params: Record<string, string>) {
  return apiFetch<unknown>('/get-past-recording', { method: 'POST', json: params })
}

// Manage
export function getHostelsList(params: { hostel_name?: string }) {
  return apiFetch<unknown>('/get-hostels-list', { method: 'POST', json: params })
}

export type GetHostelStudentsListBody = {
  hostel_name: string
  start: number
  num_students: number
}

export function getHostelStudentsList(body: GetHostelStudentsListBody) {
  return apiFetch<unknown>('/get-hostel-students-list', { method: 'POST', json: body })
}

export type AdminPrivilegeApiValue = 'super_user' | 'top_privelege' | 'gaurd'

export type GetAdminUsersListBody = {
  admin_privelege_name: AdminPrivilegeApiValue
  start: number
  num_users: number
}

export function getAdminUsersList(body: GetAdminUsersListBody) {
  return apiFetch<unknown>('/get-admin-users-list', { method: 'POST', json: body })
}

export type AddHostelBody = { hostel_name: string }
export function addHostel(body: AddHostelBody) {
  return apiFetch<unknown>('/add-hostel', { method: 'POST', json: body })
}

// Upload
export function uploadManually(body: Record<string, unknown>) {
  return apiFetch<unknown>('/upload-manually', { method: 'POST', json: body })
}

// Notifications (previous k) - backend may implement later
export function fetchPreviousNotifications(params: { k: number }) {
  return apiFetch<unknown>('/fetch-previous-notifications', { method: 'POST', json: params })
}

