const { AppConfigurationClient } = require("@azure/app-configuration");
const { SecretClient } = require("@azure/keyvault-secrets");
const { DefaultAzureCredential } = require("@azure/identity");
const fs = require("fs")


let configurationValues = {};
async function getValueFromVault(label) {
    let values = [];
    const connectionString = "Endpoint=https://appconfig-eximpedia-ci-prod.azconfig.io;Id=FMXw;Secret=NTPj/KrCjkJ6dnPenkGSNxgojYyhV3vdMZIaahvhqSs=";
    const client = new AppConfigurationClient(connectionString);
    const settingsIterator = client.listConfigurationSettings({ label: label });
    for await (const setting of settingsIterator) {
        if (setting.contentType === 'application/vnd.microsoft.appconfig.keyvaultref+json;charset=utf-8') {
            const secretUri = JSON.parse(setting.value).uri;
            const secretValue = await getSecretValue(secretUri);
            values.push({ "key": setting.key, "value": secretValue });
        } else {
            values.push({ "key": setting.key, "value": setting.value });
        }
    }
    return values;
}

async function getSecretValue(secretUri) {
    const url = new URL(secretUri);
    const vaultName = url.hostname.split('.')[0];
    const keyVaultUrl = `https://kv-eximpedia-ci-prod.vault.azure.net/`;
    const credential = new DefaultAzureCredential({ managedIdentityClientId: 'b9b17ea2-61bb-4707-adc4-72e9d107fac9' });
    const client = new SecretClient(keyVaultUrl, credential);
    const secretName = url.pathname.split('/')[2];
    const secret = await client.getSecret(secretName);
    return secret.value;

}

async function initializeConfiguration(label) {
    try {
        const values = await getValueFromVault(label);
        values.forEach(setting => {
            configurationValues[setting.key] = setting.value;
        });
        // console.log("Configuration Adx:", configurationValues);
        // configurationValues.push(configurationValues)
        console.log(configurationValues[0])
        console.log(typeof(configurationValues))
        console.log(configurationValues)
        console.log(Object.keys(configurationValues))
        // fs.writeFileSync("./adxvalues.json",JSON.stringify(configurationValues))
        process.env.adx = JSON.stringify(configurationValues)
        return  configurationValues;
    } catch (err) {
        console.error("Error initializing configuration:", err.message);
    }
}

// initializeConfiguration('prod').then({

// }).catch((err) => {

//     console.error("Error running sample:", err.message);

// });



module.exports = {

    initializeConfiguration

}