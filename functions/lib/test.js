"use strict";
exports.__esModule = true;
var admin = require("firebase-admin");
var databaseURL = 'https://com-groceries-list.firebaseio.com';
var projectId = 'com-groceries-list';
var storageBucket = 'com-groceries-list.appspot.com';
var credential = admin.credential.cert({
    projectId: 'com-groceries-list',
    clientEmail: 'com-groceries-list@appspot.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDPepSZx0+1lvZx\n9z9h58qqtZooYj0JbUxcHgJ5BZ9HwzfMEbF1IN2/FcMHh5krZk2zFxmEDaOC/toe\n0QNgBMRMyMR2sdgAyl+rhLPeEzFDQ2U2COGOcsganKwJGtoFXPJNVTCwp/aedGWm\n4t6erlsKf96C8ofqfJ9IHVoGe+SYw9W0aUZwxosdOuRvzYQafNdJd8ubu7bz7FIZ\nLqc2Cpi2fH0XFoF0Tg6oJPzZuUiCHzk7hNP6VMqgM+9zPrh7Pc0H5KqFv9cRLQRa\nESadW+gQGEqIexayL95vpuz5FDldPMyAoCtxRpiX25vD5q5gHZ0n/jnM9yLM0X/g\nvHqBLmXFAgMBAAECggEAIjIYYt4MP6ghdzgifK744rjqrwQ9/htDDh2uF6c7ENdW\nj25NGrpvgcqC6e9J6fLDFKTWgkLDM9hwN8sILN+sQOGIK+305XB1Yy4MfSoZoPXv\nLQA6uMEnROeUnS2NSHwAvYkwbLVKOuSBSoey3GFtROY9VMTHbPjcQcUArPfnfdvh\nGQJWE1eZ5bT/SoVg9h9BDYAX7V0KnZ2igQkkPUbRLVh8cgTjcNKePx4Aw+443PTK\nLglBFrynAeeyyIoz5TLBTVieDQBbjikWx/DDHhxEyf/0oV1XpTfPLoqhgMNInzVP\nr+gMpMzQ5avTSYAIkukXrDYfn2ff9Nfs8ViKMI9nMQKBgQDnqlU+WKLq9uWRGyd3\n8f3IVNqRxjNFRXMxEpOhLEHHH1MJY1kjOv5RoOW98ToKP7wEqSCmeWbpTxhxA16k\nZYCuZEV2ZZ1WToO2WBJvJu6zmA+H+yPR6PLaarWNAMY4LUEWeZgMraNqvk/P8fV+\nH+0mPTjW37mXsiRqZU5dwlWpWQKBgQDlRdotSbFKA+AacwE8OPyYaXEfBKNnXj3H\nxBlH8Gx1lOUIqLkUSRIjrlpNczEw1zXsKMuyvFcmzhk21Rmf5V/e0smhOkE6rYdt\nJkFukzOafiesj/jnv6oZZo61gdroBI3Hdz9gYeLSZuz0/ekg6vt9/ASWZ0AMCobu\nat0r7FlmTQKBgCf4CEsAaeNWA5d8ctvL4Xgtw6QA6RmbeNtPlC7rftHHAsGM5XUh\nmX0l4F1cACKCioLXVy3BplK8dcARz8NXS9NKs31Q3MtmMm1EVrHcqrRLmOpiFvUB\nVtz+KiKQrqJElIU3J1eQobAp84Ux/qPrCDRfva283b1hW80Le3DLtZHJAoGBAIdg\nZIBDOBzVBvl3GK6fk37HG9VN3tJFUkNnZeoVa2VOQqKHRalVsBFDfOyobM5C9QL5\n37UtAmTWYwr+bz/7p00ht46soCFunz1yzkXlQx4hCXoaFMV6ZYzUAsXn5AMF1VWG\n8vQNOGo1/gp29rXKKi9spKTOWIIDoUKb9PZfezYtAoGBALT+CZwltJFTia+jM2rR\n0Xfcgl6f36Fqqtcg+9IO/2cu6gRFLVC+n8c0HyXHsNmSRAkjeKmQV5JmuTOgxEMO\nix+6Z9gxgcdmsTfNctHF9FrqFzOdDYIlkF/Peg15RwJXS8M9gUSW9odnLYMtscVT\n5qgIaC4u5HC25VTCQciJFL8v\n-----END PRIVATE KEY-----\n'
});
console.log(credential);
admin.initializeApp({
    credential: credential,
    databaseURL: databaseURL,
    storageBucket: storageBucket,
    projectId: projectId
});
admin
    .firestore()
    .collection('users')
    .get()
    .then(function (span) { return console.log(span); });
