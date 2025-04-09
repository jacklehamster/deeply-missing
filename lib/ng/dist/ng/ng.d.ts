export interface Config {
    game?: string;
    url?: string;
    key: string;
    skey: string;
    debug?: boolean;
    audioIn?: string;
    audioOut?: string;
    noAudio?: boolean;
}
export declare const TESTCONFIG: {
    game: string;
    url: string;
    key: string;
    skey: string;
};
interface CallbackResult {
    medal?: Medal;
    medals?: Medal[];
    slot?: Slot;
    slots?: Slot[];
    success: boolean;
    scoreboards: Scoreboard[];
}
interface NGIO {
    user?: {
        name: string;
        icons: {
            small: string;
            medium: string;
            large: string;
        };
        supporter: boolean;
    };
    login_error?: {
        message: string;
    };
    session_id?: string;
    checkSession(callback: (e: any) => void): void;
    callComponent(command: string, payload: {
        id?: string | number;
        value?: number;
        host?: string;
        event_name?: string;
        data?: any;
    }, callback: (result: CallbackResult) => void): void;
    getValidSession(callback: (e?: any) => void): void;
    requestLogin(onLoggedIn: () => void, onLoginFailed: () => void, onLoginCancelled: () => void): void;
    logOut(onLoggedOut: () => void): void;
}
interface Medal {
    name: string;
    unlocked: boolean;
    id: string;
    icon: string;
    description: string;
}
interface Scoreboard {
    name: string;
    id: string;
}
interface Slot {
    datetime: string;
    id: number;
    size: number;
    timestamp: number;
    url: string;
    data?: any;
}
export declare class NewgroundsWrapper {
    #private;
    config: Config;
    audio?: HTMLAudioElement;
    audioOut?: HTMLAudioElement;
    gameUrl?: string;
    static validateSession(session: string, config?: Config): Promise<string | undefined>;
    static saveData(data: any, session: string, config?: Config): Promise<unknown>;
    validateSession(session: string): Promise<string | undefined>;
    addLoginListener(listener: () => void): void;
    addLogoutListener(listener: () => void): void;
    addUnlockListener(listener: (medal: Medal) => void): void;
    removeLoginListener(listener: () => void): void;
    removeLogoutListener(listener: () => void): void;
    removeUnlockListener(listener: (medal: Medal) => void): void;
    get ngio(): NGIO;
    constructor(config?: Config);
    get key(): string;
    get loggedIn(): boolean;
    get icons(): {
        small: string;
        medium: string;
        large: string;
    } | undefined;
    get user(): string | undefined;
    get supporter(): boolean | undefined;
    get session(): string | undefined;
    getScoreboards(): Promise<Scoreboard[]>;
    getMedals(): Promise<Medal[]>;
    unlockMedal(medal_name: string): Promise<Medal | undefined>;
    requestLogin(): void;
    requestLogout(): Promise<void>;
    onLoginFailed(): void;
    onLoginCancelled(): void;
    initSession(): void;
    onLoggedIn(): void;
    showReceivedMedal(medal: Medal): void;
    postScore(value: number, boardname: string): Promise<boolean | void>;
    logEvent(name: string): Promise<unknown>;
    loadSlots(): Promise<{
        data: any;
        datetime: string;
        id: number;
        size: number;
        timestamp: number;
        url: string;
    }[]>;
    loadSlot(id: number): Promise<{
        data: any;
        datetime: string;
        id: number;
        size: number;
        timestamp: number;
        url: string;
    } | undefined>;
    saveData(id: number, data: any): Promise<Slot | undefined>;
}
export {};
