export const environment = {
  production: true,
  apiUrl: process.env.NG_APP_API_URL ?? '/api',
  graphqlUrl: process.env.NG_APP_GRAPHQL_URL ?? '/graphql'
};
