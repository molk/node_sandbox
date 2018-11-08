#!/usr/bin/env node

import * as Path from 'path';
import { fetchInfosFrom, processInfos } from "./feature_check";

// TODO: use https://github.com/yargs/yargs for als this cli stuff
function usage() {
	const scriptName = Path.basename(process.argv[1])
	console.log(`usage: ${scriptName} feature-calculation-host-and-port value-calculation-host-and-port`)
	console.log(`e.g. ${scriptName} prod-feature-calculation:8081 prod-value-calculation:8081`)
}

function urlsFrom(args: string[]): string[] {
	return args.slice(2).map(host => `http://${host}/actuator/info`)
}
function isVerboseFrom(args: string[]): boolean {
	return args.length > 4 && args[4] === '-v'
}

if (process.argv.slice(2).length < 2) {
	usage()
	process.exit(1)
}

const [fcInfoUrl, vcInfoUrl] = urlsFrom(process.argv)
const isVerbose = isVerboseFrom(process.argv)
// end yargs

console.log('Retrieving feature infos ...')
processInfos(fetchInfosFrom(fcInfoUrl, vcInfoUrl), isVerbose).catch(err => { throw err });
