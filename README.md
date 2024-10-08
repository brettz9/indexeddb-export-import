# idb-export-import - JSON export/import for IndexedDB

`idb-export-import` is a fork of `indexeddb-export-import`. It adds support for:

- Typeson-encoded JSON (allows saving more JavaScript types than regular JSON)
- Native ESM imports
- Promise-based API

## Introduction

[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) is a client-side database API available in modern browsers and [https://electron.atom.io/](Electron). During development and testing of an web / desktop app which uses IndexedDB, it can be helpful to save, load, or clear the contents of an IndexedDB database - this package provides that capability.

You can use **idb-export-import** in a Node.js environment imported as a module (eg. for use with an Electron app). You may also use it in a browser environment by simply including via a `<script>` tag.

[![Build Status](https://travis-ci.org/brettz9/indexeddb-export-import.svg?branch=master)](https://travis-ci.org/brettz9/indexeddb-export-import)
[![NPM](https://nodei.co/npm/idb-export-import.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/idb-export-import/)

## Installation

```shell
$ npm install idb-export-import
```

## Usage

You will need an open [IDBDatabase](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase) connection.

The following example exports a database, clears all object stores, then re-imports the database. It uses [Dexie.js](https://github.com/dfahlander/Dexie.js) to initiate the database, but this is not required.

```js
    import Dexie from 'dexie';
    import * as IDBExportImport from 'idb-export-import';

    const db = new Dexie('MyDB');
    db.version(1).stores({
      things: 'id++, thing_name, thing_description',
    });

    try {
      await db.open();
    } catch (err) {
      console.error('Could not connect. ' + e);
      return;
    }

    const idbDatabase = db.backendDB(); // get native IDBDatabase object from Dexie wrapper

    // export to JSON, clear database, and import from JSON
    let err;
    try {
      jsonString = await IDBExportImport.exportToJsonString(idbDatabase);
    } catch (error) {
      err = error;
    }
    if (err) {
      console.error(err);
    } else {
      console.log('Exported as JSON: ' + jsonString);
      let err;
      try {
        await IDBExportImport.clearDatabase(idbDatabase);
      } catch (error) {
        err = error;
      }
      if (!err) { // cleared data successfully
        try {
          await IDBExportImport.importFromJsonString(idbDatabase, jsonString);
          console.log('Imported data successfully');
        } catch (err) {
        }
      }
    }
```

## API

### exportToJsonString(idbDatabase)
Export all data from an IndexedDB database

| Param | Type | Description |
| --- | --- | --- |
| idbDatabase | <code>IDBDatabase</code> |  |

<a name="importFromJsonString"></a>

### importFromJsonString(idbDatabase, jsonString)
Import data from JSON into an IndexedDB database. This does not delete any existing data from the database, so keys could clash

| Param | Type | Description |
| --- | --- | --- |
| idbDatabase | <code>IDBDatabase</code> |  |
| jsonString | <code>string</code> | data to import, one key per object store |

<a name="clearDatabase"></a>

### clearDatabase(idbDatabase)
Clears a database of all data

| Param | Type | Description |
| --- | --- | --- |
| idbDatabase | <code>IDBDatabase</code> |  |


## License

MIT
