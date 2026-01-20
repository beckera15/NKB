import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// File upload helper
export interface UploadResult {
  url: string
  path: string
  error?: string
}

export async function uploadFile(
  file: File,
  bucket: string = 'uploads',
  folder: string = ''
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = folder ? `${folder}/${fileName}` : fileName

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return { url: '', path: '', error: error.message }
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    path: data.path,
  }
}

export async function deleteFile(
  path: string,
  bucket: string = 'uploads'
): Promise<{ error?: string }> {
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    return { error: error.message }
  }

  return {}
}

export function getFileUrl(path: string, bucket: string = 'uploads'): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
