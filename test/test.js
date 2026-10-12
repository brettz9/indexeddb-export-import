/* eslint-disable no-console -- Debugging */
import assert from 'node:assert';
import {readFile} from 'node:fs/promises';
import fakeIndexedDB from 'fake-indexeddb';
import {Dexie} from 'dexie';
import * as IDBExportImport from '../index.js';

/**
 * @typedef {Dexie & Record<string, import('dexie').Table>} DexieWithTables
 */

const mock = await readFile('./test/data/example.json', 'utf8');
const mock2 = await readFile('./test/data/example2.json', 'utf8');

describe('IDBExportImport', function () {
  describe('#exportToJsonString()', function () {
    it(
      'DB with no object stores should export an empty string',
      async function () {
        const db = /** @type {DexieWithTables} */ (
          new Dexie('NoObjectStoresDB', {indexedDB: fakeIndexedDB})
        );
        db.version(1).stores({}); // nothing
        try {
          await db.open();
        } catch (error) {
          console.error('Could not connect. ' + error);
          assert.ifError(error);
        }

        // get native IDBDatabase object from Dexie wrapper
        const idbDB = db.backendDB();

        let err;
        let jsonString;
        try {
          jsonString = await IDBExportImport.exportToJsonString(idbDB);
        } catch (error) {
          err = error;
        }
        assert.ifError(err);
        assert.equal(jsonString, '{}');
      }
    );

    it(
      'DB with empty object stores should export an empty string',
      async function () {
        const db = /** @type {DexieWithTables} */ (
          new Dexie('EmptyObjectStoresDB', {indexedDB: fakeIndexedDB})
        );
        // nothing
        db.version(1).stores({things: 'id++, thingName, thingDescription'});
        let err;
        try {
          await db.open();
        } catch (error) {
          console.error('Could not connect. ' + error);
          err = error;
        }
        assert.ifError(err);

        // get native IDBDatabase object from Dexie wrapper
        const idbDB = db.backendDB();
        let jsonString;
        try {
          jsonString = await IDBExportImport.exportToJsonString(idbDB);
        } catch (error) {
          err = error;
        }
        assert.ifError(err);
        assert.equal(jsonString, '{"things":[]}');
      }
    );
  });

  it('Should export, clear, and import the database', async function () {
    const db = /** @type {DexieWithTables} */ (
      new Dexie('MyDB', {indexedDB: fakeIndexedDB})
    );
    db.version(1).stores({
      things: 'id++, thingName, thingDescription'
    });

    let err;
    try {
      await db.open();
    } catch (error) {
      console.error('Could not connect. ' + error);
      err = error;
    }
    assert.ifError(err);

    const thingsToAdd = [{
      thingName: 'First thing', thingDescription: 'This is the first thing'
    }, {
      thingName: 'Second thing', thingDescription: 'This is the second thing'
    }];

    try {
      db.things.bulkAdd(thingsToAdd);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);

    // get native IDBDatabase object from Dexie wrapper
    const idbDB = db.backendDB();

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
    '{"thingName":"First thing",' +
      '"thingDescription":"This is the first thing","id":1},' +
      '{"thingName":"Second thing",' +
      '"thingDescription":"This is the second thing","id":2}]}');

    try {
      await IDBExportImport.clearDatabase(idbDB);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log('Cleared the database');

    try {
      await IDBExportImport.importFromJsonString(
        idbDB, /** @type {string} */ (jsonString)
      );
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
      '{"thingName":"First thing",' +
      '"thingDescription":"This is the first thing","id":1}' +
      ',{"thingName":"Second thing",' +
      '"thingDescription":"This is the second thing","id":2}]}');
  });
  it(
    'Should ignore keys for stores that do not exist when importing',
    async function () {
      const db = /** @type {DexieWithTables} */ (
        new Dexie('MyDB', {indexedDB: fakeIndexedDB})
      );
      db.version(1).stores({
        things: 'id++, thingName, thingDescription'
      });
      try {
        await db.open();
      } catch (e) {
        console.error('Could not connect. ' + e);
      }

      const thingsToAdd = [{
        thingName: 'First thing', thingDescription: 'This is the first thing'
      }, {
        thingName: 'Second thing', thingDescription: 'This is the second thing'
      }];

      let err;
      try {
        await db.things.bulkAdd(thingsToAdd);
      } catch (error) {
        err = error;
      }

      // get native IDBDatabase object from Dexie wrapper
      const idbDB = db.backendDB();
      try {
        await IDBExportImport.importFromJsonString(idbDB, '{"other":[' +
        '{"thingName":"First thing",' +
        '"thingDescription":"This is the first thing","id":1},' +
        '{"thingName":"Second thing",' +
        '"thingDescription":"This is the second thing","id":2}]}');
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
        await IDBExportImport.importFromJsonString(
          idbDB, '{"other": [], "things":[' +
          '{"thingName":"First thing",' +
          '"thingDescription":"This is the first thing","id":1},' +
          '{"thingName":"Second thing",' +
          '"thingDescription":"This is the second thing","id":2}]}'
        );
      } catch (error) {
        err = error;
      }
      assert.ifError(err);
      console.log('Imported data successfully');
    }
  );

  it(
    'Should ignore stores that are not present when importing',
    async function () {
      const db = /** @type {DexieWithTables} */ (
        new Dexie('MyDB', {indexedDB: fakeIndexedDB})
      );
      db.version(1).stores({
        things: 'id++, thingName, thingDescription'
      });
      let err;
      try {
        await db.open();
      } catch (error) {
        console.error('Could not connect. ' + error);
        err = error;
      }
      assert.ifError(err);

      const thingsToAdd = [{
        thingName: 'First thing', thingDescription: 'This is the first thing'
      }, {
        thingName: 'Second thing', thingDescription: 'This is the second thing'
      }];

      try {
        await db.things.bulkAdd(thingsToAdd);
      } catch (error) {
        err = error;
      }

      // get native IDBDatabase object from Dexie wrapper
      const idbDB = db.backendDB();
      try {
        await IDBExportImport.importFromJsonString(idbDB, '{"other":[' +
        '{"thingName":"First thing",' +
        '"thingDescription":"This is the first thing","id":1},' +
        '{"thingName":"Second thing",' +
        '"thingDescription":"This is the second thing","id":2}]}');
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
    }
  );

  it(
    'Should import and export the database with empty keys',
    async function () {
      const db = /** @type {DexieWithTables} */ (
        new Dexie('myDB', {indexedDB: fakeIndexedDB})
      );
      db.version(1).stores({
        colors: 'id++, name, info',
        shapes: 'id++, name',
        colorShape: '[shape+color]',
        empty: 'id++'
      });

      let err;
      try {
        await db.open();
      } catch (error) {
        console.error('Could not connect. ' + error);
        err = error;
      }
      assert.ifError(err);

      // eslint-disable-next-line promise/avoid-new -- Own API
      return new Promise((resolve) => {
        db.transaction('r',
          db.colors,
          db.shapes,
          db.colorShape,
          db.empty,
          async () => {
            // get native IDBDatabase object from Dexie wrapper
            const idbDB = db.backendDB();
            let error;
            try {
              await IDBExportImport.clearDatabase(idbDB);
            } catch (e) {
              error = e;
            }
            assert.ifError(error);
            console.log('Cleared the database');
            try {
              await IDBExportImport.importFromJsonString(idbDB, mock);
            } catch (e) {
              error = e;
            }
            assert.ifError(error);
            if (!error) {
              console.log('Imported data successfully');
            }
            resolve();
          });
      });
    }
  );

  it(
    'Should import and export the database with only empty keys',
    async function () {
      const db = /** @type {DexieWithTables} */ (
        new Dexie('myDB3', {indexedDB: fakeIndexedDB})
      );
      db.version(1).stores({
        empty: 'id++',
        unused: 'id++'
      });

      let err;
      try {
        await db.open();
      } catch (error) {
        console.error('Could not connect. ' + error);
        err = error;
      }
      assert.ifError(err);

      // eslint-disable-next-line promise/avoid-new -- Own API
      return new Promise((resolve) => {
        db.transaction('r',
          db.empty,
          async () => {
            // get native IDBDatabase object from Dexie wrapper
            const idbDB = db.backendDB();
            let error;
            try {
              await IDBExportImport.clearDatabase(idbDB);
            } catch (e) {
              error = e;
            }
            assert.ifError(error);
            console.log('Cleared the database');
            try {
              await IDBExportImport.importFromJsonString(idbDB, mock);
            } catch (e) {
              error = e;
            }
            assert.ifError(error);
            if (!error) {
              console.log('Imported data successfully');
            }
            resolve();
          });
      });
    }
  );

  it(
    'Should import and export the database with equal keys',
    async function () {
      const db = /** @type {DexieWithTables} */ (
        new Dexie('myDB2', {indexedDB: fakeIndexedDB})
      );
      db.version(1).stores({
        foo: 'id++',
        test: 'foo'
      });

      let err;
      try {
        await db.open();
      } catch (error) {
        console.error('Could not connect. ' + error);
        err = error;
      }
      assert.ifError(err);

      // eslint-disable-next-line promise/avoid-new -- Own API
      return new Promise((resolve) => {
        db.transaction('r',
          db.foo,
          db.test,
          async () => {
            // get native IDBDatabase object from Dexie wrapper
            const idbDB = db.backendDB();
            let error;
            try {
              await IDBExportImport.clearDatabase(idbDB);
            } catch (e) {
              error = e;
            }
            assert.ifError(error);
            console.log('Cleared the database');
            try {
              await IDBExportImport.importFromJsonString(idbDB, mock2);
            } catch (e) {
              error = e;
            }
            assert.ifError(error);
            console.log('Imported data successfully');
            let jsonString;
            try {
              jsonString = await IDBExportImport.exportToJsonString(idbDB);
            } catch (e) {
              error = e;
            }
            assert.ifError(error);
            console.log('Exported as JSON: ' + jsonString);
            assert.equal(jsonString, '{"foo":[{"a":1723302865116,"id":1,' +
                  '"$types":{"a":"date"}}],"test":[{"foo":"value"}]}');
            resolve();
          });
      });
    }
  );

  it(
    'Should import when a database store is absent from the JSON',
    async function () {
      const db = /** @type {DexieWithTables} */ (
        new Dexie('myDBMissingStore', {indexedDB: fakeIndexedDB})
      );
      db.version(1).stores({
        foo: 'id++',
        other: 'id++'
      });
      await db.open();
      const idbDB = db.backendDB();
      await IDBExportImport.importFromJsonString(
        idbDB, '{"foo": [{"a": 1}]}'
      );
      const exported = JSON.parse(
        await IDBExportImport.exportToJsonString(idbDB)
      );
      assert.equal(exported.foo.length, 1);
      assert.deepEqual(exported.other, []);
    }
  );

  it('Should not error if no object stores exist', async function () {
    // get native IDBDatabase object from Dexie wrapper
    const idbDB = /** @type {IDBDatabase} */ (
      /** @type {unknown} */ (fakeIndexedDB)
    );
    let err;
    try {
      await IDBExportImport.clearDatabase(idbDB);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log(
      'Cleared the database (nothing happened, no object stores exist)'
    );
    try {
      await IDBExportImport.importFromJsonString(idbDB, mock2);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log(
      'Imported data successfully (nothing imported as no object stores exist'
    );

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
  it('Should not error if objectStoreNames undefined', async function () {
    // get native IDBDatabase object from Dexie wrapper
    const idbDB = /** @type {IDBDatabase} */ (
      /** @type {unknown} */ (fakeIndexedDB)
    );
    Object.defineProperty(idbDB, 'objectStoreNames', {value: undefined});
    let err;
    try {
      await IDBExportImport.clearDatabase(idbDB);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log(
      'Cleared the database (nothing happened, no object stores exist)'
    );
    try {
      await IDBExportImport.importFromJsonString(idbDB, mock2);
    } catch (error) {
      err = error;
    }
    assert.ifError(err);
    console.log(
      'Imported data successfully (nothing imported as no object stores exist'
    );
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
