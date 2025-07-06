import { Injectable, inject } from '@angular/core';
import { GetGenresGQL, GetGenresQuery } from '@shared/graphql/generated';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GenreGraphQLService {
  private readonly getGenresGQL = inject(GetGenresGQL);

  /** Get all genres */
  getAll(): Observable<GetGenresQuery['genres']> {
    return this.getGenresGQL
      .watch(undefined, { fetchPolicy: 'network-only' })
      .valueChanges.pipe(map(result => result.data.genres));
  }
}
