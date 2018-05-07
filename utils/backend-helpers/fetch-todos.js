const {promisify} = require('util');

const AWS = require('aws-sdk');
const prompt = require('prompt');

const index = require('../../src/backend/index');

const secretsmanager = new AWS.SecretsManager({
    region: 'us-east-1'
});

const secretsmanagerGetSecretValueAsync = promisify(secretsmanager.getSecretValue.bind(secretsmanager));
const promptGetAsync = promisify(prompt.get);
const doAuthenticateAsync = promisify(index.doAuthenticate);
const doFetchTodosAsync = promisify(index.doFetchTodos);

const run = async () => {
    const secretsmanagerResponse = await secretsmanagerGetSecretValueAsync({
        SecretId: 'XilutionSubscriberApiKey'
    });

    process.env.XilutionSubscriberApiKey = secretsmanagerResponse.SecretString;

    prompt.start();

    const credentials = await promptGetAsync({
        properties: {
            username: {
                required: true
            },
            // eslint-disable-next-line sort-keys
            password: {
                hidden: true,
                required: true
            }
        }
    });

    const authenticationResponse = await doAuthenticateAsync({
        body: JSON.stringify(credentials)
    }, {});

    const IdToken = JSON.parse(authenticationResponse.body).IdToken;

    return doFetchTodosAsync({
        headers: {
            Authorization: IdToken
        }
    }, {});
};

// eslint-disable-next-line no-console
run().then((response) => console.log(`Response: ${JSON.stringify(response, null, 2)}`)).catch((error) => console.error(error));
