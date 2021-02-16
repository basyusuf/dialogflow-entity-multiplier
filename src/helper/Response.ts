interface IResponse {
    body:any;
    statusCode:number;
}
export class ServiceResponse implements IResponse{
    body: any;
    statusCode: number;
    error_codes = [500,501,502,503];
    constructor(data:IResponse){
        this.body = data.body;
        this.statusCode = data.statusCode;
    }
    get(){
        if(this.error_codes.includes(this.statusCode)){
            console.log("System have error");
        }
        return {
            statusCode:this.statusCode,
            body:JSON.stringify(this.body),
            headers:{
                'Content-Type':'application/json'
            }
        };
    }
}