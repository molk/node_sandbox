#!/usr/bin/env node

import fetch from 'node-fetch'

const fcInfoUrl = 'http://localhost:8081/actuator/info'
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

const vcInfoUrl = 'http://localhost:9081/actuator/info'
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

const retrieveInfo = (infoUrl: string) => fetch(infoUrl, {"headers": {"accept": "application/json"}})
const flatten = (arr: string[][] ) => arr.reduce( (a,b) => a.concat(b), [] )

Promise.all([
		retrieveInfo(fcInfoUrl),
		retrieveInfo(vcInfoUrl)
	]
	.map(result => result.then(response => response.json()))
)
.then(infos => {
	const fcFeatures = infos.find(info => info['application-name'] === 'feature-calculation').features
	const vcModels   = infos.find(info => info['application-name'] === 'value-calculation').models

	const fcFeatureNames: string[] = flatten(Object.values(fcFeatures)).sort()

	const results = vcModels.map( (model: any) => {
		const modelPath: string           = model['loaded-from-file']
		const modelFeatureNames: string[] = model['feature-names'].split(',').map( (it: string) => it.trim())

		const unsupportedFeatures = modelFeatureNames.filter(featureName => !fcFeatureNames.includes(featureName))

		return { modelPath: modelPath, diff: unsupportedFeatures }
	})

	console.log(results)
})
