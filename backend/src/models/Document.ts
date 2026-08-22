import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

export interface IEmployeeDocument extends MongooseDocument {
  userId: Types.ObjectId;
  fileUrl: string;
  type: string;
}

const documentSchema = new Schema<IEmployeeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: { type: String, required: true },
    type: { type: String, required: true },
  },
  { timestamps: true }
);

export default model<IEmployeeDocument>("EmployeeDocument", documentSchema);
