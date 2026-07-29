import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type StorageBucket = 'avatars' | 'projects' | 'generated-assets' | 'images' | 'documents';

interface UploadOptions {
  bucket: StorageBucket;
  path: string;
  file: File | Blob | ArrayBuffer;
  contentType?: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadFile({ bucket, path, file, contentType }: UploadOptions): Promise<UploadResult> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function deleteFile(bucket: StorageBucket, path: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  return !error;
}

export async function getSignedUrl(bucket: StorageBucket, path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  return error ? null : data.signedUrl;
}

export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return data.publicUrl;
}

export async function listFiles(bucket: StorageBucket, folder?: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });
  return error ? [] : data;
}
