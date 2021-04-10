const express = require('express');
const app = express();
const router = express.Router();
const passwortJwt = require('passport-jwt');
const passport = require('passport');
const firebaseAdmin = require('firebase-admin');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

firebaseAdmin.initializeApp(
    firebaseAdmin.credential.cert({
        projectId: 'fil-gen-cli',
        privateKey:
            '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCnb/sGE9rwtMP3\nt8Tm8sGE5SQVMLXOS2Wt5emgD31VhB10BliUgOuCxq3JIeaG5AsQphwS8Vljvh/g\nAA5sw+c0YcGk9gw8m8R8Kh/gVv1uUx7/CbhaMuK6LvGppiwl4c5+RuXFAzVrsSq/\nQIdPWj154a5xwaUZrzF17bKdXzBpCK4x+A0Wyf4lyueIT/f34ikvdkmMxRQKiD1B\nx0jZSaIaA9IEh6L1F5Dy57dGv4em9yctZDMB9bz7wNJFXaOatgl00+tOemBVX9PS\nsZnKg/NAFZEjWDUv5Ptxsujw3vAkEjvOU46wU9RqRJ4kWpG6XGiBk+4mu4jYYtWU\nRoabvH4RAgMBAAECggEACD1zT9sByxdGTqZZVxlKy0jAlBdj1x1wSVTXgMRKYX9B\nONDIIrTOgk7XRh74Opq17bGTD56XjNhSNsKh8xnYAsSt1Dm0o/Xxfz/OdkqpqbiG\n/bujejLnZAzD4Vq3cPzSHfZMv/uWsTBUn3lkP1Q8Usd3v4rtXlx4FWrnf6Wr2vtZ\nQG6/RfVGf1t9cXEVtGvlqRu7djFTG23EKQhSm0PhYo2DRvbfGzbZ5Mu+TJNh5Ggl\naSejq7LK6PnA4JOo1+iOmCXjwjPaHqVhbRu/XsCgVH8AWSiXw1BmXfhaZHWJj9cB\nK5Eejji8m3xMHsTZ+yD7dUlKj/5JoXqZzUON26xazQKBgQDQSPjhhlUK9K+Maolt\ne5nSPIkj0aSID0ixhFc5yzJQ6cZed7m8XZytFZ+L499O2d7WbP3rOBEmcfFPfZIe\nIIBhYrH+Ttlx8vqh04+1zTGaxsyzJ0hg71Nl9VDgsz/ilCG8sLHJxHHnp0a9C2WT\nLPMSxnuCESVqmgbIsF1xwliuvQKBgQDNy3hHMJv3NaHUrrrDHjyLz7Z5I4pUALws\n4nJy5nHpCR3vBIIDjmo7nsOlxmVkxWSHVjahX+6UnLBE5vxm7tZZLUyn9LnPIZEa\nYkGfNlUElf3Z+7+/ThGy0yQIS5i9uNnvC/zrkbXs+28Y85MB7WWjGU/gcYNWHxFl\nnvdMq6db5QKBgQCS1s83V5f++FAGw1kNqXThRbI9YWAIWBYcqDtCUGGxr44dLXTx\nOmHpmHP5kHXvRiQWsZI10TouC2hfbRylRq6beZQYwIgGEJHnopoPRpExF/RaXVhm\nlnMKT29sapKgb2R1fXBp2aef9EsnnbBHmQno86tBIEtroxkjRUsrlyMkVQKBgQCT\neR+0RE1AFhrmQmBruptAxZTJsoJKOEyhDZVeaW1vxazBv8U7ry7Jkrg5b7bxQ9MK\neOmlMw3RSYe3mJ9/U+Ae/6tTILiWikNlWMwVv+Wk56eGMjXybYuZTl0f5KyMKI9k\nEn8ogL6SGIxAoSvT0b9n5ZesCyxG5vSckhI9yzSfUQKBgDsWVtyL1TY6VzZ2mwyS\n5EOaTkPv+xw6CF5Q4jw/rXoV5dVbNB4L1kOgaOz4LP2WA9IWnYG+wDhT8mJnAJ8c\npEPZ1GxDraLctWnmurv0wqwN8vj1GCGZHk1aM7v1cN0Kt3hVEFky2sBvPcCj3Hli\nlTH979TZs8yDi2re//A5Ub/k\n-----END PRIVATE KEY-----\n',
        clientEmail:
            'firebase-adminsdk-7uqwv@fil-gen-cli.iam.gserviceaccount.com',
    })
);

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

    res.send({
        content: content.toString(),
    });
});

app.use('/', router);

app.listen(process.env.PORT || 3000, () => {
    console.log('app listening');
});
