const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

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