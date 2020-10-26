firebase.initializeApp({
    messagingSenderId: '746704174006',
});
// браузер поддерживает уведомления
// вообще, эту проверку должна делать библиотека Firebase, но она этого не делает
if ('Notification' in window) {
    var messaging = firebase.messaging();
    // пользователь уже разрешил получение уведомлений
    // подписываем на уведомления если ещё не подписали
    if (Notification.permission === 'granted') subscribe();
    // по клику, запрашиваем у пользователя разрешение на уведомления
    // и подписываем его
    document.querySelector('#subscribe').addEventListener('click', () => {
        subscribe();
    });
    document.querySelector('#push').addEventListener('click', () => {
        sendNotification({
            title: 'Hello, world',
            body: 'Push notification work',
            icon: 'https://www.darvin-studio.ru/assets/images/section-offices-inst.jpg',
            image: 'https://www.darvin-studio.ru/assets/images/section-offices-inst.jpg',
            click_action: 'https://darvin-studio.ru',
        });
    });
} else {
    if (!('Notification' in window)) console.error('Notification not supported');
    else if (!('serviceWorker' in navigator)) console.error('ServiceWorker not supported');
    else if (!('localStorage' in window)) console.error('LocalStorage not supported');
    else if (!('fetch' in window)) console.error('fetch not supported');
    else if (!('postMessage' in window)) console.error('postMessage not supported');
    console.warn('This browser does not support desktop notification.');
    console.log('Is HTTPS', window.location.protocol === 'https:');
    console.log('Support Notification', 'Notification' in window);
    console.log('Support ServiceWorker', 'serviceWorker' in navigator);
    console.log('Support LocalStorage', 'localStorage' in window);
    console.log('Support fetch', 'fetch' in window);
    console.log('Support postMessage', 'postMessage' in window);
}
function subscribe() {
    // запрашиваем разрешение на получение уведомлений
    messaging
        .requestPermission()
        .then(function () {
            // получаем ID устройства
            messaging
                .getToken()
                .then(function (currentToken) {
                    console.log(currentToken);
                    if (currentToken) {
                        sendTokenToServer(currentToken);
                    } else {
                        console.warn('Не удалось получить токен.');
                        setTokenSentToServer(false);
                    }
                })
                .catch(function (err) {
                    console.warn('При получении токена произошла ошибка.', err);
                    setTokenSentToServer(false);
                });
        })
        .catch(function (err) {
            console.warn('Не удалось получить разрешение на показ уведомлений.', err);
        });
}
// отправка ID на сервер
function sendTokenToServer(currentToken) {
    if (!isTokenSentToServer(currentToken)) {
        console.log('Отправка токена на сервер...');
        // var url = ''; // адрес скрипта на сервере который сохраняет ID устройства
        // $.post(url, {
        // token: currentToken
        // });
        setTokenSentToServer(currentToken);
    } else {
        console.log('Токен уже отправлен на сервер.');
    }
}
// используем localStorage для отметки того,
// что пользователь уже подписался на уведомления
function isTokenSentToServer(currentToken) {
    return window.localStorage.getItem('sentFirebaseMessagingToken') == currentToken;
}
function setTokenSentToServer(currentToken) {
    window.localStorage.setItem('sentFirebaseMessagingToken', currentToken ? currentToken : '');
}
function sendNotification(notification) {
    var key =
        'AAAArdsJe7Y:APA91bGaWgR14S1MNMftryEeWSGcqIwAh6mFeRxlHR_orXP9Sq0-I8Ry1JfxPkoY8iof3dybe8iYFPQPQArPfLSrnVvE4TnPqEVcU7BjIWosN3wJ8hQ6xOdzUu0IF7iRbhFEZ6hcCLA6';
    console.log('Send notification', notification);
    messaging
        .getToken()
        .then(function (currentToken) {
            fetch('https://fcm.googleapis.com/fcm/send', {
                method: 'POST',
                headers: {
                    Authorization: 'key=' + key,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // Firebase loses 'image' from the notification.
                    // And you must see this: https://github.com/firebase/quickstart-js/issues/71
                    data: notification,
                    to: currentToken,
                }),
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (json) {
                    console.log('Response', json);
                })
                .catch(function (error) {
                    console.error(error);
                });
        })
        .catch(function (error) {
            console.error('Error retrieving Instance ID token', error);
        });
}
// handle catch the notification on current page
messaging.onMessage(function (payload) {
    console.log('Message received', payload);
    // register fake ServiceWorker for show notification on mobile devices
    navigator.serviceWorker.register('/push-notifications/firebase-messaging-sw.js');
    Notification.requestPermission(function (permission) {
        if (permission === 'granted') {
            navigator.serviceWorker.ready
                .then(function (registration) {
                    // Copy data object to get parameters in the click handler
                    payload.data.data = JSON.parse(JSON.stringify(payload.data));
                    registration.showNotification(payload.data.title, payload.data);
                })
                .catch(function (error) {
                    // registration failed :(
                    console.error('ServiceWorker registration failed', error);
                });
        }
    });
});
