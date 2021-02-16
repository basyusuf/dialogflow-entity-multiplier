# This is the SAM template that represents the architecture of your serverless application

# https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-template-basics.html

AWSTemplateFormatVersion: 2010-09-09
Description: >-
Dialogflow Entity Multiplier
Transform:

-   AWS::Serverless-2016-10-31
    Globals:
    Function:
    Timeout: 5
    Runtime: nodejs12.x
    Environment:
    Variables:
    AWS: true
    Resources:
    Type: AWS::Serverless::Function
    Properties:
    Layers: - arn:aws:lambda:eu-central-1:208565301474:layer:typescriptmodule:1
    Handler: build/handlers/index.entityMultiplier
    Runtime: nodejs12.x
    MemorySize: 256
    Timeout: 100
    Description: entityMultiplier
    Policies:
    S3CrudPolicy:
    BucketName: !Ref BucketName
    Environment:
    Variables:
    BucketName: !Ref BucketName
    Events:
    Api:
    Type: Api
    Properties:
    Path: /entityMultiplier
    Method: POST

Outputs:
WebEndpoint:
Description: 'API Gateway endpoint URL for General Helpers'
Value: !Sub 'https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/dialogflow-entity-multiplier/'
Parameters:
BucketName:
Description: 'File buckets'
Type: 'String'
Default: 'nestjs-task'
