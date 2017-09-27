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


exports.sendNotificationToFollowers = functions
    .database
    .ref('/comments/{commentId}')
    .onCreate(event => {

        const { commentId } = event.params;
        event = event.data.toJSON();
        const plateId = event.plate;

        admin
            .database()
            .ref(`/plates/${plateId}`)
            .on('value', snaps => {
                snaps = snaps.toJSON();

                if (snaps.follows == null) return;

                console.log('PLATE DATA', snaps);

                Object.keys(snaps.follows).map(snap => {
                    uid = snaps.follows[snap];

                    console.log('USER ID', uid);
                    console.log('SNAP', snap);

                    admin
                        .database()
                        .ref(`/users/${uid}/token`)
                        .on('value', userSnap => {
                            userSnap = userSnap.toJSON();

                            return admin.messaging().sendToDevice(userSnap, {
                                notification: {
                                    title: 'Yeni Yorum',
                                    body: `${snaps.code} plakasına yeni yorum gönderildi. "${event.comment}"`,
                                }
                            })
                        });
                });
            });


    });