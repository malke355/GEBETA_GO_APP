import { env } from '@/config/env';
import type { PickedImage } from '@/types/media';

export function resolveMediaUrl(path?: string | null): string {
  if (!path) {
    return '';
  }
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('file:') ||
    path.startsWith('data:') ||
    path.startsWith('content:')
  ) {
    return path;
  }

  const base = env.apiUrl.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function appendPickedImage(form: FormData, field: string, image?: PickedImage | null): void {
  if (!image) {
    return;
  }

  form.append(field, {
    uri: image.uri,
    name: image.name,
    type: image.type,
  } as unknown as Blob);
}
