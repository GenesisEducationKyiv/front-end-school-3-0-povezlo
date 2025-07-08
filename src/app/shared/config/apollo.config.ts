import { Provider } from '@angular/core';
import { provideApollo } from 'apollo-angular';
import { ApolloClientOptions, InMemoryCache, ApolloLink, split } from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { Kind } from 'graphql';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { environment } from '@environment/environment';

export function createApollo(): ApolloClientOptions<unknown> {
  // HTTP connection для queries и mutations
  const httpLink = createUploadLink({
    uri: environment.graphqlUrl
  }) as unknown as ApolloLink;

  // WebSocket connection для subscriptions
  const wsLink = new GraphQLWsLink(
    createClient({
      url: environment.graphqlUrl.replace('http', 'ws'), 
      connectionParams: {
      },
      shouldRetry: () => true,
      retryAttempts: Infinity,
      retryWait: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    })
  );

  // Используем split для маршрутизации запросов
  const link = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (

        definition.kind === Kind.OPERATION_DEFINITION &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        definition.operation === 'subscription'
      );
    },
    wsLink,
    httpLink
  );

  return {
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all'
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      },
      mutate: {
        errorPolicy: 'all'
      }
    }
  };
}

export const APOLLO_PROVIDERS: Provider[] = [
  provideApollo(createApollo)
];
