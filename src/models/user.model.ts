import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  spotifyId: {
    type: String,
    unique: true,
    sparse: true
  },
  accessToken: String,
  refreshToken: String
});

export const User = model('User', UserSchema);
