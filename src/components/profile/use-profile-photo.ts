'use client';
import { useEffect, useRef, useState } from 'react';
import { getProfilePhoto, removeProfilePhoto, saveProfilePhoto } from '@/services/profile-photo.service';

export function useProfilePhoto(userId?: string, token?: string | null) {
  const key = userId && token ? `${userId}:${token}` : '';
  const currentKey = useRef(key); currentKey.current = key;
  const request = useRef(0);
  const [photo, setPhoto] = useState<{ key: string; url: string | null }>({ key: '', url: null });
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    currentKey.current = key;
    const controller = new AbortController(), version = ++request.current;
    setLoadError('');
    if (key && token) getProfilePhoto(token, controller.signal).then(blob => {
      if (!controller.signal.aborted && request.current === version) setPhoto({ key, url: blob ? URL.createObjectURL(blob) : null });
    }).catch(error => {
      if (!controller.signal.aborted && request.current === version) setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar sua foto.');
    });
    return () => { controller.abort(); if (currentKey.current === key) currentKey.current = ''; ++request.current; };
  }, [key, token]);
  useEffect(() => () => { if (photo.url) URL.revokeObjectURL(photo.url); }, [photo.url]);
  async function save(blob: Blob) {
    if (!key || !token) throw new Error('Entre novamente para atualizar sua foto.');
    ++request.current;
    await saveProfilePhoto(token, blob);
    if (currentKey.current === key) { setPhoto({ key, url: URL.createObjectURL(blob) }); setLoadError(''); }
  }
  async function remove() {
    if (!key || !token) throw new Error('Entre novamente para atualizar sua foto.');
    ++request.current;
    await removeProfilePhoto(token);
    if (currentKey.current === key) { setPhoto({ key, url: null }); setLoadError(''); }
  }
  return { photoUrl: photo.key === key ? photo.url : null, loadError, save, remove };
}
