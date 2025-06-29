import { inject } from '@angular/core';
import { provideApollo } from 'apollo-angular';
import { InMemoryCache, ApolloClientOptions } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';

export function provideApolloConfig() {
  return provideApollo(() => {
    const httpLink = inject(HttpLink);

    return {
      link: httpLink.create({
        uri: 'http://localhost:8000/graphql',
      }),
      cache: new InMemoryCache({
        addTypename: false,
      }),
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all',
        },
        query: {
          errorPolicy: 'all',
        },
      },
    } as ApolloClientOptions<unknown>;
  });
}
