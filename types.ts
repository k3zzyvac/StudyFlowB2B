
export interface User {
    id: string;
    email: string;
}

export type UserRole = 'student' | 'teacher' | 'principal';

export interface Profile {
    id: string;
    user_id: string;
    email: string;
    role: UserRole;
    institution_id?: string;
    class_id?: string;
    daily_usage_count?: number;
    last_usage_reset?: string;
}

export interface SchoolClass {
    id: string;
    institution_id?: string;
    grade: string;
    branch: string;
    created_at?: string;
}

export interface Folder {
    id: string;
    user_id: string;
    name: string;
    color: string;
    icon: string;
    created_at: string;
}

export enum NoteType {
    NORMAL = 'normal',
    AI = 'ai'
}

export interface Note {
    id: string;
    user_id: string;
    folder_id?: string | null;
    title: string;
    body_html: string;
    type: NoteType;
    meta?: {
        year?: string;
        extra?: string;
        style?: string;
    };
    created_at: string;
    updated_at?: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    ts: number;
}

export interface ChatSession {
    id: string;
    messages: ChatMessage[];
}

export interface GenerateNoteRequest {
    title: string;
    year: string;
    extra: string;
    style: string;
}

export interface TranscriptRequest {
    youtubeUrl: string;
    manualText?: string;
}

export interface Flashcard {
    front: string;
    back: string;
}

export interface ExamQuestion {
    id: number;
    question: string;
    options: string[]; // A, B, C, D, E
    correctIndex: number; // 0-4
    explanation: string;
}

export interface WeeklyReport {
    id: string;
    class_id: string;
    week: string;
    date: string;
    lesson: string;
    teacher_name: string;
    topic: string;
    note: string;
    rating: number;
    institution_id?: string;
}
