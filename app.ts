import express from 'express';
import multer from 'multer';
import firebaseAdmin from 'firebase-admin';
const app = express();
const router = express.Router();
import passwortJwt from 'passport-jwt';
import passport from 'passport';
import { FCGChangeCase } from './src/services/change-case';
import { FGCInstanceName } from './src/models';
const upload = multer({ dest: 'uploads/' });

firebaseAdmin.initializeApp({
    projectId: 'file-gen-cli',
    storageBucket: 'file-gen-cli.appspot.com',
    credential: firebaseAdmin.credential.cert({
        projectId: process.env.APP_SERVICE_ACCOUNT_PROJECT_ID,
        privateKey: process.env.APP_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
            /\\n/g,
            '\n'
        ),
        clientEmail: process.env.APP_SERVICE_ACCOUNT_CLIENT_EMAIL,
    }),
});

passport.use(
    'verifyToken',
    new passwortJwt.Strategy(
        {
            secretOrKey: process.env.APP_SECRET,
            jwtFromRequest:
                passwortJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
        },
        (payload, done) => {
            done(payload.client);
        }
    )
);

app.use(express.json());
app.use(passport.initialize());

router.post('/configs/list', async (req: express.Request, res) => {
    const tags: string[] = req.body.tags ?? [];
    let docs;
    if (tags.length) {
        docs = await firebaseAdmin
            .firestore()
            .collection('configs')
            .where('tags', 'array-contains-any', tags)
            .get();
    } else {
        docs = await firebaseAdmin.firestore().collection('configs').get();
    }

    const configs: Record<string, string>[] = [];

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
    passport.authorize('verifyToken', { session: false }, async (client) => {
        try {
            const config = req.body;

            const doc = await firebaseAdmin
                .firestore()
                .collection('configs')
                .doc(config.cliName)
                .get();

            if (doc.exists && doc.data()?.client !== client) {
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
    })(req, res)
);

router.post('/configs/:id/files', upload.single('file'), (req, res) =>
    passport.authorize('verifyToken', { session: false }, async (_client) => {
        try {
            const doc = await firebaseAdmin
                .firestore()
                .collection('configs')
                .doc(req.params.id)
                .get();

            const config = doc.data()!;

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
                ok: false,
                error: e,
            });
        }
    })(req, res)
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
            ok: false,
            error: e,
        });
    }
});

router.post('/templates/deduce', (req, res) => {
    try {
        const template = FCGChangeCase.Deduce(
            req.body.template,
            req.body.instanceName as FGCInstanceName
        );

        res.send({
            ok: true,
            template,
        });
    } catch (e) {
        res.status(500).send({
            ok: false,
            error: e,
        });
    }
});

router.post('/configs/:id/files/:fileName', async (req, res) => {
    try {
        const file = await firebaseAdmin
            .storage()
            .bucket('fil-gen-cli.appspot.com')
            .file(`${req.params.id}/${req.params.fileName}`);

        const templateRaw = await file.download();

        const template = FCGChangeCase.Replace(
            templateRaw.toString(),
            req.body.instanceName as FGCInstanceName
        );

        res.send({
            ok: true,
            template,
        });
    } catch (e) {
        res.status(500).send({
            ok: false,
            error: e,
        });
    }
});

app.use('/', router);

app.listen(process.env.PORT || 3000, () => {
    console.log('app listening');
});
