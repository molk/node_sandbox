#!/usr/bin/env node

import fetch from 'node-fetch'
import { Response as FetchResponse } from 'node-fetch'
import * as Path from 'path'

if (process.argv.slice(2).length < 2) {
	usage()
	process.exit(1)
}

const [fcInfoUrl, vcInfoUrl] = urlsFrom(process.argv)
const isVerbose = isVerboseFrom(process.argv)

println('Retrieving feature infos ...')

fetchInfosFrom([fcInfoUrl, vcInfoUrl]).then( (infos: any[]) => {

	const fcInfo: FeatureCalculationInfo = infos.find(info => info['application-name'] === 'feature-calculation')
	const vcInfo: ValueCalcuationInfo    = infos.find(info => info['application-name'] === 'value-calculation')

	const fcFeatureNames: string[] = flatten(Object.values(fcInfo.features)).sort()
	const models: Model[] = vcInfo.models

	if (isVerbose) {
		logFeatureNames(fcFeatureNames)
	}

	const results: Result[] = check(models, fcFeatureNames)

	if (!containsFailures(results)) {
		println('OK')
	}
	else {
		println('FAILED')
		logFailures(results)
	}
})

interface FeatureCalculationInfo  {
	features: Map<string,string[]>  
	/* Example payload
	{
		"application-name" : "feature-calculation",
		"application-version" : "1.1",
		"features" : {
			"Feature1" : [ "Foo.Bar.Baz", "What.Ever", "Age.Max" ],
			"Feature2" : [ "node", "for", "newbies" ]
		}
	}
	*/
}

interface ValueCalcuationInfo  {
	models: Model[]
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
}

interface Model {
	'loaded-from-file': string
	'feature-names': string 
}
interface Result {
	modelPath: string
	unsupportedFeatures: string[] 
}

function fetchInfosFrom(infoUrls: string[]): Promise<any[]> {
	return Promise.all(
		infoUrls
			.map(url => fetchInfoFrom(url))
			.map(result => result.then(response => response.json()))
	)
}

function fetchInfoFrom(infoUrl: string): Promise<FetchResponse> {
	return fetch(infoUrl, {"headers": {"accept": "application/json"}})
}

function check(models: Model[], fcFeatureNames: string[]): Result[] {
	return models.map( (model: Model) => {
		const modelPath: string           = model['loaded-from-file']
		const modelFeatureNames: string[] = model['feature-names'].split(',').map( (it: string) => it.trim() )

		const unsupportedFeatures = modelFeatureNames.filter(featureName => !fcFeatureNames.includes(featureName))

		return { modelPath: modelPath, unsupportedFeatures: unsupportedFeatures }
	})
}

function containsFailures(results: Result[]): boolean {
	return results.some(result => !isEmpty(result.unsupportedFeatures))
}

function logFailures(results: Result[]) {
	results.forEach(result => {
		println(`${result.unsupportedFeatures.length} unsupported ${pluralS('feature', result.unsupportedFeatures)} found in model ${result.modelPath}:`)
		result.unsupportedFeatures.sort().forEach(it => console.log(`\t${it}`))
	})
}

function isEmpty(arr: Array<any>): boolean {
	return arr.length <= 0
}

function flatten(arr: string[][]): string[] {
	return arr.reduce( (a,b) => a.concat(b), [] )
}

function pluralS(noun: string, arr: any[]) {
	return `${noun}${arr.length > 1 ? 's' : ''}`
}

function println(obj: any) {
	console.log(obj)
}

function urlsFrom(args: string[]): string[] {
	return args.slice(2).map(host => `http://${host}/actuator/info`)
}
function isVerboseFrom(args: string[]): boolean {
	return args.length > 4 && args[4] === '-v'
}

function logFeatureNames(featureNames: string[]) {
	println(`${featureNames.length} ${pluralS('features', featureNames)} found in feature-calculation info:`)
	featureNames.sort().forEach(it => console.log(`\t${it}`))
}

function usage() {
	const scriptName = Path.basename(process.argv[1])
	println(`usage: ${scriptName} feature-calculation-host-and-port value-calculation-host-and-port`)
	println(`e.g. ${scriptName} prod-feature-calculation:8081 prod-value-calculation:8081`)
}
