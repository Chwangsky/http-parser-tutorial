const assert = require('assert');

class QueryParser {

    constructor(url) { 
        this.url = url;
        this.queryMap = new Map();
        this.#parse();
    }

    #parse() {
        const queryString = this.url.split("?")[1];
        const splitedQueryString = queryString.split("&");

        this.queryMap.clear();
        for (let queryString of splitedQueryString) {
            const splitedQueryString = queryString.split("=");
            const key = splitedQueryString[0];
            const val = splitedQueryString[1];
            if(!this.queryMap.has(key)) {
                this.queryMap.set(key, [val] );
            } else {
                this.queryMap.get(key).push(val);
            }
        }
    }

    getParam(param) {
        return this.queryMap.get(param)[0];
    }

    getParams(param) {
        return this.queryMap.get(param);
    }

    // for debugging
    log() {
        console.log(this.queryMap);
    }
}

const testUrl = `https://www.ebrainsoft.com/?id=kmc774&favorite=001&favorite=002`;
queryParser = new QueryParser(testUrl);

assert.strictEqual(1, 1);
assert.strictEqual("kmc774", queryParser.getParam("id"));
assert.strictEqual(2, queryParser.getParams("favorite").length);
assert(Array.isArray(queryParser.getParams("favorite")));
assert.strictEqual("001", queryParser.getParams("favorite")[0]);
assert.strictEqual("002", queryParser.getParams("favorite")[1]);