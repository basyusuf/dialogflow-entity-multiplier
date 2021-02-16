import { Equals, IsDefined, IsObject } from 'class-validator';

export class RequestDTO {
    @Equals('POST')
    httpMethod: string;

    @IsDefined()
    body: any;
}
