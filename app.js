const express = require('express');
const app = express();
const router = express.Router();
const passwortJwt = require('passport-jwt');
const passport = require('passport');
const firebaseAdmin = require('firebase-admin');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

firebaseAdmin.initializeApp({
    apiKey: 'AIzaSyBKZn5TmFbPudGEN-1iKDiC6sHvZLxxW6k',
    authDomain: 'fil-gen-cli.firebaseapp.com',
    projectId: 'fil-gen-cli',
    storageBucket: 'fil-gen-cli.appspot.com',
    messagingSenderId: '484720598120',
    appId: '1:484720598120:web:4e96db7b1f4b07c9f7efdd',
    measurementId: 'G-RYXZ5393XZ',
    credential: firebaseAdmin.credential.cert({
        project_id: process.env.APP_SERVICE_ACCOUNT_PROJECT_ID,
        private_key: process.env.APP_SERVICE_ACCOUNT_PRIVATE_KEY,
        client_email: process.env.APP_SERVICE_ACCOUNT_CLIENT_EMAIL,
    }),
});

app.use(bodyParser.json());
app.use(passport.initialize());

router.post('/configs', (req, res) =>
    passport.authorize(
        new passwortJwt.Strategy(
            {
                secretOrKey: process.env.APP_SECRET || 'secret',
                jwtFromRequest: passwortJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
            },
            async (payload, done) => {
                const config = req.body;

                await firebaseAdmin
                    .firestore()
                    .collection('configs')
                    .doc(config.cliName)
                    .set(config);

                await firebaseAdmin
                    .storage()
                    .bucket()
                    .deleteFiles({ prefix: config.cliName + '/' });

                res.send({
                    msg: 'done',
                });
            }
        ),
        { session: false }
    )(req, res)
);

router.post('/configs/:id/files', upload.single('file'), (req, res) =>
    passport.authorize(
        new passwortJwt.Strategy(
            {
                secretOrKey: process.env.APP_SECRET || 'secret',
                jwtFromRequest: passwortJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
            },
            async (payload, done) => {
                const doc = await firebaseAdmin
                    .firestore()
                    .collection('configs')
                    .doc(req.params.id)
                    .get();

                const config = doc.data();

                await firebaseAdmin
                    .storage()
                    .bucket('fil-gen-cli.appspot.com')
                    .upload(req.file.path, {
                        destination: `${config.cliName}/${req.file.originalname}`,
                    });

                res.send({
                    msg: 'done',
                });
            }
        ),
        { session: false }
    )(req, res)
);

router.get('/configs/:id', async (req, res) => {
    const doc = await firebaseAdmin
        .firestore()
        .collection('configs')
        .doc(req.params.id)
        .get();
    res.send({
        config: doc.data(),
    });
});

router.get('/configs/:id/files/:fileName', async (req, res) => {
    const file = await firebaseAdmin
        .storage()
        .bucket('fil-gen-cli.appspot.com')
        .file(`${req.params.id}/${req.params.fileName}`);

    const content = await file.download();

    res.send({
        content: content.toString(),
    });
});

app.use('/', router);

app.listen(process.env.PORT || 3000, () => {
    console.log('app listening');
});
