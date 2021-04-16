// 3rd party imports
const request = require('request') 

// Globals
const API_KEY = 'dict.1.1.20210216T114936Z.e4989dccd61b9626.373cddfbfb8a3b2ff30a03392b4e0b076f14cff9'
const FILE_URL = 'http://norvig.com/big.txt' // 'http://localhost:9000/sample.txt' // 


const wordLookup = word => {
    return new Promise((resolve, reject) => {
        let url = `https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=${API_KEY}&lang=en-en&text=${word}`
        request(url, (err, resp, body) => {
            if (err) {
                reject(err)
            }
            return resolve(body)
        })
    })
}

const getFileContentFromUrl = (url) => {
    return new Promise((resolve, reject) => {
        request(url, (err, resp, body) => {
            if (err) {
                reject(err)
            }
            resolve(body)
        })
    })
}


const findSynonymsAndPos = word => {
    return new Promise((resolve, reject) => {
        wordLookup(word).then(data => {
            data = JSON.parse(data)
            let finalObj = {}

            if (data.def && data.def.length) {
                let { syn, pos } = data.def[0]
                finalObj.synonyms = syn ? syn : "synonyms not found"
                finalObj.pos = pos ? pos : "POS not found"
            } else {
                finalObj.synonyms = 'synonyms not found'
                finalObj.pos = 'POS not found'
            }
            return resolve(finalObj)
        }, err => {
            reject(err)
        })
    })
}

const getUniqWordsWithPosSynonyms = (string, TOP_N) => {
    return new Promise(async resolve => {
        let specialCharsReg = /[:{}().,-/#!$%^&*;=\-_`~]/g
        let filteredString = string.replace(specialCharsReg, '')
        let words = filteredString.split(' ')

        words = words.filter(word => /\S/.test(word));

        let wordCount = {}
        for (let word of words) {
            wordCount[word] = (wordCount[word] || 0) + 1
        }

        let uniqueWords = Object.keys(wordCount);
        let topWords = uniqueWords.sort((a, b) => wordCount[b] - wordCount[a]).slice(0, TOP_N);
        let op = []

        for (let word of topWords) {
            let resp = await findSynonymsAndPos(word).catch(e => false)
            if (!resp) { continue }
            let data = {
                word,
                output: {
                    count: wordCount[word],
                    ...resp
                }
            }
            op.push(data)
        }

        op = op.sort((a, b) => b.output.count - a.output.count)
        return resolve(op)
    })
}

const main = (fileUrl, top_n) => {
    getFileContentFromUrl(fileUrl).then(fileData => {
        getUniqWordsWithPosSynonyms(fileData, top_n).then(data => {
            console.log(data, `Top ${top_n} results : `)
        }, err => {
            console.log(err, 'Error occured')
        })
    })
}

// Start 
main(FILE_URL, 10)
