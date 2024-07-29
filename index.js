const fs = require('fs');
const path = require('path');

class QueryParser {

    constructor(url) { 
        this.url = url;
        this.queryMap = new Map();
    }

    parse() {
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

    log() {
        console.log(this.queryMap);
    }
}

const testUrl = `https://www.ebrainsoft.com/?id=kmc774&favorite=001&favorite=002`;
queryParser = new QueryParser(testUrl);
queryParser.parse();
queryParser.log();


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
                    for (let v_ of v) {
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
    }

    parse() {
        // step 1. startline부분과 아닌 부분으로 양분
        const substr = this.httpMessage.split("\n");

        const splittedFirstLine = substr[0].split(" ");
        this.method = splittedFirstLine[0];
        this.path = splittedFirstLine[1];
        this.httpVersion = splittedFirstLine[2];

        this.headerFieldMap = new Map();

        for (let i = 1; i < substr.length; i++) {
            if (substr[i].includes(":")) {
                // const keyValPair = substr[i].split(":");
                // const key = keyValPair[0].trim();
                // const val = keyValPair[1].trim();
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
        
        if (this.headerFieldMap.get('Content-Type').some(element => element === "multipart/form-data")) {
            this.multipartBoundary = "--" + this.headerFieldMap.get("Content-Type").find(element => element.startsWith("boundary=")).split("boundary=")[1];
            const multiparts = this.httpMessage.split(this.multipartBoundary);
            for (let i = 1; i < multiparts.length-1; i++) {
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
            console.log('File saved successfully:', filename);
        } catch (err) {
            console.error('Error writing file:', err);
        }
    }
}

const testHttpResponse = `POST /file/upload HTTP/1.1
Content-Length: 344
Content-Type: multipart/form-data; boundary=-----r1_eDOWu7FpA0LJdLwCMLJQapQGu
Host: localhost:8080
Connection: Keep-Alive
User-Agent: Apache-HttpClient/4.3.4 (java 1.5)
Accept-Encoding: gzip,deflate
-------r1_eDOWu7FpA0LJdLwCMLJQapQGu
Content-Disposition: form-data; name=text1; filename=uploadFile1.txt
Content-Type: application/octet-stream

This is first file.
-------r1_eDOWu7FpA0LJdLwCMLJQapQGu
Content-Disposition: form-data; name=text2; filename=uploadFile2.txt
Content-Type: application/octet-stream

This is second file.
-------r1_eDOWu7FpA0LJdLwCMLJQapQGu--`;

multipartRequestParser = new MultipartRequestParser(testHttpResponse);
multipartRequestParser.parse();
console.log(multipartRequestParser.getHeader('Host'));
console.log(multipartRequestParser.getHeader("User-Agent"));

multipartRequestParser = new MultipartRequestParser();
multipartRequestParser.setMultipartFile("text1", "uploadFile1.txt");
multipartRequestParser.setMultipartFile("text2", "uploadFile2.txt");
multipartRequestParser.saveMultipartFile("C:/PS/parser/second.txt");