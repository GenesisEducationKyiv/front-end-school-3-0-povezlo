declare namespace NodeJS {
  export interface ProcessEnv {
    readonly NG_APP_PRODUCTION?: string;
    readonly NG_APP_API_URL?: string;
    readonly NG_APP_GRAPHQL_URL?: string;
  }
}
