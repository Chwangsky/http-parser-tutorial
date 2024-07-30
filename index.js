const fs = require('fs');
const path = require('path');
const assert = require('assert');

class Multipart {
    constructor(multipartString) { 
        this.multipartheaderFieldMap = new Map();
        
        multipartString = multipartString.trim();
        this.multipartContent = multipartString.split("\n\n")[1];
        
        const multipartLine = multipartString.split("\n");

        for (let i = 0; i < multipartLine.length; i++) {
            if (multipartLine[i].includes(":")) {
                multipartLine[i].indexOf(":");
                const indexOfSemicolon = multipartLine[i].indexOf(":");
                const key = multipartLine[i].substring(0, indexOfSemicolon).trim();
                const val = multipartLine[i].substring(indexOfSemicolon + 1).trim();
                if (val.includes(";")) {
                    const valArr = []
                    const v = val.split(";");
                    for (const v_ of v) {
                        valArr.push(v_.trim());
                    }
                    this.multipartheaderFieldMap.set(key, valArr);
                } else {
                    this.multipartheaderFieldMap.set(key, [val]);
                }
            } else break;
        }
    }
} 


class MultipartRequestParser {

    constructor(httpMessage) { 
        this.httpMessage = httpMessage;
        this.multiparts=[];
        this.headerFieldMap = new Map();
        if (httpMessage !== undefined) {
            this.#parse(); // js에서는 생성자 오버로딩이 안되서, 이렇게 처리
        }
        
    }

    setMultipartFile(filename, originalFileName) {
        // 파일 경로를 지정
        const filePath = path.join(__dirname, originalFileName);

        try {
            // 파일을 동기적으로 읽기
            const data = fs.readFileSync(filePath, 'utf8');

            let multipartText = 
`Content-Disposition: form-data; name="text${filename}"; filename="${originalFileName}"
Content-Type: application/octet-stream

${data}`;
            this.multiparts.push(new Multipart(multipartText));
        } catch (err) {
            console.error('Error reading file:', err);
        }
    }

    saveMultipartFile(filename) {
        let content = "";
        for (let multipart of this.multiparts) {
            content += multipart.multipartContent + "\n";
        }

        try {
            fs.writeFileSync(filename, content);
        } catch (err) {
            console.error('Error writing file:', err);
        }
    }

    getMethod() {
        return this.method;
    }

    #parse() {
        // step 1. startline부분과 아닌 부분으로 양분
        const substr = this.httpMessage.split(/\r?\n/);

        const splittedFirstLine = substr[0].split(/\s+/);
        this.method = splittedFirstLine[0];
        this.path = splittedFirstLine[1];
        this.httpVersion = splittedFirstLine[2];

        for (let i = 1; i < substr.length; i++) {
            if (substr[i].includes(":")) {
                const indexOfSemicolon = substr[i].indexOf(":");
                const key = substr[i].substring(0, indexOfSemicolon).trim();
                const val = substr[i].substring(indexOfSemicolon + 1).trim();
                if (val.includes(";")) {
                    const valArr = []
                    const v = val.split(";");
                    for (let v_ of v) {
                        valArr.push(v_.trim());
                    }
                    this.headerFieldMap.set(key, valArr);
                } else {
                    this.headerFieldMap.set(key, [val]);
                }
            }
            else break;
        }

        if (this.headerFieldMap.get("Content-Type").some(element => element === "multipart/form-data")) {
            this.multipartBoundary = "--" + this.headerFieldMap.get("Content-Type").find(element => element.startsWith("boundary=")).split("boundary=")[1];
            const multiparts = this.httpMessage.split(this.multipartBoundary);
            for (let i = 1; i < multiparts.length - 1; i++) {
                this.multiparts.push(new Multipart(multiparts[i]));
            }

        }
        // console.log(this.headerFieldMap.get('Content-Type'));
        // console.log(this.headerFieldMap);
        // console.log(this.multiparts);
    }

    getHeader(header) {
        if (this.headerFieldMap.get(header).length > 1) {
            return this.headerFieldMap.get(header);
        }
        return this.headerFieldMap.get(header)[0];
    }
}


// PROBLEM 2
const testHttpResponse = fs.readFileSync("request-dummy.txt", 'utf8');
multipartRequestParser = new MultipartRequestParser(testHttpResponse);
assert.strictEqual(multipartRequestParser.getMethod(), "POST");
assert.strictEqual(multipartRequestParser.getHeader('Host'), "localhost:8080");
assert.strictEqual(multipartRequestParser.getHeader("User-Agent"), "Apache-HttpClient/4.3.4 (java 1.5)");

// PROBLEM 3
multipartRequestParser = new MultipartRequestParser();
multipartRequestParser.setMultipartFile("text1", "uploadFile1.txt");
multipartRequestParser.setMultipartFile("text2", "uploadFile2.txt");
multipartRequestParser.saveMultipartFile("C:/PS/parser/second.txt");