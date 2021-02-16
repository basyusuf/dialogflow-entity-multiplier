import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import DTOValidator from '../helper/DTOValidator';
import { RequestDTO } from '../dto/Request.dto';
import { EntityMultiplier, EntityList, EntityInterface } from '../dto/EntityMultiplier.dto';
import { ServiceResponse } from '../helper/Response';
const BUCKETNAME = process.env.BucketName;
const AWS = require('aws-sdk');

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    // All log statements are written to CloudWatch
    console.info('received:', event);

    let checkRequestData = await DTOValidator(RequestDTO, event, 'Main Request Handler');
    if (checkRequestData) {
        return new ServiceResponse({statusCode:400,body:checkRequestData}).get();
    } else {
        //Use (try and catch) as much as possible
        try {
            const body = JSON.parse(event.body);
            const ErrorCheck = await DTOValidator(EntityMultiplier, body, 'Entity Multipler Validation');
            if (ErrorCheck) {
                console.info('System have validation error. List:', ErrorCheck);
                return new ServiceResponse({statusCode:400,body:ErrorCheck}).get();
            }
            const name = body.name;

            const options = {
                wrongKeys: body.wrongKeys ? body.wrongKeys : true,
                missedChars: body.missedChars ? body.missedChars : true,
                transposedChars: body.transposedChars ? body.transposedChars : true,
                doubleChars: body.doubleChars ? body.doubleChars : true,
                flipBits: body.flipBits ? body.flipBits : true,
                generateHomophones: body.generateHomophones ? body.generateHomophones : true,
            };

            const data: EntityList = body.data;
            let generatedTyposArr = generateItems(data, options);
            let dividedTyposArr = divideItems(generatedTyposArr);
            const generatedKey = `helper-${name}-${new Date().getTime()}.json`;
            let uploadTyposArr = await putObjectToS3(generatedKey, dividedTyposArr);
            let responseStatus: { status: boolean; url: string } = {
                status: false,
                url: null,
            };
            if (uploadTyposArr.status) {
                console.info(uploadTyposArr.data);
                responseStatus.status = true;
                responseStatus.url = `https://nestjs-task.s3.eu-central-1.amazonaws.com/${generatedKey}`;
            } else {
                console.info(uploadTyposArr.error);
            }
            return new ServiceResponse({statusCode:200,body:responseStatus}).get();
        } catch (err) {
            console.error(err);
            return new ServiceResponse({statusCode:500,body:err}).get();
        }
    }
};
let generateTypos = function (keywords: Array<string>, options: any) {
    const replaceElementForIndex = function (text: string, index: number, char: string) {
        return text.substr(0, index) + char + text.substr(index + char.length);
    };

    let keyboard: { [key: string]: Array<string> } = {
        '1': ['2', 'q'],
        '2': ['1', 'q', 'w', '3'],
        '3': ['2', 'w', 'e', '4'],
        '4': ['3', 'e', 'r', '5'],
        '5': ['4', 'r', 't', '6'],
        '6': ['5', 't', 'y', '7'],
        '7': ['6', 'y', 'u', '8'],
        '8': ['7', 'u', 'i', '9'],
        '9': ['8', 'i', 'o', '0'],
        '0': ['9', 'o', 'p', '-'],
        '-': ['0', 'p'],
        q: ['1', '2', 'w', 'a'],
        w: ['q', 'a', 's', 'e', '3', '2'],
        e: ['w', 's', 'd', 'r', '4', '3'],
        r: ['e', 'd', 'f', 't', '5', '4'],
        t: ['r', 'f', 'g', 'y', '6', '5'],
        y: ['t', 'g', 'h', 'u', '7', '6'],
        u: ['y', 'h', 'j', 'i', '8', '7'],
        i: ['u', 'j', 'k', 'o', '9', '8'],
        o: ['i', 'k', 'l', 'p', '0', '9'],
        p: ['o', 'l', '-', '0'],
        a: ['z', 's', 'w', 'q'],
        s: ['a', 'z', 'x', 'd', 'e', 'w'],
        d: ['s', 'x', 'c', 'f', 'r', 'e'],
        f: ['d', 'c', 'v', 'g', 't', 'r'],
        g: ['f', 'v', 'b', 'h', 'y', 't'],
        h: ['g', 'b', 'n', 'j', 'u', 'y'],
        j: ['h', 'n', 'm', 'k', 'i', 'u'],
        k: ['j', 'm', 'l', 'o', 'i'],
        l: ['k', 'p', 'o'],
        z: ['x', 's', 'a'],
        x: ['z', 'c', 'd', 's'],
        c: ['x', 'v', 'f', 'd'],
        v: ['c', 'b', 'g', 'f'],
        b: ['v', 'n', 'h', 'g'],
        n: ['b', 'm', 'j', 'h'],
        m: ['n', 'k', 'j'],
    };
    let gTypos: any[] = [];
    // Generate wrong key typos
    function wrongKeyTypos(wordInput: string): Array<string> {
        let word: string = wordInput.toLocaleLowerCase();
        let typos: any[] = [];
        let length = word.length;
        for (let i = 0; i < length; i++) {
            if (keyboard[word[i]]) {
                let tempWord = word;
                keyboard[word[i]].forEach(function (character: string) {
                    typos.push(replaceElementForIndex(tempWord, i, character).trim());
                });
            }
        }
        return typos;
    }
    // Generate missed character typos
    function missedCharsTypos(wordInput: string): Array<string> {
        let word = wordInput.toLocaleLowerCase();
        let typos = [];
        let length = word.length;
        for (let i = 0; i < length; i++) {
            let tempWord = '';
            if (i === 0) {
                tempWord = word.substring(i + 1);
            } else if (i + 1 === length) {
                tempWord = word.substring(0, i);
            } else {
                tempWord = word.substring(0, i);
                tempWord += word.substring(i + 1);
            }
            typos.push(tempWord);
        }
        return typos;
    }
    // Generate transposed character typos
    function transposedCharTypos(wordInput: string): Array<string> {
        let word = wordInput.toLocaleLowerCase();
        let typos = [];
        let length = word.length;
        for (let i = 0; i < length; i++) {
            if (i + 1 !== length) {
                let tempWord = word,
                    tempChar = tempWord[i];
                tempWord = replaceElementForIndex(tempWord, i, tempWord[i + 1]);
                tempWord = replaceElementForIndex(tempWord, i + 1, tempChar);
                typos.push(tempWord);
            }
        }
        return typos;
    }
    // Generate double character typos
    function doubleCharTypos(wordInput: string): Array<string> {
        let word = wordInput.toLocaleLowerCase();
        let typos = [];
        let length = word.length;
        for (let i = 0; i < length; i++) {
            let tempWord = word.substring(0, i + 1);
            tempWord += word[i];
            if (i !== length - 1) {
                tempWord += word.substring(i + 1);
            }
            typos.push(tempWord);
        }
        return typos;
    }

    function bitflipping(wordInput: string): Array<string> {
        let characters = wordInput.split('');
        let masks = [128, 64, 32, 16, 8, 4, 2, 1];
        let allowed_chars = /[a-zA-Z0-9_\-\.]/;
        let typos = [];
        for (let i = 0; i < characters.length; i++) {
            let c = characters[i];
            let flipped = masks
                .map(function (mask) {
                    return String.fromCharCode(c.charCodeAt(0) ^ mask).toLocaleLowerCase();
                })
                .filter(function (x) {
                    return x.match(allowed_chars);
                });
            typos.push(
                flipped.map(function (x) {
                    let e = wordInput;
                    return replaceElementForIndex(e, i, x);
                }),
            );
        }
        return typos.reduce(function (a, b) {
            return a.concat(b);
        });
    }

    keywords.forEach(function (keyword) {
        if (options.wrongKeys) {
            gTypos.push(wrongKeyTypos(keyword));
        }
        if (options.missedChars) {
            gTypos.push(missedCharsTypos(keyword));
        }
        if (options.transposedChars) {
            gTypos.push(transposedCharTypos(keyword));
        }
        if (options.doubleChars) {
            gTypos.push(doubleCharTypos(keyword));
        }
        if (options.flipBits) {
            gTypos.push(bitflipping(keyword));
        }
    });
    // Flatten the array of typos
    return gTypos.reduce(function (a, b) {
        return a.concat(b);
    });
};

function generateItems(data: EntityList, options: any): EntityList {
    let responseObj = data;
    let responseArr: any[] = [];
    data.entries.map((entry_item: any) => {
        let typos = generateTypos(entry_item.synonyms, options);
        let last_status = {
            ...entry_item,
            synonyms: typos,
        };
        responseArr.push(last_status);
    });
    console.log('Finished generate');
    responseObj.entries = responseArr;
    return responseObj;
}

function chunkFunc(array: Array<any>, perChunk: number): Array<any> {
    return array.reduce((resultArray, item, index: number) => {
        const chunkIndex = Math.floor(index / perChunk);

        if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = []; // Start a new chunk
        }

        resultArray[chunkIndex].push(item);

        return resultArray;
    }, []);
}

function divideItems(data: EntityList): EntityList {
    let responseObj = data;
    let responseArr: any[] = [];
    data.entries.map(async (item) => {
        let chunked = chunkFunc(item.synonyms, 199);
        chunked.map((chunk_item: Array<any>) => {
            let addedItem = {
                ...item,
                synonyms: chunk_item,
            };
            responseArr.push(addedItem);
        });
    });
    responseObj.entries = responseArr;
    return responseObj;
}

async function putObjectToS3(key: string, data: any):Promise<{status:boolean,data?:any,error?:any}> {
    console.info('Starting PutObject S3');
    let S3Bucket = new AWS.S3();

    let params = {
        Bucket: BUCKETNAME,
        Key: key,
        Body: JSON.stringify(data),
        ContentType: 'application/json',
        ACL: 'public-read',
    };
    console.info('S3 Params: ', params);
    try {
        const data = await S3Bucket.putObject(params).promise();
        console.info('Put success data:', data);
        return {
            status: true,
            data: JSON.stringify(data),
        };
    } catch (err) {
        console.info('Put object error:', err);
        return {
            status: false,
            error: err,
        };
    }
}
