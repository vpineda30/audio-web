import { User } from "@/lib/data";
import { request } from "./api";

interface UserResponse {
  subscriptionPlan: any;
  user: User;
}

export const userWebhook = {
    me() {
        return request<UserResponse>("/user/me");
    },

    findById(id: string) {
        return request<UserResponse>(`/user/find-user-by-id/${id}`) 
    },

    findByEmail(email: string) {
        return request<UserResponse>("/user/find-user-by-email", {
            method: "POST",
            body: {
                email,
            },
        });
    },

    create(name: string, email: string, password: string) {
        return request("/user/create-user", {
            method: "POST",
            body: {
                name,
                email,
                password,
            },
        });
    },

    update(
        id: string,
        data: {
            name?: string;
            email?: string;
            password?: string;
        }
    ) {
        return request(`/user/update-user/${id}`, {
            method: "PUT",
            body: data,
        });
    },

    delete(id: string) {
        return request(`/user/delete-user/${id}`, {
            method: "DELETE",
        });
    },
};