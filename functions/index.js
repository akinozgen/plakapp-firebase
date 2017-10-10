const functions = require('firebase-functions');
const admin = require('firebase-admin');
const request = require('request');

admin.initializeApp(functions.config().firebase);

exports.sendNotificationToFollowers = functions
	.database
	.ref('/comments/{commentId}')
	.onCreate(event => {
		const { commentId } = event.params;
		event = event.data.toJSON();
		const plateId = event.plate;
		const realOwner = event.realOwner;

		admin.database().ref(`/plates/${plateId}/code`).once('value', plateSnap => {
			plateSnap = plateSnap.toJSON();

			if (plateSnap != null)
				admin.database().ref(`/users/${realOwner}/token`).once('value', tokenSnap => {
					tokenSnap = tokenSnap.toJSON();

					if (tokenSnap == null) return;

					admin
						.messaging()
						.unsubscribeFromTopic(tokenSnap, plateId)
						.then(onresolve => {
							if (onresolve.successCount > 0) {
								admin.messaging().sendToTopic(plateId, {
									notification: {
										title: 'Yeni Yorum',
										body: `${plateSnap} plakasına yeni yorum gönderildi. "${event.comment}"`,
									}
								}).then(onfullfilled => {
									admin.messaging().subscribeToTopic(tokenSnap, plateId);
								});
							}
						});
				});
		});
	});

exports.createUserOnNewAuth = functions
	.auth
	.user()
	.onCreate(event => {
		const { data } = event;

		let payload = {
			id: data.uid,
			username: `Yeni Kullanıcı ${Date.now()}`
		};

		admin
			.database()
			.ref(`/users/${data.uid}`).update(payload);
	});

exports.subscribeToTopic = functions
	.database
	.ref('/users/{userId}/follows/')
	.onWrite(event => {
		const plate = event.data.toJSON();
		const { userId } = event.params;

		console.log('PLATE', plate);

		if (plate == null) return;

		console.log('PLATE', plate);

		admin.database().ref(`/users/${userId}/token`).once('value', tokenSnap => {
			tokenSnap = tokenSnap.toJSON();

			if (tokenSnap != null)
				admin
					.messaging()
					.subscribeToTopic(tokenSnap, plate[Object.keys(plate)[0]])
					.then(onfullfilled => console.log('RESPONSE', onfullfilled))
					.catch(onrejected => console.log('ERROR', onrejected));
		});
	});

exports.unSubscribeToTopic = functions
	.database
	.ref('/users/{userId}/follows/')
	.onDelete(event => {
		const plate = event.data._data;
		const { userId } = event.params;

		console.log('PLATE', plate);

		if (plate == null) return;

		console.log('PLATE', plate);

		admin.database().ref(`/users/${userId}/token`).once('value', tokenSnap => {
			tokenSnap = tokenSnap.toJSON();

			if (tokenSnap != null)
				admin
					.messaging()
					.unsubscribeFromTopic(tokenSnap, plate[Object.keys(plate)[0]])
					.then(onfullfilled => console.log('RESPONSE', onfullfilled))
					.catch(onrejected => console.log('ERROR', onrejected));
		});
	});