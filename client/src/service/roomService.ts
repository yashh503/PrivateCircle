const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
// Assumes JWT auth with Bearer token
export const getRooms = async (token: string) => {
  const resp = await fetch(`${API_BASE_URL}/rooms`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
};

export const createRoom = async (name: string, token: string) => {
  const resp = await fetch(`${API_BASE_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
};

export const joinRoomByCode = async (code: string, token: string) => {
  const resp = await fetch(`${API_BASE_URL}/rooms/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
};
