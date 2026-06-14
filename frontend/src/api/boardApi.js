import axiosInstance from './axios';

export const getBoards      = ()          => axiosInstance.get('/boards');
export const getBoardById   = (id)        => axiosInstance.get(`/boards/${id}`);
export const createBoard    = (data)      => axiosInstance.post('/boards', data);
export const updateBoard    = (id, data)  => axiosInstance.patch(`/boards/${id}`, data);
export const deleteBoard    = (id)        => axiosInstance.delete(`/boards/${id}`);
export const getBoardMembers= (id)        => axiosInstance.get(`/boards/${id}/members`);
export const inviteMember   = (id, email) => axiosInstance.post(`/boards/${id}/invite`, { email });
export const removeMember   = (id, uid)   => axiosInstance.delete(`/boards/${id}/members/${uid}`);