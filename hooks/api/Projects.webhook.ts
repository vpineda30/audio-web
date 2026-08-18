import { Project } from "@/lib/data";
import { request } from "./api";

export const projectWebhook = {
    create(token: string, body: { userid: string; project: {
            name: string;
            description?: string;
            duration?: number;
            size?: number;
        }}
    ) {
        return request<Project>("/projects/create-project", {
            method: "POST",
            token,
            body,
        });
    },

    findAll(token: string, userid: string) {
        return request<Project[]>("/projects/get-projects", {
            method: "POST",
            token,
            body: {
                userid,
            },
        });
    },

    findById(token: string, userid: string, projectId: string) {
        return request<Project>("/projects/get-project-by-id", {
            method: "POST",
            token,
            body: {
                userid,
                projectId,
            },
        });
    },

    update(token: string, body: { userid: string; projectId: string; project: {
                name?: string;
                description?: string;
                duration?: number;
                size?: number;
                color?: string
            }}
    ) {
        return request<Partial<Project>>("/projects/update-project", {
            method: "PUT",
            token,
            body,
        });
    },

    delete(token: string, userid: string, projectId: string) {
        return request("/projects/delete-project", {
            method: "DELETE",
            token,
            body: {
                userid,
                projectId,
            },
        });
    },
};