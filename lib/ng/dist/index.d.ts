import { NewgroundsWrapper } from "./ng/ng";
import { Config } from "./ng/ng";
export { NewgroundsWrapper as Newgrounds };
export type { Config };
export declare function validateSession(session: string, config: Config): Promise<string | undefined>;
export declare function saveData(data: any, session: string, config: Config): Promise<any | undefined>;
export { TESTCONFIG } from "./ng/ng";
