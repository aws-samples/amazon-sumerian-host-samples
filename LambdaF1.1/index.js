const Alexa = require('ask-sdk-core');

const HelloWorldIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' 
      || (request.type === 'IntentRequest' 
        && request.intent.name === 'stop_sumerian_host')
        || (request.type === 'IntentRequest' 
        && request.intent.name === 'show_on_tv');
  },
  handle(handlerInput) {
    var speechText = 'Ok';
    console.log('Slots----------->>>>'+JSON.stringify(handlerInput.requestEnvelope.request.intent.slots));
    // Load the AWS SDK for Node.js
    var AWS = require('aws-sdk');
    // Set the region 
    AWS.config.update({region: 'us-east-1'});
    
    // Create an SQS service object
    var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var reactiondata='Stop';
    var extra="AWS";
    var serviceurl1="https://www.youtube.com/embed/mZ5H8sn_2ZI";
    
    //identify action and set the reaction variable
    if(null!=handlerInput.requestEnvelope.request.intent.slots.action.value){
      console.log('====> action identified is --> '+handlerInput.requestEnvelope.request.intent.slots.action.value);
      reactiondata=handlerInput.requestEnvelope.request.intent.slots.action.value;
    
    //if action is show..
      if(reactiondata=='show'){
        if(null!=handlerInput.requestEnvelope.request.intent.slots.service){
          console.log('====> service identified is --> '+handlerInput.requestEnvelope.request.intent.slots.service.value);
          extra=handlerInput.requestEnvelope.request.intent.slots.service.value;
          
          var params = {
            TableName: 'LexLog',
      		  ProjectionExpression: 'LexLogId, servicevalue, serviceurl',
      		  KeyConditionExpression: 'LexLogId = :svc',
      		  ExpressionAttributeValues: {
                ":svc": {'S':extra.toString()}
            },
      		  TableName: 'LexLog'
      		};
      		try{
      		    ddb.query(params, function(err, data) {
                if (err) {
                  console.log("Error", err);
                } else {
                  console.log("Success in lexlog", data.Items);
                  console.log(data.Items[0].serviceurl);
                  serviceurl1=data.Items[0].serviceurl.S;
                  console.log('serviceurl'+serviceurl1);
                  serviceurl1=serviceurl1+'';
                  console.log('service url corrected '+serviceurl1);
                  // Call DynamoDB to add the item to the table
                  var params = {
                    TableName: 'SumerianDemo2',
                    Item: {
                      'id' : {S: new Date().getTime().toString()},
                      'reaction' : {S: reactiondata},
                      'extradata': {S: extra},
                      'username' : {S : 'Bala'},
                      'svcurl'   : {S : serviceurl1},
                      'session'  : {S:'default'}
                    }
                  };
                  ddb.putItem(params, function(err, data) {
                    if (err) {
                      console.log("Error", err);
                    } else {
                      console.log("Success", data);
                    }
                  });
                }
              });
      		}
      		catch(err){
      			console.log("could not read lexlog table : "+err);
      		}
      		
        }
      }
    //if the action is stop
      else if(reactiondata=='stop')
      {
          // Call DynamoDB to add the item to the table
          var params = {
            TableName: 'SumerianDemo2',
            Item: {
              'id' : {S: new Date().getTime().toString()},
              'reaction' : {S: reactiondata},
              'extradata': {S: extra},
              'username' : {S : 'Bala'},
              'url': {S : serviceurl1},
              'session' : {S:'default'}
            }
          };
          ddb.putItem(params, function(err, data) {
            if (err) {
              console.log("Error", err);
            } else {
              console.log("Success", data);
            }
          });
      }
    
    }
    
    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can stop the host!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder
    .reprompt('Sorry,Please say again.')
    .getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, Please say again.')
      .reprompt('Sorry,Can you repeat?.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    HelloWorldIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();