/**
 * Express API endpoints (backend port 3000)
 */
import { apiFetch } from './client'

// Auth
export type SignInBody = { email: string; password: string }
export async function studentSignIn(body: SignInBody) {
  return apiFetch<{ token?: string; user?: unknown }>('/student-sign-in', {
    method: 'POST',
    json: body,
  })
}
export async function adminSignIn(body: SignInBody) {
  return apiFetch<{ token?: string; user?: unknown }>('/admin-sign-in', {
    method: 'POST',
    json: body,
  })
}

// Invite (visitor entry)
export type InviteBody = {
  host_email: string
  guest_name: string
  guest_contact_number: string
  [key: string]: string
}
export async function invite(body: InviteBody) {
  return apiFetch<unknown>('/invite', { method: 'POST', json: body })
}

// Emergencies
export async function fetchEmergencies() {
  return apiFetch<unknown>('/emergencies', { method: 'GET' })
}

// Activities
export type DateRangeBody = { start?: string; end?: string; [key: string]: string | undefined }
export async function fetchRecentActivities(params: DateRangeBody) {
  return apiFetch<unknown>('/fetch-recent-activities', { method: 'POST', json: params })
}
export async function fetchTimerangeActivities(params: DateRangeBody) {
  return apiFetch<unknown>('/fetch-timerange-activities', { method: 'POST', json: params })
}
export async function getActivity(params: Record<string, string>) {
  return apiFetch<unknown>('/get-activity', { method: 'POST', json: params })
}

// Past recordings
export async function getPastRecording(params: Record<string, string>) {
  return apiFetch<unknown>('/get-past-recording', { method: 'POST', json: params })
}

// Manage: hostels & admin list
export async function getHostelsList(params: { hostel_name?: string }) {
  // Backend currently ignores body but frontend may send optional hostel_name filter.
  return apiFetch<unknown>('/get-hostels-list', { method: 'POST', json: params })
}

export type GetHostelStudentsListBody = {
  hostel_name: string
  start: number
  num_students: number
}

export async function getHostelList(body: GetHostelStudentsListBody) {
  // [express] post /get-hostel-students-list inputs:(hostel_name,start,num_students)
  return apiFetch<unknown>('/get-hostel-students-list', { method: 'POST', json: body })
}

export type AdminPrivilegeApiValue = 'super_user' | 'top_privelege' | 'gaurd'

export type GetAdminUsersListBody = {
  admin_privelege_name: AdminPrivilegeApiValue
  start: number
  num_users: number
}

export async function getAdminList(body: GetAdminUsersListBody) {
  // [express] post /get-admin-users-list inputs:(admin_previlege_name,start,num_users)
  return apiFetch<unknown>('/get-admin-users-list', { method: 'POST', json: body })
}

// Manage: add hostel
export type AddHostelBody = { hostel_name: string }
export async function addHostel(body: AddHostelBody) {
  // [express] post /add-hostel inputs:(hostel_name)
  return apiFetch<unknown>('/add-hostel', { method: 'POST', json: body })
}

// Manage: add/delete/edit (upload)
export async function uploadManually(body: Record<string, unknown>) {
  return apiFetch<unknown>('/upload-manually', { method: 'POST', json: body })
}
export async function uploadCsv(body: FormData) {
  const API_BASE = 'http://127.0.0.1:3000'
  const res = await fetch(`${API_BASE}/upload-csv`, {
    method: 'POST',
    body,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// Notifications (previous k)
export async function fetchPreviousNotifications(params: { k: number }) {
  return apiFetch<unknown>('/fetch-previous-notifications', {
    method: 'POST',
    json: params,
  })
}
