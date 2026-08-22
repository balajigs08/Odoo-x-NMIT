import { Schema, model, Document, Types } from "mongoose";

export interface IProfile extends Document {
  userId: Types.ObjectId;
  phone?: string;
  address?: string;
  dob?: Date;
  jobTitle?: string;
  department?: string;
  profilePictureUrl?: string;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    phone: { type: String },
    address: { type: String },
    dob: { type: Date },
    jobTitle: { type: String },
    department: { type: String },
    profilePictureUrl: { type: String },
  },
  { timestamps: true }
);

export default model<IProfile>("Profile", profileSchema);
