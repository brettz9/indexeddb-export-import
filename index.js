import {
  Typeson, structuredCloningThrowing
} from 'typeson-registry';

const typeson = new Typeson().register(structuredCloningThrowing);

/**
 * Export all data from an IndexedDB database.
 * @param {IDBDatabase} idbDatabase - to export from
 * @returns {Promise<string>}
 */
async function exportToJsonString (idbDatabase) {
  /** @type {Record<string, unknown[]>} */
  const exportObject = {};
  const objectStoreNamesSet = new Set(idbDatabase.objectStoreNames);
  const {size} = objectStoreNamesSet;
  if (size === 0) {
    return await JSON.stringify(exportObject);
  }
  const objectStoreNames = [...objectStoreNamesSet];

  // eslint-disable-next-line promise/avoid-new -- Own API
  return new Promise((resolve, reject) => {
    const transaction = idbDatabase.transaction(
      objectStoreNames,
      'readonly'
    );

    transaction.addEventListener(
      'error',
      /* c8 ignore next 3 -- Simulating? */
      (event) => {
        reject(event);
      }
    );

    objectStoreNames.forEach((storeName) => {
      /** @type {unknown[]} */
      const allObjects = [];
      transaction.objectStore(storeName).openCursor().onsuccess = (event) => {
        const cursor = /** @type {IDBCursorWithValue|null} */ (
          event.target && 'result' in event.target && event.target.result
        );
        if (cursor) {
          allObjects.push(typeson.encapsulate(cursor.value));
          cursor.continue();
        } else {
          exportObject[storeName] = allObjects;
          if (
            objectStoreNames.length ===
            Object.keys(exportObject).length
          ) {
            resolve(JSON.stringify(exportObject));
          }
        }
      };
    });
  });
}

/**
 * Import data from JSON into an IndexedDB database. This does not delete
 *   any existing data from the database, so keys could clash.
 *
 * Only object stores that already exist will be imported.
 *
 * @param {IDBDatabase} idbDatabase - to import into
 * @param {string} jsonString - data to import, one key per object store
 * @returns {Promise<void>}
 */
async function importFromJsonString (idbDatabase, jsonString) {
  const objectStoreNamesSet = new Set(idbDatabase.objectStoreNames);
  const {size} = objectStoreNamesSet;
  if (size === 0) {
    return await undefined;
  }
  const objectStoreNames = [...objectStoreNamesSet];

  // eslint-disable-next-line promise/avoid-new -- Own API
  return new Promise((resolve, reject) => {
    const transaction = idbDatabase.transaction(
      objectStoreNames,
      'readwrite'
    );

    transaction.addEventListener(
      'error',
      /* c8 ignore next 3 -- Simulating? */
      (event) => {
        reject(event);
      }
    );

    const importObject = JSON.parse(jsonString);

    // Delete keys present in JSON that are not present in database
    Object.keys(importObject).forEach((storeName) => {
      if (!objectStoreNames.includes(storeName)) {
        delete importObject[storeName];
      }
    });

    if (Object.keys(importObject).length === 0) {
      // no object stores exist to import for
      resolve();
      return;
    }

    // eslint-disable-next-line @stylistic/max-len -- Long
    // eslint-disable-next-line unicorn/no-unused-builtin-method-return -- Convenient
    objectStoreNames.some((storeName) => {
      let count = 0;

      const aux = [...importObject[storeName] || []];

      if (Object.hasOwn(importObject, storeName) && aux.length > 0) {
        aux.forEach((toAdd) => {
          const typesonAdd = typeson.revive(toAdd);
          const request = transaction.objectStore(storeName).add(typesonAdd);
          request.onsuccess = () => {
            count++;
            if (count !== importObject[storeName].length) {
              return;
            }

            // added all objects for this store
            delete importObject[storeName];
            if (Object.keys(importObject).length === 0) {
              // added all object stores
              resolve();
            }
          };

          request.addEventListener(
            'error',
            /* c8 ignore next 4 -- Simulating */
            (event) => {
              // eslint-disable-next-line no-console -- Debugging
              console.log(event);
            }
          );
        });
      } else if (Object.hasOwn(importObject, storeName)) {
        delete importObject[storeName];
        if (Object.keys(importObject).length === 0) {
          // added all object stores
          resolve();
          return true;
        }
      }

      return false;
    });
  });
}

/**
 * Clears a database of all data.
 *
 * The object stores will still exist but will be empty.
 *
 * @param {IDBDatabase} idbDatabase - to delete all data from
 * @returns {Promise<void>}
 */
async function clearDatabase (idbDatabase) {
  const objectStoreNamesSet = new Set(idbDatabase.objectStoreNames);
  const {size} = objectStoreNamesSet;
  if (size === 0) {
    return await undefined;
  }
  const objectStoreNames = [...objectStoreNamesSet];

  // eslint-disable-next-line promise/avoid-new -- Own API
  return new Promise((resolve, reject) => {
    const transaction = idbDatabase.transaction(
      objectStoreNames,
      'readwrite'
    );
    transaction.addEventListener(
      'error',
      /* c8 ignore next 3 -- Simulating? */
      (event) => {
        reject(event);
      }
    );

    let count = 0;
    objectStoreNames.forEach(function (storeName) {
      transaction.objectStore(storeName).clear().onsuccess = () => {
        count++;
        if (count === size) {
          // cleared all object stores
          resolve();
        }
      };
    });
  });
}

export {
  exportToJsonString,
  importFromJsonString,
  clearDatabase
};
