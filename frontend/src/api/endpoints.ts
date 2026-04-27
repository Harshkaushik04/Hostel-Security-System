/**
 * Express API endpoints (backend port 3000)
 */
import { apiFetch, API_BASE } from './client'

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
  guest_name: string
  guest_contact_number: string
  [key: string]: string
}
export type InviteResponse = {
  approved?: boolean
  error?: string
}
export async function invite(body: InviteBody) {
  return apiFetch<InviteResponse>('/invite', { method: 'POST', json: body })
}

// Emergencies
export async function fetchEmergencies() {
  return apiFetch<unknown>('/emergencies', { method: 'GET' })
}

// Past recordings (Node backend: GET /recordings/:cameraName → { files: string[] })
export async function listRecordings(cameraName: string) {
  const q = encodeURIComponent(cameraName.trim())
  return apiFetch<{ files: string[] }>(`/recordings/${q}`, { method: 'GET' })
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

// Cameras ↔ hostels (CamerasModel)
export type CameraRow = { cameraName: string; hostelName: string }

export async function getCamerasList() {
  return apiFetch<{ cameras: CameraRow[] } | { error: string }>('/get-cameras-list', {
    method: 'POST',
    json: {},
  })
}

export async function addCamera(body: CameraRow) {
  return apiFetch<unknown>('/add-camera', { method: 'POST', json: body })
}

export async function editCamera(body: {
  cameraName: string
  hostelName: string
  newCameraName?: string
}) {
  return apiFetch<unknown>('/edit-camera', { method: 'POST', json: body })
}

export async function deleteCamera(body: { cameraName: string }) {
  return apiFetch<unknown>('/delete-camera', { method: 'POST', json: body })
}

// Manage: add/delete/edit users
export async function addManually(body: Record<string, unknown>) {
  return apiFetch<unknown>('/upload-manually', { method: 'POST', json: body })
}
export async function editUser(body: Record<string, unknown>) {
  return apiFetch<unknown>('/edit', { method: 'POST', json: body })
}
export async function deleteUser(body: Record<string, unknown>) {
  return apiFetch<unknown>('/delete', { method: 'POST', json: body })
}
export type CsvUploadSummary = {
  approved?: boolean
  created?: number
  skipped?: number
  rowErrors?: { row: number; message: string }[]
  error?: string
}

/** CSV columns: name,email,password,entry_number,hostel_name */
export async function uploadStudentCsv(form: FormData) {
  return uploadMultipart('/upload-student-csv', form)
}

/** CSV columns: name,email,password,privelege,allocated_hostel */
export async function uploadAdminCsv(form: FormData) {
  return uploadMultipart('/upload-admin-csv', form)
}

async function uploadMultipart(path: string, form: FormData): Promise<CsvUploadSummary> {
  const headers: HeadersInit = {}
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('token')
    if (token) {
      ;(headers as Record<string, string>).token = token
    }
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: form,
    headers,
  })
  const data = (await res.json().catch(() => ({}))) as CsvUploadSummary
  if (!res.ok) {
    const msg = typeof data.error === 'string' ? data.error : await res.text().catch(() => res.statusText)
    throw new Error(msg || `HTTP ${res.status}`)
  }
  return data
}

// Notifications (previous k)
export async function fetchPreviousNotifications(params: { k: number }) {
  return apiFetch<unknown>('/fetch-previous-notifications', {
    method: 'POST',
    json: params,
  })
}
