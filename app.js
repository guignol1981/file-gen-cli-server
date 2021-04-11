const express = require('express');
const multer = require('multer');
const firebaseAdmin = require('firebase-admin');
const app = express();
const router = express.Router();
const passwortJwt = require('passport-jwt');
const passport = require('passport');
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
        private_key: process.env.APP_SERVICE_ACCOUNT_PRIVATE_KEY.replace(
            /\\n/g,
            '\n'
        ),
        client_email: process.env.APP_SERVICE_ACCOUNT_CLIENT_EMAIL,
    }),
});

passport.use(
    'verifyToken',
    new passwortJwt.Strategy(
        {
            secretOrKey: process.env.APP_SECRET,
            jwtFromRequest: passwortJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
        },
        (payload, done) => {
            done(payload.client);
        }
    )
);

app.use(express.json());
app.use(passport.initialize());

router.get('/configs', async (req, res) => {
    const docs = await firebaseAdmin.firestore().collection('configs').get();
    const configs = [];

    docs.forEach((d) => {
        configs.push({
            name: d.data().cliName,
            author: d.data().client,
            description: d.data().description,
        });
    });
    res.send({
        ok: true,
        configs,
    });
});

router.post('/configs', (req, res) =>
    passport.authorize(
        'verifyToken',
        async (client) => {
            try {
                const config = req.body;

                const doc = await firebaseAdmin
                    .firestore()
                    .collection('configs')
                    .doc(config.cliName)
                    .get();

                if (doc.exists && doc.data().client !== client) {
                    res.status(400).send({
                        ok: false,
                        msg: `this cli name is already used by another client, please choose another one`,
                    });
                    return;
                } else {
                    await doc.ref.set({ ...config, ...{ client } });
                }

                await firebaseAdmin
                    .storage()
                    .bucket()
                    .deleteFiles({ prefix: config.cliName + '/' });

                res.send({
                    ok: 'true',
                    msg: 'Config saved',
                });
            } catch (e) {
                res.status(500).send({
                    error: e,
                });
            }
        },
        { session: false }
    )(req, res)
);

router.post('/configs/:id/files', upload.single('file'), (req, res) =>
    passport.authorize(
        'verifyToken',
        async (client) => {
            try {
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
                    ok: true,
                    msg: `Template ${req.file.originalname} saved!`,
                });
            } catch (e) {
                res.status(500).send({
                    error: e,
                });
            }
        },
        { session: false }
    )(req, res)
);

router.get('/configs/:id', async (req, res) => {
    try {
        const doc = await firebaseAdmin
            .firestore()
            .collection('configs')
            .doc(req.params.id)
            .get();

        res.send({
            config: doc.data(),
        });
    } catch (e) {
        res.status(500).send({
            error: e,
        });
    }
});

router.get('/configs/:id/files/:fileName', async (req, res) => {
    try {
        const file = await firebaseAdmin
            .storage()
            .bucket('fil-gen-cli.appspot.com')
            .file(`${req.params.id}/${req.params.fileName}`);

        const template = await file.download();

        res.send({
            template: template.toString(),
        });
    } catch (e) {
        res.status(500).send({
            error: e,
        });
    }
});

app.use('/', router);

app.listen(process.env.PORT || 3000, () => {
    console.log('app listening');
});
