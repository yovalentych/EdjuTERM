import { ObjectId } from "mongodb";

export function toObjectId(id: string | undefined | null) {
  if (!id || !ObjectId.isValid(id)) {
    return null;
  }

  return new ObjectId(id);
}
