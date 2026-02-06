import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    content: string;
    author: Principal;
    timestamp: Time;
    isPublic: boolean;
}
export interface FaqEntry {
    question: string;
    answer: string;
}
export type Time = bigint;
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addFaqEntry(question: string, answer: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    findFaqMatch(question: string): Promise<FaqEntry | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChatStats(): Promise<[bigint, bigint, bigint]>;
    getNewPublicMessages(): Promise<Array<Message>>;
    getPrivateMessages(): Promise<Array<Message>>;
    getPublicMessages(): Promise<Array<Message>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchFaqsByKeyword(keyword: string): Promise<Array<FaqEntry>>;
    sendMessage(content: string, isPublic: boolean): Promise<void>;
}
