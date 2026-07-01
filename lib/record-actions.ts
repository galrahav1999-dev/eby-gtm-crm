"use server";

import { getObjectDef } from "./schema/registry";
import { createRecord, updateRecord, archiveRecord } from "./crud";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function def(objectKey: string) {
  const d = getObjectDef(objectKey);
  if (!d) throw new Error(`Unknown object: ${objectKey}`);
  return d;
}

export async function createRecordAction(objectKey: string, fd: FormData) {
  const d = def(objectKey);
  const { id } = await createRecord(d, fd);
  revalidatePath(`/${objectKey}`);
  redirect(`/${objectKey}/${id}`);
}

export async function updateRecordAction(objectKey: string, id: string, fd: FormData) {
  const d = def(objectKey);
  await updateRecord(d, id, fd);
  revalidatePath(`/${objectKey}`);
  revalidatePath(`/${objectKey}/${id}`);
  redirect(`/${objectKey}/${id}`);
}

/**
 * Create a record and return its ids without redirecting, for the quick-add
 * drawer (which stays open for "save and add another" or closes with a toast).
 */
export async function quickCreateAction(objectKey: string, fd: FormData) {
  const d = def(objectKey);
  const { id, display_id } = await createRecord(d, fd);
  revalidatePath(`/${objectKey}`);
  return { id, displayId: display_id, label: d.title(Object.fromEntries(fd.entries())) };
}

export async function archiveRecordAction(objectKey: string, id: string) {
  const d = def(objectKey);
  await archiveRecord(d, id);
  revalidatePath(`/${objectKey}`);
  redirect(`/${objectKey}`);
}
