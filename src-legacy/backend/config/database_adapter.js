// Temporary database adapter stub for compatibility
// This file exists temporarily to prevent import errors during migration

export default {
    query: async () => ({ data: [], error: null }),
    count: async () => 0,
    insert: async () => [],
    update: async () => [],
    delete: async () => true
};