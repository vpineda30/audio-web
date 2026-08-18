import { request } from "./api";

export type TrackNiche = string;

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
}

export interface CreateTrackPayload {
    userId: string;
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
    userId: string;
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
    userId: string;
    trackId: string;
    file: File;
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
    findByUser(token: string, userId: string) {
        return request<TrackRecord[]>("/tracks/get-tracks-by-user", {
            method: "POST",
            token,
            body: {
                userId,
            },
        });
    },

    findByProject(token: string, userId: string, projectId: string) {
        return request<TrackRecord[]>("/tracks/get-tracks-by-project", {
            method: "POST",
            token,
            body: {
                userId,
                projectId,
            },
        });
    },

    findById(token: string, userId: string, trackId: string) {
        return request<TrackRecord>("/tracks/get-track-by-id", {
            method: "POST",
            token,
            body: {
                userId,
                trackId,
            },
        });
    },

    create(token: string, data: CreateTrackPayload) {
        const formData = new FormData();

        appendFormData(formData, "userId", data.userId);
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
            token,
            body: formData,
        });
    },

    update(token: string, data: UpdateTrackPayload) {
        return request<TrackRecord>("/tracks/update-track", {
            method: "PUT",
            token,
            body: data,
        });
    },

    attachFile(token: string, data: AttachTrackFilePayload) {
        const formData = new FormData();

        appendFormData(formData, "userId", data.userId);
        appendFormData(formData, "trackId", data.trackId);
        formData.append("file", data.file);

        return request<TrackRecord>("/tracks/attach-track-file", {
            method: "POST",
            token,
            body: formData,
        });
    },

    delete(token: string, userId: string, trackId: string) {
        return request<{ message?: string; data?: TrackRecord }>("/tracks/delete-track", {
            method: "DELETE",
            token,
            body: {
                userId,
                trackId,
            },
        });
    },

    getFileUrl(token: string, data: { userId: string; trackId: string; expiresIn?: number }) {
        return request<{ url: string }>("/tracks/get-track-file-url", {
            method: "POST",
            token,
            body: {
                userId: data.userId,
                trackId: data.trackId,
                expiresIn: data.expiresIn ?? 3600,
            },
        });
    },
};
