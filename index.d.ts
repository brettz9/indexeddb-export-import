/**
 * Export all data from an IndexedDB database
 * @param {IDBDatabase} idbDatabase - to export from
 */
declare function exportToJsonString(idbDatabase: IDBDatabase): Promise<any>;
/**
 * Import data from JSON into an IndexedDB database. This does not delete any existing data
 *  from the database, so keys could clash.
 *
 * Only object stores that already exist will be imported.
 *
 * @param {IDBDatabase} idbDatabase - to import into
 * @param {string} jsonString - data to import, one key per object store
 * @return {Promise<void>}
 */
declare function importFromJsonString(idbDatabase: IDBDatabase, jsonString: string): Promise<void>;
/**
 * Clears a database of all data.
 *
 * The object stores will still exist but will be empty.
 *
 * @param {IDBDatabase} idbDatabase - to delete all data from
 * @return {Promise<void>}
 */
declare function clearDatabase(idbDatabase: IDBDatabase): Promise<void>;
export { exportToJsonString, importFromJsonString, clearDatabase, };
//# sourceMappingURL=index.d.ts.map