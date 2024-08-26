import mongoose from 'mongoose';
import { MONGODB_URI } from '../config.js';

export const databaseConnection = async () => {
  try {
    if (MONGODB_URI) {
      await mongoose.connect(MONGODB_URI);
      console.log('Db Connected');
    } else {
      throw new Error('no url');
    }
  } catch (error) {
    console.log(error);
    throw new Error('database error');
  }
};
