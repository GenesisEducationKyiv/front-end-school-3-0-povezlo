import { gql } from 'apollo-angular';

export const GET_TRACKS = gql`
  query GetTracks($input: TracksInput) {
    tracks(input: $input) {
      data {
        id
        title
        artist
        album
        genres
        slug
        coverImage
        audioFile
        createdAt
        updatedAt
      }
      pageInfo {
        total
        page
        limit
        totalPages
      }
    }
  }
`;

export const GET_TRACK = gql`
  query GetTrack($id: String!) {
    track(id: $id) {
      id
      title
      artist
      album
      genres
      slug
      coverImage
      audioFile
      createdAt
      updatedAt
    }
  }
`;

export const GET_TRACK_BY_SLUG = gql`
  query GetTrackBySlug($slug: String!) {
    trackBySlug(slug: $slug) {
      id
      title
      artist
      album
      genres
      slug
      coverImage
      audioFile
      createdAt
      updatedAt
    }
  }
`;
