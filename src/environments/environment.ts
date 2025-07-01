export const environment = {
  production: process.env.NG_APP_PRODUCTION === 'true',
  apiUrl: process.env.NG_APP_API_URL ?? '/api',
  graphqlUrl: process.env.NG_APP_GRAPHQL_URL ?? 'http://localhost:8000/graphql'
};
