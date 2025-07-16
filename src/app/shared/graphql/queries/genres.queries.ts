import { gql } from 'apollo-angular';

export const GET_GENRES = gql`
  query GetGenres {
    genres {
      id
      name
      slug
      createdAt
      updatedAt
    }
  }
`;

export const GET_GENRE = gql`
  query GetGenre($id: String!) {
    genre(id: $id) {
      id
      name
      slug
      createdAt
      updatedAt
    }
  }
`;

export const GET_GENRE_BY_SLUG = gql`
  query GetGenreBySlug($slug: String!) {
    genreBySlug(slug: $slug) {
      id
      name
      slug
      createdAt
      updatedAt
    }
  }
`;
