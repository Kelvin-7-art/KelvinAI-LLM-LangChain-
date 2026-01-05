// This storage is replaced by specific module storages (e.g. chatStorage)
// Keeping this file to satisfy template imports if any, but it's minimal.

export interface IStorage {}

export class MemStorage implements IStorage {}

export const storage = new MemStorage();
