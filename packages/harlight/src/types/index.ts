export interface HAR {
    log: Log;
}

interface Log {
    version: string;
    creator: Creator;
    browser?: Browser;
    pages?: Page[];
    entries: Entry[];
    comment?: string;
}

interface Creator {
    name: string;
    version: string;
    comment?: string;
}

interface Browser {
    name: string;
    version: string;
    comment?: string;
}

export interface Page {
    startedDateTime: string;
    id: string;
    title: string;
    pageTimings: PageTimings;
    comment?: string;
}

interface PageTimings {
    onContentLoad?: number;
    onLoad?: number;
    comment?: string;
}

export interface Entry {
    pageref?: string;
    startedDateTime: string;
    time: number;
    request: Request;
    response: Response;
    cache?: Cache;
    timings: Timings;
    serverIPAddress?: string;
    connection?: string;
    comment?: string;
}

export interface Request {
    method: string;
    url: string;
    httpVersion: string;
    cookies: Cookie[];
    headers: Header[];
    queryString: QueryString[];
    postData?: PostData;
    headersSize: number;
    bodySize: number;
    comment?: string;
}

export interface Response {
    status: number;
    statusText: string;
    httpVersion: string;
    cookies: Cookie[];
    headers: Header[];
    content: Content;
    redirectURL: string;
    headersSize: number;
    bodySize: number;
    comment?: string;
}

export interface Cookie {
    name: string;
    value: string;
    path?: string;
    domain?: string;
    expires?: string;
    httpOnly?: boolean;
    secure?: boolean;
    comment?: string;
}

export interface Header {
    name: string;
    value: string;
    comment?: string;
}

interface QueryString {
    name: string;
    value: string;
    comment?: string;
}

export interface PostData {
    mimeType: string;
    params?: Param[];
    text?: string;
    comment?: string;
}

interface Param {
    name: string;
    value?: string;
    fileName?: string;
    contentType?: string;
    comment?: string;
}

interface Content {
    size: number;
    compression?: number;
    mimeType: string;
    text?: string;
    encoding?: string;
    comment?: string;
}

interface Cache {
    beforeRequest?: CacheState;
    afterRequest?: CacheState;
    comment?: string;
}

interface CacheState {
    expires?: string;
    lastAccess?: string;
    eTag?: string;
    hitCount: number;
    comment?: string;
}

interface Timings {
    blocked?: number;
    dns?: number;
    connect?: number;
    send: number;
    wait: number;
    receive: number;
    ssl?: number;
    comment?: string;
}
