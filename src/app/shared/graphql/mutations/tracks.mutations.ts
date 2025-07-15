import { gql } from 'apollo-angular';

export const CREATE_TRACK = gql`
  mutation CreateTrack($input: TrackCreateInput!) {
    createTrack(input: $input) {
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

export const UPDATE_TRACK = gql`
  mutation UpdateTrack($id: String!, $input: TrackUpdateInput!) {
    updateTrack(id: $id, input: $input) {
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

export const DELETE_TRACK = gql`
  mutation DeleteTrack($id: String!) {
    deleteTrack(id: $id)
  }
`;

export const DELETE_TRACKS = gql`
  mutation DeleteTracks($ids: [String!]!) {
    deleteTracks(ids: $ids) {
      success
      successIds
      failedIds
      errors {
        message
        code
        field
      }
    }
  }
`;

export const UPLOAD_TRACK_FILE = gql`
  mutation UploadTrackFile($id: String!, $file: Upload!) {
    uploadTrackFile(id: $id, file: $file) {
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

export const DELETE_TRACK_FILE = gql`
  mutation DeleteTrackFile($id: String!) {
    deleteTrackFile(id: $id) {
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
