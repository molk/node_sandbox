//TODO: setup mocha and ts-node to run tests

import * as Assert from "assert";
import { FeatureCalculationInfo, ValueCalcuationInfo, processInfos, featureNamesFrom, pluralS } from "../main/feature_check";

Assert.strictEqual(pluralS("noun", ["n1", "n2"]), "nouns");
Assert.strictEqual(pluralS("noun", ["n1"]), "noun");
Assert.strictEqual(pluralS("noun", []), "noun");

const featureCalculationInfo: FeatureCalculationInfo = {
	"application-name": "feature-calculation",
	"application-version": "1.1",
	"features": {
		"Feature1": ["Foo.Bar.Baz", "What.Ever", "Age.Max", "duplicate"],
		"Feature2": ["node", "for", "newbies", "duplicate"]
	}
}

const valueCalcuationInfo: ValueCalcuationInfo = {
	"application-name": "value-calculation",
	"application-version": "1.1",
	"models": [{
		"feature-names": "foo, bar, baz",
		"created": "2018-08-16T11:00:00.000Z",
		"loaded-from-file": "/home/models/model.zip",
		"version": "1.0"
	}]
}
const featureNames = featureNamesFrom(featureCalculationInfo);
Assert.deepStrictEqual(featureNames, ["Foo.Bar.Baz", "What.Ever", "Age.Max", "duplicate", "node", "for", "newbies", "duplicate"]);

const infoPromieses = Promise.all([Promise.resolve(featureCalculationInfo), Promise.resolve(valueCalcuationInfo)]);
Assert.doesNotReject(processInfos(infoPromieses, false));
