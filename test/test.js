/* eslint-disable max-len */
import {readFile} from 'fs/promises';
import fakeIndexedDB from 'fake-indexeddb';
import Dexie from 'dexie';
import * as IDBExportImport from '../index.js';
import assert from 'assert';

const mock = await readFile('./test/data/example.json', 'utf8');
const mock2 = await readFile('./test/data/example2.json', 'utf8');

/* eslint-env mocha */

describe('IDBExportImport', function() {
  describe('#exportToJsonString()', function() {
    it('DB with no object stores should export an empty string', async function() {
      const db = new Dexie('NoObjectStoresDB', {indexedDB: fakeIndexedDB});
      db.version(1).stores({}); // nothing
      try {
        await db.open();
      } catch (error) {
        console.error('Could not connect. ' + error);
        assert.ifError(error);
      }

      const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper

      let err;
      let jsonString;
      try {
        jsonString = await IDBExportImport.exportToJsonString(idbDB);
      } catch (error) {
        err = error;
      }
      assert.ifError(err);
      assert.equal(jsonString, '{}');
    });

    it('DB with empty object stores should export an empty string', async function() {
      const db = new Dexie('EmptyObjectStoresDB', {indexedDB: fakeIndexedDB});
      db.version(1).stores({things: 'id++, thing_name, thing_description'}); // nothing
      let err;
      try {
        await db.open();
      } catch (error) {
        console.error('Could not connect. ' + error);
        err = error;
      }
      assert.ifError(err);

      const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
      let jsonString;
      try {
        jsonString = await IDBExportImport.exportToJsonString(idbDB);
      } catch (error) {
        err = error;
      }
      assert.ifError(err);
      assert.equal(jsonString, '{"things":[],"$types":{"things":"arrayNonindexKeys"}}');
    });
  });

  it('Should export, clear, and import the database', async function() {
    const db = new Dexie('MyDB', {indexedDB: fakeIndexedDB});
    db.version(1).stores({
      things: 'id++, thing_name, thing_description',
    });

    let err;
    try {
      await db.open();
    } catch (error) {
      console.error('Could not connect. ' + error);
      err = error;
    }
    assert.ifError(err);

    const thingsToAdd = [{thing_name: 'First thing', thing_description: 'This is the first thing'},
      {thing_name: 'Second thing', thing_description: 'This is the second thing'}];
    try {
      db.things.bulkAdd(thingsToAdd);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper

    // export to JSON, clear database, and import from JSON
    let jsonString;
    try {
      jsonString = await IDBExportImport.exportToJsonString(idbDB);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Exported as JSON: ' + jsonString);
    assert.equal(jsonString, '{"things":[' +
    '{"thing_name":"First thing","thing_description":"This is the first thing","id":1},' +
      '{"thing_name":"Second thing","thing_description":"This is the second thing","id":2}]' +
      ',"$types":{"things":"arrayNonindexKeys"}}');

    try {
      await IDBExportImport.clearDatabase(idbDB);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Cleared the database');

    try {
      await IDBExportImport.importFromJsonString(idbDB, jsonString);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Imported data successfully');

    try {
      jsonString = await IDBExportImport.exportToJsonString(idbDB);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Exported as JSON: ' + jsonString);
    assert.equal(jsonString, '{"things":[' +
      '{"thing_name":"First thing","thing_description":"This is the first thing","id":1}' +
      ',{"thing_name":"Second thing","thing_description":"This is the second thing","id":2}]' +
      ',"$types":{"things":"arrayNonindexKeys"}}');
  });
  it('Should ignore keys for stores that do not exist when importing', async function() {
    const db = new Dexie('MyDB', {indexedDB: fakeIndexedDB});
    db.version(1).stores({
      things: 'id++, thing_name, thing_description',
    });
    try {
      await db.open();
    } catch (e) {
      console.error('Could not connect. ' + e);
    }

    const thingsToAdd = [{thing_name: 'First thing', thing_description: 'This is the first thing'},
      {thing_name: 'Second thing', thing_description: 'This is the second thing'}];

    let err;
    try {
      await db.things.bulkAdd(thingsToAdd);
    } catch (error) {
      err = error;
    }
    const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
    try {
      await IDBExportImport.importFromJsonString(idbDB, '{"other":[' +
      '{"thing_name":"First thing","thing_description":"This is the first thing","id":1},' +
      '{"thing_name":"Second thing","thing_description":"This is the second thing","id":2}]}');
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Imported data successfully');

    try {
      await IDBExportImport.clearDatabase(idbDB);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);

    try {
      await IDBExportImport.importFromJsonString(idbDB, '{"other": [], "things":[' +
      '{"thing_name":"First thing","thing_description":"This is the first thing","id":1},' +
      '{"thing_name":"Second thing","thing_description":"This is the second thing","id":2}]}');
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Imported data successfully');
  });
  it('Should ignore stores that are not present when importing', async function() {
    const db = new Dexie('MyDB', {indexedDB: fakeIndexedDB});
    db.version(1).stores({
      things: 'id++, thing_name, thing_description',
    });
    let err;
    try {
      await db.open();
    } catch (error) {
      console.error('Could not connect. ' + error);
      err = error;
    }
    assert.ifError(err);

    const thingsToAdd = [{thing_name: 'First thing', thing_description: 'This is the first thing'},
      {thing_name: 'Second thing', thing_description: 'This is the second thing'}];
    try {
      await db.things.bulkAdd(thingsToAdd);
    } catch (error) {
      err = error;
    }
    const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
    try {
      await IDBExportImport.importFromJsonString(idbDB, '{"other":[' +
      '{"thing_name":"First thing","thing_description":"This is the first thing","id":1},' +
      '{"thing_name":"Second thing","thing_description":"This is the second thing","id":2}]}');
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Imported data successfully');

    try {
      await IDBExportImport.clearDatabase(idbDB);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);

    try {
      await IDBExportImport.importFromJsonString(idbDB, '{"other": []}');
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Imported data successfully');
  });
  it('Should import and export the database with empty keys', async function() {
    const db = new Dexie('myDB', {indexedDB: fakeIndexedDB});
    db.version(1).stores({
      colors: 'id++, name, info',
      shapes: 'id++, name',
      color_shape: '[shape+color]',
      empty: 'id++',
    });

    let err;
    try {
      await db.open();
    } catch (error) {
      console.error('Could not connect. ' + error);
      err = error;
    }
    assert.ifError(err);

    return new Promise((resolve, reject) => {
      db.transaction('r',
          db.colors,
          db.shapes,
          db.color_shape,
          db.empty,
          async () => {
            const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
            let err;
            try {
              await IDBExportImport.clearDatabase(idbDB);
            } catch (error) {
              err = error;
            }
            assert.ifError(err);
            console.log('Cleared the database');
            try {
              await IDBExportImport.importFromJsonString(idbDB, mock);
            } catch (error) {
              err = error;
            }
            assert.ifError(err);
            if (!err) {
              console.log('Imported data successfully');
            }
            resolve();
          });
    });
  });

  it('Should import and export the database with only empty keys', async function() {
    const db = new Dexie('myDB3', {indexedDB: fakeIndexedDB});
    db.version(1).stores({
      empty: 'id++',
      unused: 'id++',
    });

    let err;
    try {
      await db.open();
    } catch (error) {
      console.error('Could not connect. ' + error);
      err = error;
    }
    assert.ifError(err);

    return new Promise((resolve, reject) => {
      db.transaction('r',
          db.empty,
          async () => {
            const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
            let err;
            try {
              await IDBExportImport.clearDatabase(idbDB);
            } catch (error) {
              err = error;
            }
            assert.ifError(err);
            console.log('Cleared the database');
            try {
              await IDBExportImport.importFromJsonString(idbDB, mock);
            } catch (error) {
              err = error;
            }
            assert.ifError(err);
            if (!err) {
              console.log('Imported data successfully');
            }
            resolve();
          });
    });
  });

  it('Should import and export the database with equal keys', async function() {
    const db = new Dexie('myDB2', {indexedDB: fakeIndexedDB});
    db.version(1).stores({
      foo: 'bar',
      test: 'foo',
    });

    let err;
    try {
      await db.open();
    } catch (error) {
      console.error('Could not connect. ' + error);
      err = error;
    }
    assert.ifError(err);

    return new Promise((resolve, reject) => {
      db.transaction('r',
          db.foo,
          db.test,
          async () => {
            const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
            let err;
            try {
              await IDBExportImport.clearDatabase(idbDB);
            } catch (error) {
              err = error;
            }
            assert.ifError(err);
            console.log('Cleared the database');
            try {
              await IDBExportImport.importFromJsonString(idbDB, mock2);
            } catch (error) {
              err = error;
            }
            assert.ifError(err);
            console.log('Imported data successfully');
            let jsonString;
            try {
              jsonString = await IDBExportImport.exportToJsonString(idbDB);
            } catch (error) {
              err = error;
            }
            assert.ifError(err);
            console.log('Exported as JSON: ' + jsonString);
            assert.equal(jsonString, '{"foo":[{"bar":1}],"test":[{"foo":"value"}]' +
                ',"$types":{"foo":"arrayNonindexKeys","test":"arrayNonindexKeys"}}',
            );
            resolve();
          });
    });
  });
  it('Should not error if no object stores exist', async function() {
    const idbDB = fakeIndexedDB; // get native IDBDatabase object from Dexie wrapper
    let err;
    try {
      await IDBExportImport.clearDatabase(idbDB);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Cleared the database (nothing happened, no object stores exist)');
    try {
      await IDBExportImport.importFromJsonString(idbDB, mock2);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Imported data successfully (nothing imported as no object stores exist');

    let jsonString;
    try {
      jsonString = await IDBExportImport.exportToJsonString(idbDB);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Exported as JSON: ' + jsonString);
    assert.equal(jsonString, '{}');
  });
  it('Should not error if objectStoreNames undefined', async function() {
    const idbDB = fakeIndexedDB; // get native IDBDatabase object from Dexie wrapper
    idbDB.objectStoreNames = undefined;
    let err;
    try {
      await IDBExportImport.clearDatabase(idbDB);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Cleared the database (nothing happened, no object stores exist)');
    try {
      await IDBExportImport.importFromJsonString(idbDB, mock2);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Imported data successfully (nothing imported as no object stores exist');
    let jsonString;
    try {
      jsonString = await IDBExportImport.exportToJsonString(idbDB);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Exported as JSON: ' + jsonString);
    assert.equal(jsonString, '{}');
  });
});
