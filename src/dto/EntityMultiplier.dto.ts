import { IsString, IsDefined, IsObject, IsEnum, IsOptional, IsBoolean } from 'class-validator';
export interface EntityInterface {
    value: string;
    synonyms: Array<string>;
}
export interface EntityList {
    entries: Array<EntityInterface>;
}

export class EntityMultiplier {
    @IsDefined()
    @IsObject()
    data: EntityList;

    @IsDefined()
    @IsString()
    name:string;


    @IsOptional()
    @IsBoolean()
    wrongKeys:boolean;

    @IsOptional()
    @IsBoolean()
    missedChars: boolean;

    @IsOptional()
    @IsBoolean()
    transposedChars: boolean;

    @IsOptional()
    @IsBoolean()
    doubleChars: boolean;
    
    @IsOptional()
    @IsBoolean()
    flipBits:boolean;

    @IsOptional()
    @IsBoolean()
    generateHomophones: boolean;
}
