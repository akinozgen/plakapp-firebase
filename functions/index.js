const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.sendNotificationToFollowers = functions
    .database
    .ref('/comments/{commentId}')
    .onCreate(event => {

        if (event.eventType != 'providers/google.firebase.database/eventTypes/ref.create') return;

        const { commentId } = event.params;
        event = event.data.toJSON();
        const plateId = event.plate;
        const realOwner = event.realOwner;

        admin
            .database()
            .ref(`/plates/${plateId}`)
            .on('value', snaps => {
                snaps = snaps.toJSON();

                if (snaps.follows == null) return;


                Object.keys(snaps.follows).map(snap => {
                    uid = snaps.follows[snap];

                    if (uid === realOwner) return;

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