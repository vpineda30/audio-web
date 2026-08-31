import {
    Project,
    ProjectShareLink,
    SharedDownloadResponse,
    SharedProjectResponse,
    SharePermission,
} from "@/lib/data";
import type { TrackRecord } from "./Tracks.webhook";
import { request } from "./api";

export const projectWebhook = {
    create(project: {
            name: string;
            description?: string;
            duration?: number;
            size?: number;
        }
    ) {
        return request<Project>("/projects/create-project", {
            method: "POST",
            body: project,
        });
    },

    findAll() {
        return request<Project[]>("/projects/get-projects", {
            method: "POST",
        });
    },

    findById(projectId: string) {
        return request<Project>(`/projects/get-project-by-id/${encodeURIComponent(projectId)}`, {
            method: "POST",
        });
    },

    update(projectId: string, project: {
                name?: string;
                description?: string;
                duration?: number;
                size?: number;
            }
    ) {
        return request<Partial<Project>>(`/projects/update-project/${encodeURIComponent(projectId)}`, {
            method: "PUT",
            body: project,
        });
    },

    delete(projectId: string) {
        return request(`/projects/delete-project/${encodeURIComponent(projectId)}`, {
            method: "DELETE",
        });
    },

    createShareLink(projectId: string, payload: {
        permission: SharePermission;
        expiresAt?: string | null;
    }) {
        return request<ProjectShareLink>(`/projects/${encodeURIComponent(projectId)}/share-links`, {
            method: "POST",
            body: payload,
        });
    },

    findShareLinks(projectId: string) {
        return request<ProjectShareLink[]>(`/projects/${encodeURIComponent(projectId)}/share-links`, {
            method: "GET",
        });
    },

    deleteShareLink(projectId: string, shareLinkId: string) {
        return request<void>(`/projects/${encodeURIComponent(projectId)}/share-links/${encodeURIComponent(shareLinkId)}`, {
            method: "DELETE",
        });
    },

    getSharedProject(token: string) {
        return request<SharedProjectResponse>(`/share/${encodeURIComponent(token)}`, {
            method: "GET",
        });
    },

    getSharedTrackDownloadUrl(token: string, trackId: string) {
        return request<SharedDownloadResponse>(`/share/${encodeURIComponent(token)}/tracks/${encodeURIComponent(trackId)}/download`, {
            method: "GET",
        });
    },

    getSharedTrackPreviewUrl(token: string, trackId: string) {
        return request<SharedDownloadResponse>(`/share/${encodeURIComponent(token)}/tracks/${encodeURIComponent(trackId)}/preview`, {
            method: "GET",
        });
    },

    updateSharedProject(token: string, payload: {
        name?: string;
        description?: string;
    }) {
        return request<SharedProjectResponse>(`/share/${encodeURIComponent(token)}/project`, {
            method: "PATCH",
            body: payload,
        });
    },

    updateSharedTrack(token: string, trackId: string, payload: {
        name?: string;
        bpm?: number;
        duration?: number;
        key?: string;
        versionName?: string;
    }) {
        return request<TrackRecord>(`/share/${encodeURIComponent(token)}/tracks/${encodeURIComponent(trackId)}`, {
            method: "PATCH",
            body: payload,
        });
    },

    createSharedTrack(token: string, data: {
        name: string;
        versionName: string;
        bpm?: number;
        duration?: number;
        key?: string;
        file: File;
    }) {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('versionName', data.versionName);
        if (data.bpm !== undefined) formData.append('bpm', String(data.bpm));
        if (data.duration !== undefined) formData.append('duration', String(data.duration));
        if (data.key) formData.append('key', data.key);
        formData.append('file', data.file);
        return request<TrackRecord>(`/share/${encodeURIComponent(token)}/tracks`, {
            method: "POST",
            body: formData,
        });
    },

    createSharedTrackVersion(token: string, trackId: string, data: {
        versionName: string;
        bpm?: number;
        duration?: number;
        key?: string;
        file: File;
    }) {
        const formData = new FormData();
        formData.append('versionName', data.versionName);
        if (data.bpm !== undefined) formData.append('bpm', String(data.bpm));
        if (data.duration !== undefined) formData.append('duration', String(data.duration));
        if (data.key) formData.append('key', data.key);
        formData.append('file', data.file);
        return request<TrackRecord>(`/share/${encodeURIComponent(token)}/tracks/${encodeURIComponent(trackId)}/versions`, {
            method: "POST",
            body: formData,
        });
    },

    setSharedActiveVersion(token: string, trackId: string, versionId: string) {
        return request<TrackRecord>(`/share/${encodeURIComponent(token)}/tracks/${encodeURIComponent(trackId)}/active-version`, {
            method: "PUT",
            body: { versionId },
        });
    },

    deleteSharedTrackVersion(token: string, trackId: string, versionId: string) {
        return request<void>(`/share/${encodeURIComponent(token)}/tracks/${encodeURIComponent(trackId)}/versions/${encodeURIComponent(versionId)}`, {
            method: "DELETE",
        });
    },

    deleteSharedTrack(token: string, trackId: string) {
        return request<void>(`/share/${encodeURIComponent(token)}/tracks/${encodeURIComponent(trackId)}`, {
            method: "DELETE",
        });
    },

    filterTracksByProjectId(projectId: string, filters: {
        name?: string;
        minBpm?: number;
        maxBpm?: number;
        key?: string;
    } = {}) {
        return request<TrackRecord[]>(`/projects/filter-tracks-by-project-id/${encodeURIComponent(projectId)}`, {
            method: "POST",
            body: filters,
        });
    },
};