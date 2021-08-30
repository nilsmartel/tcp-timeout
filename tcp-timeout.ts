#!/usr/local/bin/node

function help() {
  console.log("tsx-timeout <csv sampel rtt> <alpha> <beta> <deviatio>\n")
  process.exit()
}

let fs = require('fs')
let csvFile: string = process.argv[2]

if (csvFile == "--help" || csvFile === undefined) help()

let alpha = Number(process.argv[3])
let beta = Number(process.argv[4])
let deviation = Number(process.argv[5])

if (isNaN(alpha) || isNaN(beta) || isNaN(deviation)) help()

let outputFile = process.argv[7]

function parseCsv(inp: string): string[][] {
  return inp.toString().split(/\n/g).map(line => line.split(","))
}

let csv = parseCsv(fs.readFileSync(csvFile))

let sampleRTT: number[] = csv[0].map(Number)

// length of the RTT samples
const len: number = sampleRTT.length

// first estimate is first sample
let estimatedRTT: number[] = [sampleRTT[0]]
// fill estimates
for (let n = 1; n < len; n++) {
  let estimate: number = (1-alpha)*estimatedRTT[n-1] +
                alpha *sampleRTT[n]
  estimatedRTT.push(estimate)
}

let deviationRTT = [deviation]

for (let n = 1; n < len; n++) {
  let sample = sampleRTT[n]
  let estimated =  estimatedRTT[n]
  let prev = Math.abs(
     sample-estimated
  )
  let next = deviationRTT[n-1]

  let dev = (1-beta)*next + beta *prev
  deviationRTT.push(dev)
}

let timeout = []

for (let n = 0; n < len; n++) {
  timeout.push(
    estimatedRTT[n] + 4* deviationRTT[n]
  )
}

let result = [
  ["sampleRTT", ...sampleRTT],
  ["estimatedRTT", ...estimatedRTT],
  ["deviationRTT", ...deviationRTT],
  ["timeout", ...timeout],
]

function printCsv(inp) {
  let max = Math.max(inp.flat().map(n => n.toString().length))

  for (let row of inp) {
    console.log(row.map(col => appendSpace(col.toString(), max)).join(","))
  }
}

function appendSpace(s, n) {
  while (s.length < n) s+= " "
  return s
}

printCsv(result)
