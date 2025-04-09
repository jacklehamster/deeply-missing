/** Start Class NGIO **/
/**
 * NGIO singleton wrapper for NewgroundsIO Library.
 */
export class NGIO {
    /**
     * @type {string}
     */
    static get STATUS_INITIALIZED(): string;
    /**
     * @type {string}
     */
    static get STATUS_CHECKING_LOCAL_VERSION(): string;
    /**
     * @type {string}
     */
    static get STATUS_LOCAL_VERSION_CHECKED(): string;
    /**
     * @type {string}
     */
    static get STATUS_PRELOADING_ITEMS(): string;
    /**
     * @type {string}
     */
    static get STATUS_ITEMS_PRELOADED(): string;
    /**
     * @type {string}
     */
    static get STATUS_READY(): string;
    /**
     * @type {string}
     */
    static get STATUS_SESSION_UNINITIALIZED(): string;
    /**
     * @type {string}
     */
    static get STATUS_WAITING_FOR_SERVER(): string;
    /**
     * @type {string}
     */
    static get STATUS_LOGIN_REQUIRED(): string;
    /**
     * @type {string}
     */
    static get STATUS_WAITING_FOR_USER(): string;
    /**
     * @type {string}
     */
    static get STATUS_LOGIN_CANCELLED(): string;
    /**
     * @type {string}
     */
    static get STATUS_LOGIN_SUCCESSFUL(): string;
    /**
     * @type {string}
     */
    static get STATUS_LOGIN_FAILED(): string;
    /**
     * @type {string}
     */
    static get STATUS_USER_LOGGED_OUT(): string;
    /**
     * @type {string}
     */
    static get STATUS_SERVER_UNAVAILABLE(): string;
    /**
     * @type {string}
     */
    static get STATUS_EXCEEDED_MAX_ATTEMPTS(): string;
    /**
     * Will be true if the current connection status is one requiring a 'please
     * wait' message
     * @type {boolean}
     */
    static get isWaitingStatus(): boolean;
    /**
     * @type {string}
     */
    static get PERIOD_TODAY(): string;
    /**
     * @type {string}
     */
    static get PERIOD_CURRENT_WEEK(): string;
    /**
     * @type {string}
     */
    static get PERIOD_CURRENT_MONTH(): string;
    /**
     * @type {string}
     */
    static get PERIOD_CURRENT_YEAR(): string;
    /**
     * @type {string}
     */
    static get PERIOD_ALL_TIME(): string;
    /**
     * @type {Array.<string>}
     */
    static get PERIODS(): string[];
    /**
     * A reference to the NewgroundsIO.Core instance created in Init().
     * @type {NewgroundsIO.Core}
     */
    static get ngioCore(): NewgroundsIO.Core;
    static "__#1@#ngioCore": null;
    static get medalScore(): number;
    static "__#1@#medalScore": number;
    /**
     * An array of preloaded medals
     * @type {Array.<NewgroundsIO.objects.Medal>}
     */
    static get medals(): NewgroundsIO.objects.Medal[];
    static "__#1@#medals": null;
    /**
     * An array of preloaded scoreBoards
     * @type {Array.<NewgroundsIO.objects.ScoreBoard>}
     */
    static get scoreBoards(): NewgroundsIO.objects.ScoreBoard[];
    static "__#1@#scoreBoards": null;
    /**
     * An array of preloaded saveSlots
     * @type {Array.<NewgroundsIO.objects.SaveSlot>}
     */
    static get saveSlots(): NewgroundsIO.objects.SaveSlot[];
    static "__#1@#saveSlots": null;
    /**
     * The last time a component or queue was executed
     * @type {Date}
     */
    static get lastExecution(): Date;
    static "__#1@#lastExecution": Date;
    /**
     * Contains the last connection status. Value will be one of the STATUS_XXXXX
     * constants.
     * @type {string}
     */
    static get lastConnectionStatus(): string;
    static "__#1@#lastConnectionStatus": Date;
    /**
     * Will be null unless there was an error in our session.
     * @type {NewgroundsIO.objects.Error}
     */
    static get sessionError(): NewgroundsIO.objects.Error;
    static "__#1@#sessionError": null;
    /**
     * Will be set to false if the local copy of the game is being hosted
     * illegally.
     * @type {boolean}
     */
    static get legalHost(): boolean;
    static "__#1@#legalHost": boolean;
    /**
     * Will be set to true if this is an out-of-date copy of the game.
     * @type {boolean}
     */
    static get isDeprecated(): boolean;
    static "__#1@#isDeprecated": boolean;
    /**
     * This is the version number(string) of the newest available copy of the
     * game.
     * @type {boolean}
     */
    static get newestVersion(): boolean;
    static "__#1@#newestVersion": boolean;
    /**
     * Will be true if the user opened the login page via OpenLoginPage().
     * @type {boolean}
     */
    static get loginPageOpen(): boolean;
    static "__#1@#loginPageOpen": boolean;
    /**
     * The current version of the Newgrounds.io gateway.
     * @type {string}
     */
    static get gatewayVersion(): string;
    static "__#1@#gatewayVersion": boolean;
    /**
     * Stores the last medal that was unlocked.
     * @type {NewgroundsIO.objects.Medal}
     */
    static get lastMedalUnlocked(): NewgroundsIO.objects.Medal;
    static "__#1@#lastMedalUnlocked": boolean;
    /**
     * Stores the last scoreboard that was posted to.
     * @type {NewgroundsIO.objects.ScoreBoard}
     */
    static get lastBoardPosted(): NewgroundsIO.objects.ScoreBoard;
    static "__#1@#lastBoardPosted": boolean;
    /**
     * Stores the last score that was posted to.
     * @type {NewgroundsIO.objects.Score}
     */
    static get lastScorePosted(): NewgroundsIO.objects.Score;
    static "__#1@#lastScorePosted": boolean;
    /**
     * Stores the last scores that were loaded.
     * @type {NewgroundsIO.results.ScoreBoard.getScores}
     */
    static get lastGetScoresResult(): NewgroundsIO.results.ScoreBoard.getScores;
    static "__#1@#lastGetScoresResult": boolean;
    /**
     * Stores the last saveSlot that had data loaded.
     * @type {NewgroundsIO.objects.SaveSlot}
     */
    static get lastSaveSlotLoaded(): NewgroundsIO.objects.SaveSlot;
    static "__#1@#lastSaveSlotLoaded": boolean;
    /**
     * Stores the last saveSlot that had data saved.
     * @type {NewgroundsIO.objects.SaveSlot}
     */
    static get lastSaveSlotSaved(): NewgroundsIO.objects.SaveSlot;
    static "__#1@#lastSaveSlotSaved": boolean;
    /**
     * Stores the last DateTime that was loaded from the API.
     * @type {string}
     */
    static get lastDateTime(): string;
    static "__#1@#lastDateTime": string;
    /**
     * Stores the last event that was logged.
     * @type {string}
     */
    static get lastLoggedEvent(): string;
    static "__#1@#lastLoggedEvent": null;
    /**
     * Stores the last unix timestamp that was loaded API.
     * @type {number}
     */
    static get lastTimeStamp(): number;
    static "__#1@#lastTimeStamp": number;
    /**
     * Stores wether the last server ping succeeded.
     * @type {boolean}
     */
    static get lastPingSuccess(): boolean;
    static "__#1@#lastPingSuccess": boolean;
    /**
     * Will be true if we've called Init().
     * @type {boolean}
     */
    static get isInitialized(): boolean;
    /**
     * Contains all information about the current user session.
     * @type {NewgroundsIO.objects.Session}
     */
    static get session(): NewgroundsIO.objects.Session;
    /**
     * Contains user information if the user is logged in. Otherwise null.
     * @type {NewgroundsIO.objects.User}
     */
    static get user(): NewgroundsIO.objects.User;
    /**
     * Returns true if we currently have a valid session ID.
     * @type {boolean}
     */
    static get hasSession(): boolean;
    /**
     * Returns true if we currently have a valid session ID.
     * @type {boolean}
     */
    static get hasUser(): boolean;
    /**
     * Will be true if we've finished logging in and preloading data.
     * @type {boolean}
     */
    static get isReady(): boolean;
    /**
     * The version number passed in Init()'s options
     * @type {string}
     */
    static get version(): string;
    static "__#1@#version": string;
    /**
     * Will be tue if using debugMode via Init()
     * @type {boolean}
     */
    static get debugMode(): boolean;
    static "__#1@#debugMode": boolean;
    static "__#1@#preloadFlags": {
        autoLogNewView: boolean;
        preloadMedals: boolean;
        preloadScoreBoards: boolean;
        preloadSaveSlots: boolean;
    };
    static "__#1@#sessionReady": boolean;
    static "__#1@#skipLogin": boolean;
    static "__#1@#localVersionChecked": boolean;
    static "__#1@#checkingConnectionStatus": boolean;
    /**
     * Initializes the NGIO wrapper. You must call this BEFORE using any other
     * methods!
     * @param {string} appID The App ID from your Newgrounds Project's "API Tools"
     *     page.
     * @param {string} aesKey The AES-128 encryption key from your Newgrounds
     *     Project's "API Tools" page.
     * @param {object} [options] An object of options to set up the API wrapper.
     * @param {string} [options.version] A string in "X.X.X" format indicating the
     *     current version of this game.
     * @param {boolean} [options.checkHostLicense] Set to true to check if the
     *     site hosting your game has been blocked.
     * @param {boolean} [options.preloadMedals] Set to true to preload medals
     *     (will show if the player has any unlocked, and get their current medal
     *     score).
     * @param {boolean} [options.preloadeScoreBoards] Set to true to preload Score
     *     Board information.
     * @param {boolean} [options.preloadeSaveSlots] Set to true to preload Save
     *     Slot information.
     * @param {boolean} [options.autoLogNewView] Set to true to automatcally log a
     *     new view to your stats.
     * @param {boolean} [options.debugMode] Set to true to run in debug mode.
     */
    static init(appID: string, aesKey: string, options?: {
        version?: string | undefined;
        checkHostLicense?: boolean | undefined;
        preloadMedals?: boolean | undefined;
        preloadeScoreBoards?: boolean | undefined;
        preloadeSaveSlots?: boolean | undefined;
        autoLogNewView?: boolean | undefined;
        debugMode?: boolean | undefined;
    } | undefined): void;
    /**
     * Call this if you want to skip logging the user in.
     */
    static skipLogin(): void;
    /**
     * Opens the Newgrounds login page in a new browser tab.
     */
    static openLoginPage(): void;
    /**
     * If the user opened the NG login page, you can call this to cancel the login
     * attempt.
     */
    static cancelLogin(): void;
    /**
     * Logs the current use out of the game (locally and on the server) and resets
     * the connection status.
     */
    static logOut(): void;
    /**
     * Loads "Your Website URL", as defined on your App Settings page, in a new
     * browser tab.
     */
    static loadAuthorUrl(): void;
    /**
     * Loads our "Official Version URL", as defined on your App Settings page, in
     * a new browser tab.
     */
    static loadOfficialUrl(): void;
    /**
     * Loads the Games page on Newgrounds in a new browser tab.
     */
    static loadMoreGames(): void;
    /**
     * Loads the Newgrounds frontpage in a new browser tab.
     */
    static loadNewgrounds(): void;
    /**
     * Loads the Newgrounds frontpage in a new browser tab.
     * @param {string} referralName The name of your custom referral.
     */
    static loadReferral(referralName: string): void;
    /**
     * Gets a preloaded Medal object.
     * @param {number} medalID The ID of the medal
     */
    static getMedal(medalID: number): any;
    /**
     * @callback unlockMedalCallback
     * @param {NewgroundsIO.objects.Medal} medal
     */
    /**
     * Attempts to unlock a medal and returns the medal to an optional callback
     * function when complete.
     * @param {number} medalID The id of the medal you are unlocking.
     * @param {unlockMedalCallback} [callback] A function to run when the medal
     *     has unlocked.
     * @param {object} [thisArg] An optional object to use as 'this' in your
     *     callback function.
     */
    static unlockMedal(medalID: number, callback?: ((medal: NewgroundsIO.objects.Medal) => any) | undefined, thisArg?: object | undefined): void;
    /**
     * Gets a preloaded ScoreBoard object.
     * @param {number} scoreBoardID The ID of the score board
     */
    static getScoreBoard(scoreBoardID: number): any;
    /**
     * @callback postScoreCallback
     * @param {NewgroundsIO.objects.ScoreBoard} scoreBoard
     * @param {NewgroundsIO.objects.Score} score
     */
    /**
     * Posts a score and returns the score and scoreboard to an optional callback
     * function when complete.
     * @param {number} boardID The id of the scoreboard you are posting to.
     * @param {number} value The integer value of your score.
     * @param {string} [tag] An optional tag to attach to the score (use null for
     *     no tag).
     * @param {postScoreCallback} [callback] A function to run when the score has
     *     posted.
     * @param {object} [thisArg] An optional object to use as 'this' in your
     *     callback function.
     */
    static postScore(boardID: number, value: number, tag?: string | undefined, callback?: ((scoreBoard: NewgroundsIO.objects.ScoreBoard, score: NewgroundsIO.objects.Score) => any) | undefined, thisArg?: object | undefined): void;
    /**
     * @callback getScoresCallback
     * @param {NewgroundsIO.objects.ScoreBoard} scoreBoard
     * @param {NewgroundsIO.objects.Score} score
     * @param {object} options
     * @param {string} options.period
     * @param {string} options.tag
     * @param {boolean} options.social
     * @param {Number} options.skip
     * @param {Number} options.limit
     */
    /**
     * Gets the best scores for a board and returns the board, score list, period,
     * tag and social bool to an optional callback.
     * @param {number} boardID The id of the scoreboard you loading from.
     * @param {object} [options] Any optional lookup options you want to use.
     * @param {string} [options.period=NGIO.PERIOD_TODAY] The time period to get
     *     scores from. Will match one of the PERIOD_XXXX constants.
     * @param {boolean} [options.social=false] Set to true to only get scores from
     *     the user's friends.
     * @param {Number} [options.skip=0] The number of scores to skip.
     * @param {Number} [options.limit=10] The total number of scores to load.
     * @param {string} [options.tag] An optional tag to filter results by (use
     *     null for no tag).
     * @param {getScoresCallback} [callback] A function to run when the scores
     *     have been loaded.
     * @param {object} [thisArg] An optional object to use as 'this' in your
     *     callback function.
     */
    static getScores(boardID: number, options?: {
        period?: string | undefined;
        social?: boolean | undefined;
        skip?: number | undefined;
        limit?: number | undefined;
        tag?: string | undefined;
    } | undefined, callback?: ((scoreBoard: NewgroundsIO.objects.ScoreBoard, score: NewgroundsIO.objects.Score, options: {
        period: string;
        tag: string;
        social: boolean;
        skip: number;
        limit: number;
    }) => any) | undefined, thisArg?: object | undefined): void;
    /**
     * Gets a preloaded SaveSlot object. (Use getSaveSlotData to get actual save
     * file)
     * @param {number} saveSlotID The desired slot number
     */
    static getSaveSlot(saveSlotID: number): any;
    /**
     * Gets the number of non-empty save slots.
     */
    static getTotalSaveSlots(): number;
    /**
     * @callback getSaveSlotDataCallback
     * @param {string} data
     */
    /**
     * Loads the actual save file from a save slot, and passes the string result
     * to a callback function.
     * @param {number} slotID The slot number to load from
     * @param {getSaveSlotDataCallback} [callback] A function to run when the file
     *     has been loaded
     * @param {object} [thisArg] An optional object to use as 'this' in your
     *     callback function.
     */
    static getSaveSlotData(slotID: number, callback?: ((data: string) => any) | undefined, thisArg?: object | undefined): void;
    /**
     * @callback setSaveSlotDataCallback
     * @param {NewgroundsIO.objects.SaveSlot} saveSlot
     */
    /**
     * Loads the actual save file from a save slot and returns the save slot to an
     * optional callback function when complete.
     * @param {number} slotID The slot number to save to.
     * @param {string} data The (serialized) data you want to save.
     * @param {setSaveSlotDataCallback} [callback] An optional function to run
     *     when the file finished saving.
     * @param {object} [thisArg] An optional object to use as 'this' in your
     *     callback function.
     */
    static setSaveSlotData(slotID: number, data: string, callback?: ((saveSlot: NewgroundsIO.objects.SaveSlot) => any) | undefined, thisArg?: object | undefined): void;
    /**
     * @callback logEventCallback
     * @param {string} eventName
     */
    /**
     * Logs a custom event and returns the eventName to an optional callback
     * function when complete.
     * @param {string} eventName The name of the event to log.
     * @param {logEventCallback} [callback] A function to run when the event has
     *     logged.
     * @param {object} [thisArg] An optional object to use as 'this' in your
     *     callback function.
     */
    static logEvent(eventName: string, callback?: ((eventName: string) => any) | undefined, thisArg?: object | undefined): void;
    /**
     * @callback getDateTimeCallback
     * @param {string} dateime
     * @param {number} timestamp
     */
    /**
     * Loads the current DateTime from the server and returns it to an optional
     * callback function.
     * @param {getDateTimeCallback} [callback] A function to run when the datetime
     *     has loaded.
     * @param {object} [thisArg] An optional object to use as 'this' in your
     *     callback function.
     */
    static getDateTime(callback?: ((dateime: string, timestamp: number) => any) | undefined, thisArg?: object | undefined): void;
    /**
     * Keeps your ssessions from expiring. Is called automatically.
     * This will only hit the server once every 30 seconds, no matter how often
     * you call it.
     */
    static keepSessionAlive(): void;
    /**
     * @callback getConnectionStatusCallback
     * @param {string} connectionStatus
     */
    /**
     * Intended to be called from your game loop, this does an entire process of
     * things based on your Init() options:
     *  * Checks if the hosting site has a legal copy of this game
     *  * Checks for a newer version of the game
     *  * Makes sure you have a user session
     *  * Checks if the current user is logged in
     *  * Preloads Medals, Saveslots, etc
     *  * Logs a new view to your stats
     *
     * Whenever a new operation begins or ends, the current state will be passed
     * to your callback function.
     * @param {getConnectionStatusCallback} [callback] A function to be called
     *     when there's a change of status. Will match one of the STATUS_XXXX
     *     constants.
     * @param {object} [thisArg] An optional object to use as 'this' in your
     *     callback function.
     */
    static getConnectionStatus(callback?: ((connectionStatus: string) => any) | undefined, thisArg?: object | undefined): void;
    static "__#1@#updateSessionHandler"(callback: any, thisArg: any): void;
    static "__#1@#reportConnectionStatus"(callback: any, thisArg: any): void;
    static "__#1@#checkLocalVersion"(callback: any, thisArg: any): void;
    static "__#1@#PreloadItems"(): void;
    static "__#1@#resetConnectionStatus"(): void;
    static "__#1@#replaceSaveSlot"(slot: any): void;
    static "__#1@#replaceScoreBoard"(board: any): void;
    static "__#1@#replaceMedal"(medal: any): void;
    static "__#1@#onServerResponse"(e: any): void;
    static "__#1@#handleNewComponentResult"(result: any): void;
}
