const pkgcloud = require('pkgcloud');
const logger = require('winston');

function createClient(){
	if(!process.env['STORAGE_KEY']){
		logger.error('STORAGE_KEY env variable unset');
	}
	return pkgcloud.storage.createClient({
		provider: 'amazon',
		keyId: process.env['STORAGE_KEY_ID'] || 'sc-devteam', // access key id
		key: process.env['STORAGE_KEY'], // secret key
		//region: 'us-west-2', // region
		forcePathBucket: true, // CRITICAL option here as we don't follow default https://bucket-name.s3-us-west-2.amazonaws.com url format for endpoint
		endpoint: process.env['STORAGE_ENDPOINT'] || 'https://dev-storage.schul-cloud.org:9001'
	});
}

module.exports = {
	client: createClient
};