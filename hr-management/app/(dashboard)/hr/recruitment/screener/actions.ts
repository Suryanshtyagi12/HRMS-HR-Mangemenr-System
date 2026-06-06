"use server"
// TODO P1-10: Replace these stubs with real FastAPI calls via Axios
// These server actions are deprecated — data will come from TanStack Query hooks

export async function getActiveJobs() {
  // Will be replaced by: GET /jobs?status=OPEN via FastAPI
  return []
}

export async function updateApplicationStatus(id: string, status: string) {
  // Will be replaced by: PATCH /applications/{id}/status via FastAPI
  return { id, status }
}
