const redis = require('redis')
const util = require('util')

const Firestore = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'ccproj-gcp',
  keyFilename: '../ccproj-gcp.json',
});

;(async () => {
    const docRef = db.collection('users').doc('alovelace');
    await docRef.set({
        first: 'Ada',
        last: 'Lovelace',
        born: 1815
      });
})()


