import fetch from 'node-fetch';

export async function processInfos(infoPromises: Promise<Infos[]>, verboseLogging: boolean): Promise<void> {
	const infos = await infoPromises;
	const fcInfo = infos.find(isFeatureCalculationInfo);
	const vcInfo = infos.find(isValueCalcuationInfo);

	if (fcInfo === undefined || vcInfo === undefined) {
		throw new Error("Either fcInfo or vcInfo have not been found!");
	}

	const fcFeatureNames = featureNamesFrom(fcInfo);

	if (verboseLogging) {
		logFeatureNames(fcFeatureNames)
	}

	const results = check(vcInfo.models, fcFeatureNames);

	if (!containsFailures(results)) {
		console.log('OK')
	}
	else {
		console.error('FAILED')
		logFailures(results)
	}
}

export function featureNamesFrom(info: FeatureCalculationInfo): string[] {
	return Object.values(info.features).reduce((prev, curr) => [...prev, ...curr], []);
}

type Infos = FeatureCalculationInfo | ValueCalcuationInfo;

/* Example payload
{
	"application-name": "feature-calculation",
	"application-version": "1.1",
	"features": {
		"Feature1": ["Foo.Bar.Baz", "What.Ever", "Age.Max"],
		"Feature2": ["node", "for", "newbies"]
	}
}
*/
export interface FeatureCalculationInfo {
	"application-name": "feature-calculation";
	"application-version": string,
	features: { [key: string]: string[] };
}

function isFeatureCalculationInfo(arg: any): arg is FeatureCalculationInfo {
	return arg["application-name"] === "feature-calculation";
}

/* Example payload
{
	"application-name" : "value-calculation",
	"application-version" : "1.1",
	"models" : [ {
		"feature-names" : "foo, bar, baz",
		"created" : "2018-08-16T11:00:00.000Z",
		"loaded-from-file" : "/home/models/model.zip",
		"version" : "1.0"
	} ]
}
*/
export interface ValueCalcuationInfo {
	"application-name": "value-calculation";
	"application-version": string,
	models: Model[];
}

export interface Model {
	'loaded-from-file': string;
	'feature-names': string;
	"created": string;
	"version": string;
}

function isValueCalcuationInfo(arg: any): arg is ValueCalcuationInfo {
	return arg["application-name"] === "value-calculation";
}

interface Result {
	modelPath: string
	unsupportedFeatures: string[]
}

export async function fetchInfosFrom(fcInfoUrl: string, vcInfoUrl: string): Promise<Infos[]> {
	return Promise.all([
		fetchJsonFrom(fcInfoUrl).then(json => json as FeatureCalculationInfo),
		fetchJsonFrom(vcInfoUrl).then(json => json as ValueCalcuationInfo)
	]);
}

async function fetchJsonFrom(url: string): Promise<any> {
	const response = await fetch(url, { "headers": { "accept": "application/json" } })
	return response.json();
}

function check(models: Model[], fcFeatureNames: string[]): Result[] {
	return models.map((model: Model) => {
		const modelPath: string = model['loaded-from-file']
		const modelFeatureNames: string[] = model['feature-names'].split(',').map((it) => it.trim())

		const unsupportedFeatures = modelFeatureNames.filter(featureName => !fcFeatureNames.includes(featureName))

		return { modelPath: modelPath, unsupportedFeatures: unsupportedFeatures }
	})
}

function containsFailures(results: Result[]): boolean {
	return results.some(result => result.unsupportedFeatures.length === 0);
}

function logFailures(results: Result[]) {
	for (const result of results) {
		console.log(`${result.unsupportedFeatures.length} unsupported ${pluralS('feature', result.unsupportedFeatures)} found in model ${result.modelPath}:`)
		console.log([...result.unsupportedFeatures].sort().join("\t"));
	}
}

function logFeatureNames(featureNames: string[]) {
	console.log(`${featureNames.length} ${pluralS('feature', featureNames)} found in feature-calculation info:`)
	console.log("\t" + [...featureNames].sort().join("\t"));
}

export function pluralS(noun: string, arr: any[]) {
	return `${noun}${arr.length > 1 ? 's' : ''}`
}
