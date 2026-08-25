import { request } from "./api";

export type TrackNiche = string;

export interface TrackVersionRecord {
    id: string;
    name: string;
    trackId: string;
    objectKey?: string;
    fileSize?: string | number;
    mimeType?: string;
    duration?: number;
    bpm?: number;
    key?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface TrackRecord {
    id: string;
    name: string;
    bpm?: number;
    duration?: number;
    versionName?: string;
    niche?: TrackNiche[];
    key?: string;
    objectKey?: string;
    fileSize?: string | number;
    mimeType?: string;
    projectId?: string;
    createdAt?: string;
    updatedAt?: string;
    versions?: TrackVersionRecord[];
    activeVersionId?: string;
}

export interface CreateTrackPayload {
    projectId: string;
    name: string;
    versionName: string;
    bpm?: number;
    duration?: number;
    key?: string;
    niche?: TrackNiche[] | string;
    file: File;
}

export interface UpdateTrackPayload {
    trackId: string;
    track: {
        name?: string;
        bpm?: number;
        duration?: number;
        versionName?: string;
        niche?: TrackNiche[] | string;
        key?: string;
    };
}

export interface AttachTrackFilePayload {
    trackId: string;
    file: File;
    versionName: string;
    duration?: number;
    bpm?: number;
    key?: string;
}

function appendFormData(formData: FormData, key: string, value: unknown) {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, String(item)));
        return;
    }

    formData.append(key, typeof value === "string" ? value : String(value));
}

export const trackWebhook = {
    findByUser() {
        return request<TrackRecord[]>("/tracks/get-tracks-by-user", {
            method: "POST",
        });
    },

    findByProject(projectId: string) {
        return request<TrackRecord[]>(`/tracks/get-tracks-by-project/${encodeURIComponent(projectId)}`, {
            method: "POST",
        });
    },

    findById(trackId: string) {
        return request<TrackRecord>(`/tracks/get-track-by-id/${encodeURIComponent(trackId)}`, {
            method: "POST",
        });
    },

    create(data: CreateTrackPayload) {
        const formData = new FormData();

        appendFormData(formData, "projectId", data.projectId);
        appendFormData(formData, "name", data.name);
        appendFormData(formData, "versionName", data.versionName);
        appendFormData(formData, "bpm", data.bpm);
        appendFormData(formData, "duration", data.duration);
        appendFormData(formData, "key", data.key);

        if (data.niche !== undefined) {
            appendFormData(formData, "niche", typeof data.niche === "string" ? data.niche : JSON.stringify(data.niche));
        }

        formData.append("file", data.file);

        return request<TrackRecord>("/tracks/create-track", {
            method: "POST",
            body: formData,
        });
    },

    update(data: UpdateTrackPayload) {
        return request<TrackRecord>(`/tracks/update-track/${encodeURIComponent(data.trackId)}`, {
            method: "PUT",
            body: data.track,
        });
    },

    attachFile(data: AttachTrackFilePayload) {
        const formData = new FormData();

        formData.append("file", data.file);
        formData.append("versionName", data.versionName);
        if (data.duration !== undefined) formData.append("duration", String(data.duration));
        if (data.bpm !== undefined) formData.append("bpm", String(data.bpm));
        if (data.key) formData.append("key", data.key);

        return request<TrackRecord>(`/tracks/attach-track-file/${encodeURIComponent(data.trackId)}`, {
            method: "POST",
            body: formData,
        });
    },

    setActiveVersion(trackId: string, versionId: string) {
        return request<TrackRecord>(`/tracks/set-active-version/${encodeURIComponent(trackId)}`, {
            method: "PUT",
            body: { versionId },
        });
    },

    deleteVersion(trackId: string, versionId: string) {
        return request<void>(`/tracks/delete-version/${encodeURIComponent(trackId)}/${encodeURIComponent(versionId)}`, {
            method: "DELETE",
        });
    },

    delete(trackId: string) {
        return request<{ message?: string; data?: TrackRecord }>(`/tracks/delete-track/${encodeURIComponent(trackId)}`, {
            method: "DELETE",
        });
    },

    getFileUrl(trackId: string) {
        return request<{ url: string }>(`/tracks/get-track-file-url/${encodeURIComponent(trackId)}`, {
            method: "POST",
        });
    },
};
