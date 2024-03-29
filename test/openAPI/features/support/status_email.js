const chai = require('chai');
const { spec } = require('pactum');
const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const {
  localhost,
  defaultResponseTime,
  statusEmailEndpoint,
  sendSingleEmailEndpoint,
  sendBatchEmailsEndpoint,
  sendEmailSingleRequestBody,
  contentTypeHeader,
  allowHeaderGet,
  acceptHeader,
  areArraysTheSame,
  sortArray,
  statusEmailResponseSchema,
} = require('./helpers/helpers');

chai.use(require('chai-json-schema'));

let specStatusEmail;
let specSendEmail;

let requestUID;

const baseUrl = localhost + statusEmailEndpoint;
const singleEmailUrl = localhost + sendSingleEmailEndpoint;
const batchEmailUrl = localhost + sendBatchEmailsEndpoint;
const endpointTag = { tags: `@endpoint=/${statusEmailEndpoint}` };

Before(endpointTag, () => {
  specStatusEmail = spec();
  specSendEmail = spec();
});

// Scenario: User successfully checks a status of an email smoke type test
Given(
  'User has sent a single email with given {string} as api_key and valid payload and got requestUID',
  async apiKey => {
    specSendEmail
      .post(singleEmailUrl)
      .withHeaders('api_key', apiKey)
      .withHeaders(acceptHeader.key, acceptHeader.value)
      .withBody(sendEmailSingleRequestBody);

    await specSendEmail.toss();

    requestUID = specSendEmail._response.json.requestUID;
    requestUID = requestUID === undefined ? '' : requestUID;

    chai
      .expect(requestUID.length)
      .to.be.greaterThan(0, 'Could not send an email to retrieve requestUID');
  }
);

Given(
  'User wants to check the status of the email',
  () => 'User wants to check the status of the email'
);

When(
  'User sends {string} request with {string} as api_key and valid requestUID',
  (method, apiKey) =>
    specStatusEmail
      .withMethod(method)
      .withPath(baseUrl)
      .withHeaders('api_key', apiKey)
      .withHeaders(acceptHeader.key, acceptHeader.value)
      .withHeaders('requestUID', requestUID)
);

When(
  'User selects to see all statuses {string}, {string}, {string}, {string}, {string} and {string}',
  (scheduled, processing, deferred, bounced, notSent, delivered) => {
    specStatusEmail.withQueryParams('status[]', scheduled);
    specStatusEmail.withQueryParams('status[]', processing);
    specStatusEmail.withQueryParams('status[]', deferred);
    specStatusEmail.withQueryParams('status[]', bounced);
    specStatusEmail.withQueryParams('status[]', notSent);
    specStatusEmail.withQueryParams('status[]', delivered);
  }
);

Then(
  'User receives a response from the \\/status\\/email endpoint',
  async () => await specStatusEmail.toss()
);

Then(
  'The \\/status\\/email response should be returned in a timely manner 15000ms',
  () =>
    specStatusEmail.response().to.have.responseTimeLessThan(defaultResponseTime)
);

Then('The \\/status\\/email response should have status 200', () =>
  specStatusEmail.response().to.have.status(200)
);

Then(
  'The \\/status\\/email response should have {string}: {string} header',
  (key, value) =>
    specStatusEmail
      .response()
      .should.have.headerContains(key, value)
);

Then('The \\/status\\/email response should match json schema', () =>
  chai
    .expect(specStatusEmail._response.json)
    .to.be.jsonSchema(statusEmailResponseSchema)
);

Then(
  'The \\/status\\/email response should have all statuses which the user selected',
  () => {
    const sentStatuses = Object.values(
      specStatusEmail._request.queryParams
    ).toString();
    const sentStatusesArr = sentStatuses.split(',').map(item => {
      return item.trim();
    });

    const receivedStatused = Object.keys(
      specStatusEmail._response.json
    ).toString();
    const receivedStatusedArr = receivedStatused.split(',').map(item => {
      return item.trim();
    });

    chai
      .expect(
        areArraysTheSame(
          sortArray(sentStatusesArr),
          sortArray(receivedStatusedArr)
        )
      )
      .to.be.equals(true);
  }
);

// Scenario: User successfully checks a status of emails sent in batch smoke type test
// Other Given, When, Then are written in the aforementioned examples
Given(
  'User has sent a batch of emails with given {string} as api_key and valid payload and got requestUID',
  async apiKey => {
    specSendEmail
      .post(batchEmailUrl)
      .withHeaders('api_key', apiKey)
      .withHeaders(acceptHeader.key, acceptHeader.value)
      .withBody(sendEmailSingleRequestBody);

    await specSendEmail.toss();

    requestUID = specSendEmail._response.json.requestUID;
    requestUID = requestUID === undefined ? '' : requestUID;

    chai
      .expect(requestUID.length)
      .to.be.greaterThan(0, 'Could not send an email to retrieve requestUID');
  }
);

// Scenario Outline: User successfully checks a status of an email
// Other Given, When, Then are written in the aforementioned examples
When('User selects to fetch the data for: {string}', statuses => {
  const statusArray = statuses.split(',').map(item => {
    return item.trim();
  });

  statusArray.forEach(status =>
    specStatusEmail.withQueryParams('status[]', status)
  );
});

// Scenario Outline: User cannot check the status the single email sent due to unallowed method in the request
// Other Given, When, Then are written in the aforementioned examples
Then(
  'The \\/status\\/email response should have status 405 - Method not allowed',
  () => specStatusEmail.response().to.have.status(405)
);

Then(
  'The \\/status\\/email response should contain Allow header with GET method which is allowed',
  () =>
    specStatusEmail
      .response()
      .to.have.headerContains(allowHeaderGet.key, allowHeaderGet.value)
);

// Scenario Outline: User cannot check the status of emails sent in batch due to unallowed method in the request
// Given, When, Then are written in the aforementioned examples

// Scenario: User is unable to check the status of an email due to missing required api_key in the request
// Other Given, When, Then are written in the aforementioned examples
When('User sends {string} request with valid requestUID', method =>
  specStatusEmail
    .withMethod(method)
    .withPath(baseUrl)
    .withHeaders(acceptHeader.key, acceptHeader.value)
    .withHeaders('requestUID', requestUID)
);

When(
  'The \\/status\\/email request is missing an api_key',
  () => 'The request is missing an api_key'
);

// Scenario: User is unable to check the status of an email due to missing required requestUID in the request
// Other Given, When, Then are written in the aforementioned examples
When('User sends {string} request with {string} as api_key', (method, apiKey) =>
  specStatusEmail
    .withMethod(method)
    .withPath(baseUrl)
    .withHeaders('api_key', apiKey)
    .withHeaders(acceptHeader.key, acceptHeader.value)
);

When(
  'The \\/status\\/email request is missing a requestUID',
  () => 'The request is missing a requestUID'
);

// Scenario: User is unable to check the status of an email due to missing required status in the request
// Other Given, When, Then are written in the aforementioned examples
When(
  'User did not select any statuses that he wants to fetch',
  () => 'User did not select any statuses that he wants to fetch'
);

// Scenario: User is unable to check the status of the email due to missing required api_key, requestUID and status in the request
// Other Given, When, Then are written in the aforementioned examples
When(
  'User sends {string} request without required api_key, requestUID and status',
  method =>
    specStatusEmail
      .withMethod(method)
      .withPath(baseUrl)
      .withHeaders(acceptHeader.key, acceptHeader.value)
);

After(endpointTag, () => {
  specStatusEmail.end();
  specSendEmail.end();
});
