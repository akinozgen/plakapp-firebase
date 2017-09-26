const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.updateRatingAverageOnWrite = functions
    .database
    .ref('/comments/{commentId}/ratings')
    .onUpdate(event => {

        let { commentId, raterId } = event.params;

        const ref = admin.database().ref(`/comments/${commentId}/ratings`);
        ref.on('value', snap => {
            snap = snap.toJSON();

            if (snap == null) {
                admin.database().ref(`/comments/${commentId}/star`).set(0);
            }

            let sum = 0;

            Object.keys(snap).map(s => sum += parseInt(snap[s]));

            let avg = Math.round(sum / Object.keys(snap).length);

            console.log('AVERAGE', avg);

            admin.database().ref(`/comments/${commentId}/star`).set(avg);
        });

    });