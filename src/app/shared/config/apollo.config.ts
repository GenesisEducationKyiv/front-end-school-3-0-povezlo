import { Provider } from '@angular/core';
import { provideApollo } from 'apollo-angular';
import { ApolloClientOptions, InMemoryCache, ApolloLink } from '@apollo/client/core';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { environment } from '@environment/environment';

export function createApollo(): ApolloClientOptions<unknown> {
  const uploadLink = createUploadLink({ uri: environment.graphqlUrl }) as unknown as ApolloLink;

  return {
    link: uploadLink,
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
