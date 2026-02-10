import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FaqSuggestion {
    createdAt: Time;
    sourceContent: string;
    sourceAuthor: Principal;
    suggestedQuestion: string;
    sourceMessageId: MessageId;
}
export interface FaqEntry {
    question: string;
    answer: string;
}
export type Time = bigint;
export type MessageId = bigint;
export interface Message {
    id: MessageId;
    content: string;
    author: Principal;
    timestamp: Time;
    isPublic: boolean;
}
export interface MamaFeedbackMetadata {
    explanation: string;
    userPrompt: string;
    category: string;
}
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
    calculateVarietySeed(): Promise<[bigint, boolean]>;
    clearFeedbackMetadata(): Promise<void>;
    findFaqMatch(question: string): Promise<FaqEntry | null>;
    getAllCategoryStats(): Promise<Array<[string, number, bigint]>>;
    getAllCategoryTotalsByUser(): Promise<Array<[string, number]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategoryStats(category: string): Promise<{
        count: bigint;
        recentTimestamps: Array<Time>;
        averageScore: number;
    } | null>;
    getChatStats(): Promise<[bigint, bigint, bigint]>;
    getFeedbackMetadata(): Promise<MamaFeedbackMetadata | null>;
    getNewPublicMessages(): Promise<Array<Message>>;
    getPendingFaqSuggestions(): Promise<Array<FaqSuggestion>>;
    getPersonalizedVarietySeed(): Promise<bigint | null>;
    getPrivateMessages(): Promise<Array<Message>>;
    getPublicMessages(): Promise<Array<Message>>;
    getPubliclyAccessibleStats(): Promise<{
        totalPublicMessages: bigint;
        totalFaqEntries: bigint;
        totalPrivateMessages: bigint;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVarietySeedWithFallback(): Promise<bigint>;
    hasPersonalizedVarietySeed(): Promise<boolean>;
    ignoreFaqSuggestion(question: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    promoteFaqSuggestion(question: string, answer: string): Promise<void>;
    resetPersonalizedVarietySeed(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveFeedbackMetadata(metadata: MamaFeedbackMetadata): Promise<void>;
    searchFaqsByKeyword(keyword: string): Promise<Array<FaqEntry>>;
    sendMessage(content: string, isPublic: boolean): Promise<MessageId>;
    setPersonalizedVarietySeed(seed: bigint): Promise<void>;
    storeAnonymizedSignal(category: string, normalizedScore: number): Promise<void>;
}
