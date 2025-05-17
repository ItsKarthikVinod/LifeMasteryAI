import { set, get, del, update, keys } from "idb-keyval";

const GALLERY_PREFIX = "whiteboard_gallery_";

export const saveWhiteboard = async (userId, item) => {
  const key = `${GALLERY_PREFIX}${userId}_${item.id}`;
  await set(key, item);
};

export const getAllWhiteboards = async (userId) => {
  const allKeys = await keys();
  const userKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(GALLERY_PREFIX + userId)
  );
  const items = await Promise.all(userKeys.map((k) => get(k)));
  // Sort by createdAt descending
  return items.sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteWhiteboard = async (userId, id) => {
  const key = `${GALLERY_PREFIX}${userId}_${id}`;
  await del(key);
};

export const updateWhiteboard = async (userId, id, updates) => {
  const key = `${GALLERY_PREFIX}${userId}_${id}`;
  await update(key, (old) => ({ ...old, ...updates }));
};
